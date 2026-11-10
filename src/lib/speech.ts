import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { CLIPS } from '@/data/clips';

/**
 * Something to say: a phrase or sentence (plain text), a word, a letter name, or a number.
 * Recorded clips are used when there is one; anything else falls back to the device voice.
 */
export type Part = string | { word: string } | { letter: string } | { number: number } | undefined | false;
type Sayable = Exclude<Part, undefined | false>;

export const asWord = (word: string) => ({ word });
export const asLetter = (letter: string) => ({ letter });
export const asNumber = (number: number) => ({ number });

const isNumber = (part: Sayable) => typeof part !== 'string' && 'number' in part;

// The clips were recorded at a kid-friendly pace, which matches the "Medium" speed setting.
const CLIP_PACE = 0.85;
const GAP_MS = 120;

let rate = CLIP_PACE;
let player: AudioPlayer | null = null;
let finishClip: (() => void) | null = null;
let current = 0;

export function setRate(next: number) {
  rate = next;
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

function clipFor(part: Sayable): number | undefined {
  if (typeof part === 'string') return CLIPS[`p:${part}`];
  if ('word' in part) return CLIPS[`w:${part.word.trim().toLowerCase()}`];
  if ('number' in part) return CLIPS[`n:${part.number}`];
  const ch = part.letter.toLowerCase();
  return ch === "'" ? CLIPS['p:apostrophe'] : CLIPS[`l:${ch}`];
}

function textFor(part: Sayable) {
  if (typeof part === 'string') return part;
  if ('word' in part) return part.word;
  if ('number' in part) return `${part.number}`;
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

/**
 * Says each part in order, cutting off anything still being said.
 * Resolves to true when it finished, or false if something else cut it off.
 */
export function say(...parts: Part[]): Promise<boolean> {
  stopSpeaking();
  const id = ++current;
  const todo = parts.filter((p): p is Sayable => !!p);
  return (async () => {
    let i = 0;
    while (i < todo.length) {
      if (id !== current) return false;
      const clip = clipFor(todo[i]);
      if (clip !== undefined) {
        await playClip(clip);
        i++;
      } else {
        // Parts with no recording go to the device voice. A run with numbers in it
        // ("What is", 3, "plus", 2) is read as one sentence, so it doesn't pause between pieces.
        const run: Sayable[] = [];
        while (i < todo.length && clipFor(todo[i]) === undefined) run.push(todo[i++]);
        const texts = run.map(textFor);
        for (const text of run.some(isNumber) ? [texts.join(' ')] : texts) {
          if (id !== current) return false;
          await speakWithDevice(text);
        }
      }
      if (id !== current) return false;
      await wait(GAP_MS);
    }
    return true;
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
