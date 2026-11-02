"""Records the app's voice clips with Kokoro (https://huggingface.co/hexgrad/Kokoro-82M, Apache-2.0).

Setup (Python 3.10-3.12):
    py -3.12 -m venv .kokoro-env
    .kokoro-env\\Scripts\\python -m pip install "kokoro>=0.9.4" soundfile

Run:
    node scripts/voice/manifest.mjs
    .kokoro-env\\Scripts\\python scripts/voice/generate.py --set female [--speed 0.9] [--force]
    .kokoro-env\\Scripts\\python scripts/voice/generate.py --set male
    .kokoro-env\\Scripts\\python scripts/voice/generate.py --check a live read   (print how words will be said)

Clips that already exist are skipped unless --force is given.
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "scripts" / "voice" / "manifest.json"
OUT = ROOT / "assets" / "audio"
RATE = 24000
# The app's voice choices and the Kokoro voice used for each. Keep in sync with VOICES in manifest.mjs.
VOICE_SETS = {"female": "af_heart", "male": "am_michael"}


def trim(audio: np.ndarray, threshold: float = 0.004, pad: float = 0.06) -> np.ndarray:
    """Cuts silence from both ends, leaving a short natural gap."""
    loud = np.where(np.abs(audio) > threshold)[0]
    if len(loud) == 0:
        return audio
    p = int(pad * RATE)
    return audio[max(0, loud[0] - p) : min(len(audio), loud[-1] + p)]


def synthesize(pipeline: KPipeline, text: str, voice: str, speed: float) -> np.ndarray:
    parts = [np.asarray(audio) for _, _, audio in pipeline(text, voice=voice, speed=speed) if audio is not None]
    audio = trim(np.concatenate(parts))
    peak = np.max(np.abs(audio)) or 1.0
    return (audio / peak * 0.89).astype(np.float32)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--set", default="female", choices=sorted(VOICE_SETS), help="which voice folder to record")
    parser.add_argument("--voice", help="Kokoro voice id (defaults to the set's voice)")
    parser.add_argument("--speed", type=float, default=0.9)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only", nargs="*", help="record just these clip keys")
    parser.add_argument("--check", nargs="*", help="print phonemes for these texts and exit")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")  # phoneme symbols on Windows consoles
    args.voice = args.voice or VOICE_SETS[args.set]
    out = OUT / args.set

    pipeline = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")

    if args.check:
        for text in args.check:
            phonemes = " | ".join(ps for _, ps, _ in pipeline(text, voice=args.voice))
            print(f"{text!r:30} -> {phonemes}")
        return

    out.mkdir(parents=True, exist_ok=True)
    clips = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if args.only:
        clips = [c for c in clips if c["key"] in args.only]

    made = 0
    for i, clip in enumerate(clips, 1):
        path = out / f"{clip['file']}.mp3"
        if path.exists() and not args.force:
            continue
        audio = synthesize(pipeline, clip["text"], args.voice, clip.get("speed", args.speed))
        sf.write(path, audio, RATE, format="MP3", subtype="MPEG_LAYER_III")
        made += 1
        print(f"[{i}/{len(clips)}] {clip['key']}")

    print(f"Recorded {made} clips into {out}")


if __name__ == "__main__":
    main()
