import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { CLIPS, type VoiceName } from '@/data/clips';

/**
 * Something to say: a phrase or sentence (plain text), a word, or a letter name.
 * Recorded clips are used when there is one; anything else falls back to the device voice.
 */
export type Part = string | { word: string } | { letter: string } | undefined | false;

export const asWord = (word: string) => ({ word });
export const asLetter = (letter: string) => ({ letter });

// The clips were recorded at a kid-friendly pace, which matches the "Medium" speed setting.
const CLIP_PACE = 0.85;
const GAP_MS = 120;

let rate = CLIP_PACE;
let voice: VoiceName = 'female';
let player: AudioPlayer | null = null;
let finishClip: (() => void) | null = null;
let current = 0;

export function setRate(next: number) {
  rate = next;
}

/** Which recorded voice to use. Words without a recording still use the device voice. */
export function setVoice(next: VoiceName) {
  voice = next;
}

function getPlayer() {
  if (!player) {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    player = createAudioPlayer(null);
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) finishClip?.();
    });
  }
  return player;
}

function clipFor(part: Exclude<Part, undefined | false>): number | undefined {
  const clips = CLIPS[voice];
  if (typeof part === 'string') return clips[`p:${part}`];
  if ('word' in part) return clips[`w:${part.word.trim().toLowerCase()}`];
  const ch = part.letter.toLowerCase();
  return ch === "'" ? clips['p:apostrophe'] : clips[`l:${ch}`];
}

function textFor(part: Exclude<Part, undefined | false>) {
  if (typeof part === 'string') return part;
  if ('word' in part) return part.word;
  return part.letter === "'" ? 'apostrophe' : part.letter;
}

function playClip(source: number) {
  return new Promise<void>((resolve) => {
    const p = getPlayer();
    // Safety net in case the "finished" event never arrives.
    const timer = setTimeout(() => end(), 8000);
    const end = () => {
      clearTimeout(timer);
      if (finishClip === end) finishClip = null;
      resolve();
    };
    finishClip = end;
    p.replace(source);
    p.shouldCorrectPitch = true;
    p.setPlaybackRate(rate / CLIP_PACE);
    p.play();
  });
}

function speakWithDevice(text: string) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => end(), 10000);
    const end = () => {
      clearTimeout(timer);
      resolve();
    };
    Speech.speak(text, { language: 'en-US', rate, onDone: end, onStopped: end, onError: end });
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Says each part in order, cutting off anything still being said. */
export function say(...parts: Part[]) {
  stopSpeaking();
  const id = ++current;
  void (async () => {
    for (const part of parts) {
      if (!part) continue;
      if (id !== current) return;
      const clip = clipFor(part);
      if (clip !== undefined) await playClip(clip);
      else await speakWithDevice(textFor(part));
      if (id !== current) return;
      await wait(GAP_MS);
    }
  })();
}

export function stopSpeaking() {
  current++;
  finishClip?.();
  player?.pause();
  Speech.stop();
}

export function buzz(kind: 'tap' | 'good' | 'oops') {
  if (Platform.OS === 'web') return;
  const run =
    kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(
          kind === 'good'
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
  run.catch(() => {});
}
