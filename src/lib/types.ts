export type Skill = 'read' | 'spell';

export type MathGame = 'count' | 'add' | 'compare';
/** 1 is about Pre-K, 4 is about 2nd grade. See MATH_LEVELS in lib/math.ts. */
export type MathLevel = 1 | 2 | 3 | 4;

export type WordEntry = {
  word: string;
  /** Example sentence, read aloud to tell apart words that sound alike (to / two / too). */
  sentence?: string;
};

export type WordList = {
  id: string;
  name: string;
  words: WordEntry[];
  builtIn?: boolean;
};

export type Kid = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  listIds: string[];
  spellInput: 'tiles' | 'keyboard';
  findChoices: 3 | 4;
  /** Missing for kids added before math existed; treated as level 1. */
  mathLevel?: MathLevel;
};

export type WordProgress = {
  /** 0 = just started, 1–2 = learning, 3 = mastered. */
  box: number;
  correct: number;
  wrong: number;
  lastSeen?: string;
  /** Day the box last went up. A word can only move up once per day. */
  lastBoxUp?: string;
  /** Day the word should come back for practice. */
  due?: string;
};

export type KidProgress = Record<Skill, Record<string, WordProgress>>;

export type Rewards = { stars: number; stickers: string[] };

/** How many math problems were right on the first try, out of how many were tried. */
export type MathTally = { right: number; total: number };

export type Settings = {
  speechRate: number;
};

export type AppData = {
  version: 1;
  kids: Kid[];
  customLists: WordList[];
  progress: Record<string, KidProgress>;
  rewards: Record<string, Rewards>;
  /** Math tallies by kid id, then by "<game>:<level>". */
  math: Record<string, Record<string, MathTally>>;
  settings: Settings;
};
