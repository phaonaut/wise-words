import { pickOne } from '@/data/fun';
import type { MathLevel } from '@/lib/types';
import { shuffle } from '@/lib/words';

/** What each level practices. Shown to grown-ups when they pick a level. */
export const MATH_LEVELS: { level: MathLevel; label: string; detail: string }[] = [
  {
    level: 1,
    label: 'Level 1',
    detail: 'About Pre-K: count to 10, add and take away within 5, and tell which group has more.',
  },
  {
    level: 2,
    label: 'Level 2',
    detail: 'About kindergarten: count to 20, add and take away within 10, and compare numbers to 20.',
  },
  {
    level: 3,
    label: 'Level 3',
    detail: 'About 1st grade: tens and ones to 59, add and subtract within 20, and compare numbers to 100.',
  },
  {
    level: 4,
    label: 'Level 4',
    detail: 'About 2nd grade: tens and ones to 99, add and subtract within 100, and compare numbers to 1,000.',
  },
];

// Things to count. All are older emoji, so they show up on older tablets too.
const COUNTERS = ['🍎', '🐞', '⭐', '🐟', '🌼', '🚗', '🍪', '🎈', '🐥', '🍓'];

export type CountProblem = {
  key: string;
  answer: number;
  choices: number[];
  /** Tens rods and ones cubes instead of single things to count. */
  blocks: boolean;
  emoji: string;
};

export type AddProblem = {
  key: string;
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;
  choices: number[];
  /** The word said between the numbers: "3 plus 2", "5 take away 2". */
  word: 'plus' | 'take away' | 'minus';
  /** Set when the problem is small enough to show with pictures. */
  emoji?: string;
};

export type CompareProblem = {
  key: string;
  numbers: number[];
  answer: number;
  prompt: string;
  /** Set when the groups are shown as pictures to count instead of written numbers. */
  emoji?: string;
};

const int = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/** The right answer plus wrong ones that are close to it, in counting order. */
function choicesFor(answer: number, near: number[], count: number, min: number): number[] {
  const wrong = shuffle([...new Set(near)].filter((n) => n !== answer && n >= min)).slice(0, count - 1);
  for (let step = 1; wrong.length < count - 1; step++) {
    for (const n of [answer + step, answer - step]) {
      if (n >= min && !wrong.includes(n) && wrong.length < count - 1) wrong.push(n);
    }
  }
  return [answer, ...wrong].sort((x, y) => x - y);
}

/** A round of problems, avoiding repeats where the level has enough different ones. */
function roundOf<P extends { key: string }>(size: number, make: () => P): P[] {
  const round: P[] = [];
  const seen = new Set<string>();
  while (round.length < size) {
    let problem = make();
    for (let tries = 0; seen.has(problem.key) && tries < 30; tries++) problem = make();
    seen.add(problem.key);
    round.push(problem);
  }
  return round;
}

function countProblem(level: MathLevel, choiceCount: number): CountProblem {
  if (level <= 2) {
    const answer = level === 1 ? int(1, 10) : int(4, 20);
    const near = [answer - 2, answer - 1, answer + 1, answer + 2];
    return { key: `${answer}`, answer, blocks: false, emoji: pickOne(COUNTERS), choices: choicesFor(answer, near, choiceCount, 1) };
  }
  const answer = level === 3 ? int(11, 59) : int(20, 99);
  const tens = Math.floor(answer / 10);
  const ones = answer % 10;
  // Mixing up the tens and ones (34 and 43) is the classic mistake, so offer it when there is one.
  const swapped = ones > 0 ? ones * 10 + tens : answer;
  const near = [swapped, answer - 10, answer + 10, answer - 1, answer + 1];
  return { key: `${answer}`, answer, blocks: true, emoji: '', choices: choicesFor(answer, near, choiceCount, 1) };
}

function addProblem(level: MathLevel, choiceCount: number): AddProblem {
  const plus = Math.random() < (level === 1 ? 0.7 : 0.5);
  let a: number;
  let b: number;
  if (level <= 2) {
    const max = level === 1 ? 5 : 10;
    if (plus) {
      a = int(1, max - 1);
      b = int(1, max - a);
    } else {
      a = int(2, max);
      b = int(1, level === 1 ? a - 1 : a);
    }
  } else if (level === 3) {
    if (plus) {
      a = int(3, 15);
      b = int(2, Math.min(9, 20 - a));
    } else {
      a = int(8, 20);
      b = int(2, Math.min(10, a));
    }
  } else {
    const small = Math.random() < 0.5;
    if (plus) {
      a = int(10, 88);
      b = small ? int(2, 9) : int(10, Math.max(10, 100 - a));
      if (a + b > 100) b = 100 - a;
    } else {
      a = int(21, 100);
      b = small ? int(2, 9) : int(10, a - 1);
    }
  }
  const answer = plus ? a + b : a - b;
  const near = [answer - 2, answer - 1, answer + 1, answer + 2];
  if (level === 4) near.push(answer - 10, answer + 10);
  const word = plus ? 'plus' : level <= 2 ? 'take away' : 'minus';
  return {
    key: `${a}${plus ? '+' : '-'}${b}`,
    a,
    b,
    op: plus ? '+' : '-',
    answer,
    choices: choicesFor(answer, near, choiceCount, 0),
    word,
    emoji: level <= 2 ? pickOne(COUNTERS) : undefined,
  };
}

function compareProblem(level: MathLevel): CompareProblem {
  let numbers: number[];
  if (level <= 2) {
    const max = level === 1 ? 10 : 20;
    const a = int(1, max);
    let b = int(1, max);
    while (b === a) b = int(1, max);
    numbers = [a, b];
  } else {
    // Three numbers that share digits, so the child has to look at place value.
    const [min, max] = level === 3 ? [10, 99] : [100, 999];
    const a = int(min, max);
    const digits = `${a}`.split('');
    const b = Number(shuffle(digits).join(''));
    const c = a + pickOne([-1, 1]) * int(1, level === 3 ? 9 : 90);
    const set = new Set([a, b, c].filter((n) => n >= min && n <= max));
    while (set.size < 3) set.add(int(min, max));
    numbers = shuffle([...set]);
  }
  const more = Math.random() < (level === 1 ? 0.7 : 0.5);
  const answer = more ? Math.max(...numbers) : Math.min(...numbers);
  const prompt =
    level === 1
      ? more
        ? 'Which has more?'
        : 'Which has fewer?'
      : numbers.length === 2
        ? `Which number is ${more ? 'bigger' : 'smaller'}?`
        : `Which number is the ${more ? 'biggest' : 'smallest'}?`;
  return {
    key: `${[...numbers].sort((x, y) => x - y).join(',')}${more ? '>' : '<'}`,
    numbers,
    answer,
    prompt,
    emoji: level === 1 ? pickOne(COUNTERS) : undefined,
  };
}

export const countRound = (level: MathLevel, choiceCount: number, size: number) =>
  roundOf(size, () => countProblem(level, choiceCount));

export const addRound = (level: MathLevel, choiceCount: number, size: number) =>
  roundOf(size, () => addProblem(level, choiceCount));

export const compareRound = (level: MathLevel, _choiceCount: number, size: number) =>
  roundOf(size, () => compareProblem(level));
