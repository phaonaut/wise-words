export type Skill = 'read' | 'spell';

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

export type Settings = {
  speechRate: number;
  /** Missing in data saved before the voice choice existed; treated as 'female'. */
  voice?: 'female' | 'male';
};

export type AppData = {
  version: 1;
  kids: Kid[];
  customLists: WordList[];
  progress: Record<string, KidProgress>;
  rewards: Record<string, Rewards>;
  settings: Settings;
};
