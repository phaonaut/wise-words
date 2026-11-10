"""Cuts Gemini recordings (one WAV per batch, see gemini-prompts.md) into the app's clips.

Put the downloads in voice-recordings/<batch>.wav, then run (see the README for the one-time Python setup):
    .voice-env\\Scripts\\python scripts/voice/split.py              (every batch found)
    .voice-env\\Scripts\\python scripts/voice/split.py words-prek   (just one)

A batch is only written when the number of spoken pieces matches the number of lines in its script,
so a skipped or repeated word never puts audio in the wrong clip. Needs numpy and soundfile.
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
BATCHES = ROOT / "scripts" / "voice" / "gemini-batches.json"
RECORDINGS = ROOT / "voice-recordings"
OUT = ROOT / "assets" / "audio"
FRAME = 0.02  # seconds per loudness frame
MIN_GAP = 0.9  # a silence at least this long separates two lines (the script asks for a long pause)
PAD = 0.06  # silence kept at each end of a clip
SOFT = 0.004  # share of the loudest moment that still counts as a soft speech sound
BRIDGE = 0.12  # a soft sound can sit this far past a moment of silence (the "t" ending "eight")
MAX_GROW = 0.3  # most a clip's edge can move outwards, so it doesn't pick up a breath


def loudness(audio: np.ndarray, rate: int) -> np.ndarray:
    """Loudness of each FRAME-long slice."""
    f = int(rate * FRAME)
    return np.sqrt(np.mean(audio[: len(audio) // f * f].reshape(-1, f) ** 2, axis=1))


def pieces(audio: np.ndarray, rate: int, min_gap: float = MIN_GAP) -> list[tuple[int, int]]:
    """Start and end sample of each spoken piece, split on silences of at least min_gap seconds."""
    f = int(rate * FRAME)
    rms = loudness(audio, rate)
    loud = rms > max(0.005, rms.max() * 0.04)
    found, start, quiet = [], None, 0
    for i, on in enumerate(loud):
        if on:
            if start is None:
                start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet * FRAME >= min_gap:
                found.append((start, i - quiet + 1))
                start, quiet = None, 0
    if start is not None:
        found.append((start, len(loud)))
    # Ignore clicks and breaths too short to be a word.
    return [(s * f, e * f) for s, e in found if (e - s) * FRAME >= 0.12]


def widen(audio: np.ndarray, rate: int, found: list[tuple[int, int]]) -> list[tuple[int, int]]:
    """Grows each piece outwards over soft sounds at its edges.

    Splitting only looks for the loud part of each word, which would cut off quiet sounds
    like the "f" in "four" or the tail of "five". An edge never moves past halfway to the
    next piece.
    """
    f = int(rate * FRAME)
    rms = loudness(audio, rate)
    soft = rms > rms.max() * SOFT
    bridge, most = round(BRIDGE / FRAME), round(MAX_GROW / FRAME)
    frames = [(s // f, e // f) for s, e in found]
    out = []
    for i, (s, e) in enumerate(frames):
        lo = max(s - most, (frames[i - 1][1] + s) // 2 if i else 0)
        hi = min(e + most, (e + frames[i + 1][0]) // 2 if i + 1 < len(frames) else len(rms))
        while s > lo and soft[max(lo, s - bridge) : s].any():
            s = max(lo, s - bridge) + int(np.argmax(soft[max(lo, s - bridge) : s]))
        while e < hi and soft[e : min(hi, e + bridge)].any():
            window = soft[e : min(hi, e + bridge)]
            e = e + len(window) - int(np.argmax(window[::-1]))
        out.append((s * f, e * f))
    return out


def clip(audio: np.ndarray, rate: int, start: int, end: int) -> np.ndarray:
    pad = int(PAD * rate)
    piece = audio[max(0, start - pad) : min(len(audio), end + pad)]
    peak = np.max(np.abs(piece)) or 1.0
    return (piece / peak * 0.89).astype(np.float32)


def split(batch: dict, wav: Path, out: Path) -> bool:
    audio, rate = sf.read(wav)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    want = len(batch["items"])
    # The voice doesn't always leave the long pause it was asked for, so if lines ran together,
    # try again with shorter pauses. Stops at the first try that finds exactly one piece per line.
    for gap in (MIN_GAP, 0.7, 0.55, 0.4, 0.3):
        found = pieces(audio, rate, gap)
        if len(found) >= want:
            break
    if len(found) == want and gap != MIN_GAP:
        print(f"  {batch['id']}: some pauses were short; split on {gap}s pauses")
    if len(found) != want:
        print(f"  {batch['id']}: heard {len(found)} pieces but the script has {want} lines. Nothing written.")
        for (s, e), item in zip(found, batch["items"] + [{"text": "?"}] * len(found)):
            print(f"    {s / rate:6.2f}s  {(e - s) / rate:4.2f}s  (expected: {item['text']})")
        print("  Re-record this batch (or listen for a skipped or doubled line).")
        return False
    out.mkdir(parents=True, exist_ok=True)
    for (s, e), item in zip(widen(audio, rate, found), batch["items"]):
        sf.write(out / f"{item['file']}.mp3", clip(audio, rate, s, e), rate, format="MP3", subtype="MPEG_LAYER_III")
    print(f"  {batch['id']}: wrote {want} clips")
    return True


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("batches", nargs="*", help="batch names (default: every WAV found)")
    args = parser.parse_args()

    batches = {b["id"]: b for b in json.loads(BATCHES.read_text(encoding="utf-8"))}
    folder = RECORDINGS
    names = args.batches or [p.stem for p in sorted(folder.glob("*.wav")) if p.stem in batches]
    if not names:
        print(f"No recordings found in {folder}")
        return
    ok = True
    for name in names:
        if name not in batches:
            print(f"  {name}: unknown batch (see gemini-prompts.md)")
            ok = False
            continue
        ok &= split(batches[name], folder / f"{name}.wav", OUT)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
