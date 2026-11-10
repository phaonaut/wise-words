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

**As a website:** every push to `master` publishes the app to <https://phaonaut.github.io/wise-words/> with GitHub
Pages (see `.github/workflows/deploy-web.yml`). One-time setup: in the GitHub repo, go to **Settings → Pages** and set
**Source** to **GitHub Actions**.

1. Open the address in the tablet's browser (Silk). Use the browser menu to add it to the home screen.
2. In Amazon Kids, approve the address under the child profile's web settings.

Progress is saved in that browser, so clearing its data resets it. The site lives under `/wise-words`
(`experiments.baseUrl` in `app.json`). Change that if you host it somewhere else.

## Voice

The built-in words, sentences, letter names and phrases are pre-recorded MP3s in `assets/audio`, made with Gemini's
text-to-speech in Google AI Studio (one male voice). Words from your own lists use the device's voice. Grown-ups can set
the speed (Slow / Medium / Fast).

To record new or replacement clips:

1. If you added phrases or sentences, run `npm run voice:list` and then `npm run voice:prompts`. This updates
   `scripts/voice/gemini-prompts.md`.
2. For each batch in that file, paste its style and text into AI Studio → **Generate speech**. Use the same voice as
   before, and download the WAV.
3. Save each WAV as `voice-recordings/<batch>.wav`, for example `voice-recordings/words-prek.wav`.
4. Cut the batches into clips. The first time, set up Python 3.10 or newer with:

   ```bash
   py -m venv .voice-env
   .voice-envScriptspython -m pip install numpy soundfile
   ```

   Then run:

   ```bash
   .voice-envScriptspython scripts/voice/split.py
   ```

A batch is only written if the number of spoken pieces matches its script. If a line is skipped or doubled, re-record
that batch.

## Code map

- `src/app/`: screens (Expo Router). Kid games live in `kid/[kidId]/`, and the grown-ups area in `grownups/`.
- `src/data/dolch.ts`: the built-in word lists and the read-aloud sentences.
- `src/lib/srs.ts`: how words move from new → learning → learned, and how each round's words are picked.
- `src/lib/store.tsx`: saved data (kids, lists, progress, stickers).
- `src/lib/words.ts`: word list parsing, sound-alike words, and look-alike wrong choices.
