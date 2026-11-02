# Wise Words

A sight word and spelling practice app for young kids (about ages 4–8), built with Expo (SDK 58).

## What's in it

- **A profile for each child**: picture, color, which word lists they practice, and their own progress.
- **Word lists**: the 220 Dolch sight words (Pre-K to 3rd grade), plus your own lists, such as weekly school spelling words.
  Add a sentence to any word (`their: They ride their bikes.`) so it's read aloud with the word.
- **Three games**, all with spoken words:
  - 🃏 **Flashcards**: the child reads the word out loud, and a grown-up taps ✅ or 🔁.
  - 👂 **Hear & Find**: the app says a word, and the child taps it from 3 or 4 look-alike choices.
  - ✏️ **Spell It**: the app says the word (and a sentence for sound-alike words), and the child spells it with letter tiles or the keyboard.
- **Adapts to each child**: a word counts as learned after it's answered right on the first try on 3 different days.
  Misses come back sooner. Reading and spelling are tracked separately.
- **Stars and a sticker book**, with no timers or penalties.
- **Grown-ups area** behind a simple math question: kids, lists, progress, and tricky words.
- Everything is saved on the device, and it works offline.

## Run it

```bash
npm install
npx expo start
```

- Press `w` to open it in a web browser on this computer.
- To try it on a phone or tablet on the same Wi-Fi, scan the QR code with the **Expo Go** app.

## Put it on a Fire tablet

**As an app (best for the kids' profiles):** build an Android install file (APK) with Expo's free build service:

```bash
npx eas-cli@latest build -p android --profile preview
```

1. Download the APK from the link it gives you, then open it on the tablet. You may need to allow "Apps from Unknown Sources" in the tablet's settings.
2. In the parent settings for each child profile, add the app to their content.

**As a website:**

```bash
npx expo export --platform web
```

1. Host the `dist` folder (for example on Netlify or GitHub Pages).
2. Approve the address under the child profile's web settings.

## Voice

The built-in words, sentences, letter names and phrases are pre-recorded MP3s in `assets/audio/female` and
`assets/audio/male`. Grown-ups pick the voice in the app. They were made with
[Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), a free, open-source voice (Apache-2.0): `af_heart` for
the female voice and `am_michael` for the male voice. Words from your own lists use the device's voice.

To re-record after adding phrases or sentences (needs Python 3.10–3.12):

```bash
py -3.12 -m venv .kokoro-env
.kokoro-env\Scripts\python -m pip install "kokoro>=0.9.4" soundfile
npm run voice:list
.kokoro-env\Scripts\python scripts/voice/generate.py --set female
.kokoro-env\Scripts\python scripts/voice/generate.py --set male
```

Existing clips are skipped, so this only records what's new. Add `--force` to redo everything, for example with a different
`--voice`.

## Code map

- `src/app/`: screens (Expo Router). Kid games live in `kid/[kidId]/`, and the grown-ups area in `grownups/`.
- `src/data/dolch.ts`: the built-in word lists and the read-aloud sentences.
- `src/lib/srs.ts`: how words move from new → learning → learned, and how each round's words are picked.
- `src/lib/store.tsx`: saved data (kids, lists, progress, stickers).
- `src/lib/words.ts`: word list parsing, sound-alike words, and look-alike wrong choices.
