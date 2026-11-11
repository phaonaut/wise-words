// Spaced practice: a word moves up one box per day it's answered right on the first try.
// Box 3 means mastered. A miss sends it back so it comes up again soon.
import type { WordEntry, WordProgress } from '@/lib/types';
import { shuffle, wordKey } from '@/lib/words';

export const MASTERED = 3;
const DAYS_UNTIL_NEXT = [0, 1, 2, 7];

export function today(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(day: string, n: number) {
  const [y, m, d] = day.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function applyAnswer(
  prev: WordProgress | undefined,
  correct: boolean,
  day = today(),
): WordProgress {
  const p = prev ?? { box: 0, correct: 0, wrong: 0 };
  if (correct) {
    const canMoveUp = p.lastBoxUp !== day;
    const box = canMoveUp ? Math.min(MASTERED, p.box + 1) : p.box;
    return {
      ...p,
      box,
      correct: p.correct + 1,
      lastSeen: day,
      lastBoxUp: canMoveUp ? day : p.lastBoxUp,
      due: addDays(day, DAYS_UNTIL_NEXT[box]),
    };
  }
  return {
    ...p,
    box: p.box >= MASTERED ? 1 : 0,
    wrong: p.wrong + 1,
    lastSeen: day,
    due: day,
  };
}

export type WordStatus = 'new' | 'learning' | 'mastered';

export function statusOf(p: WordProgress | undefined): WordStatus {
  if (!p) return 'new';
  return p.box >= MASTERED ? 'mastered' : 'learning';
}

export type WordCounts = {
  total: number;
  learned: number;
  /** Tried at least once but not learned yet. */
  practicing: number;
  /** The practicing words' progress added up, where each good day is a third of a word. For progress bars. */
  partial: number;
};

/**
 * Counts for showing progress. A word takes at least 4 days to count as learned, so anything
 * that shows `learned` should show `practicing` next to it, or early progress looks like zero.
 */
export function countWords(words: WordEntry[], progress: Record<string, WordProgress>): WordCounts {
  const counts: WordCounts = { total: words.length, learned: 0, practicing: 0, partial: 0 };
  for (const w of words) {
    const p = progress[wordKey(w.word)];
    if (!p) continue;
    if (p.box >= MASTERED) counts.learned++;
    else {
      counts.practicing++;
      counts.partial += p.box / MASTERED;
    }
  }
  return counts;
}

/**
 * Picks the words for one round: words being learned that are due, then a few new
 * words (in list order), then a couple of mastered words for review.
 */
export function pickRound(
  pool: WordEntry[],
  progress: Record<string, WordProgress>,
  size = 10,
  maxNew = 4,
): WordEntry[] {
  const day = today();
  const learningDue: WordEntry[] = [];
  const learningLater: WordEntry[] = [];
  const fresh: WordEntry[] = [];
  const reviewDue: WordEntry[] = [];
  const reviewLater: WordEntry[] = [];

  for (const w of pool) {
    const p = progress[wordKey(w.word)];
    if (!p) fresh.push(w);
    else if (p.box >= MASTERED) ((p.due ?? day) <= day ? reviewDue : reviewLater).push(w);
    else ((p.due ?? day) <= day ? learningDue : learningLater).push(w);
  }

  learningDue.sort((a, b) => {
    const pa = progress[wordKey(a.word)];
    const pb = progress[wordKey(b.word)];
    return pa.box - pb.box || pb.wrong - pa.wrong;
  });

  const round: WordEntry[] = [];
  const take = (from: WordEntry[], n: number) => {
    for (const w of from) {
      if (round.length >= size || n <= 0) return;
      if (!round.includes(w)) {
        round.push(w);
        n--;
      }
    }
  };

  take(learningDue, size - 2);
  take(fresh, maxNew);
  take(shuffle(reviewDue), 2);
  // Not enough yet? Fill up with whatever is left, nearest-to-learning first.
  take(fresh, size);
  take(learningDue, size);
  take(shuffle(learningLater), size);
  take(shuffle(reviewDue), size);
  take(shuffle(reviewLater), size);

  return shuffle(round);
}
