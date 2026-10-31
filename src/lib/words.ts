import { BUILT_IN_LISTS, SENTENCES } from '@/data/dolch';
import type { AppData, Kid, WordEntry, WordList } from '@/lib/types';

export const wordKey = (word: string) => word.trim().toLowerCase();

// Words that sound the same. "Hear & Find" never offers one of these as a wrong choice for another.
const HOMOPHONE_GROUPS = [
  ['to', 'two', 'too'],
  ['their', 'there', "they're"],
  ['for', 'four'],
  ['by', 'buy', 'bye'],
  ['no', 'know'],
  ['right', 'write'],
  ['one', 'won'],
  ['ate', 'eight'],
  ['new', 'knew'],
  ['be', 'bee'],
  ['see', 'sea'],
  ['its', "it's"],
  ['our', 'hour'],
  ['which', 'witch'],
  ['would', 'wood'],
  ['i', 'eye'],
  ['so', 'sew'],
  ['red', 'read'],
  ['blue', 'blew'],
  ['made', 'maid'],
  ['here', 'hear'],
  ['where', 'wear'],
  ['some', 'sum'],
  ['not', 'knot'],
  ['him', 'hymn'],
  ['meet', 'meat'],
  ['week', 'weak'],
  ['whole', 'hole'],
  ['way', 'weigh'],
];

const HOMOPHONES = new Map<string, Set<string>>();
for (const group of HOMOPHONE_GROUPS) {
  for (const w of group) HOMOPHONES.set(w, new Set(group));
}

export function soundsAlike(a: string, b: string) {
  const ka = wordKey(a);
  const kb = wordKey(b);
  return ka === kb || (HOMOPHONES.get(ka)?.has(kb) ?? false);
}

export function sentenceFor(entry: WordEntry) {
  return entry.sentence || SENTENCES[wordKey(entry.word)];
}

export function allLists(data: AppData): WordList[] {
  return [...BUILT_IN_LISTS, ...data.customLists];
}

/** Every word in the kid's chosen lists, in list order, without duplicates. */
export function wordPool(data: AppData, kid: Kid): WordEntry[] {
  const lists = allLists(data);
  const seen = new Set<string>();
  const pool: WordEntry[] = [];
  for (const id of kid.listIds) {
    const list = lists.find((l) => l.id === id);
    if (!list) continue;
    for (const entry of list.words) {
      const key = wordKey(entry.word);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      pool.push(entry);
    }
  }
  return pool;
}

/**
 * Turns what a grown-up typed into word entries.
 * Each line can be one word with a sentence ("their: They ride their bikes."),
 * or several words separated by commas or spaces.
 */
export function parseWordText(text: string): WordEntry[] {
  const entries: WordEntry[] = [];
  const seen = new Set<string>();
  const add = (raw: string, sentence?: string) => {
    const word = raw.trim().replace(/^[^\p{L}']+|[^\p{L}']+$/gu, '');
    const key = wordKey(word);
    if (!key || seen.has(key)) return;
    seen.add(key);
    entries.push(sentence ? { word, sentence } : { word });
  };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([\p{L}'-]+)\s*(?::| - )\s*(.+)$/u);
    if (match) {
      add(match[1], match[2].trim());
    } else {
      line.split(/[,;\s]+/).forEach((w) => add(w));
    }
  }
  return entries;
}

export function wordsToText(words: WordEntry[]) {
  return words.map((w) => (w.sentence ? `${w.word}: ${w.sentence}` : w.word)).join('\n');
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Wrong choices for "Hear & Find": look-alike words first, never sound-alike ones. */
export function pickDistractors(target: WordEntry, pool: WordEntry[], count: number): WordEntry[] {
  const usable = (words: WordEntry[]) =>
    words.filter(
      (w, i, arr) =>
        !soundsAlike(w.word, target.word) &&
        arr.findIndex((o) => wordKey(o.word) === wordKey(w.word)) === i,
    );
  const t = wordKey(target.word);
  const score = (w: WordEntry) => {
    const k = wordKey(w.word);
    let s = Math.random();
    if (k[0] === t[0]) s += 2;
    if (Math.abs(k.length - t.length) <= 1) s += 1;
    if (k.slice(-2) === t.slice(-2)) s += 1;
    return s;
  };
  // Prefer the kid's own words; borrow from the built-in lists when their list is tiny.
  const inPool = usable(pool);
  const source =
    inPool.length >= count + 2
      ? inPool
      : usable([...pool, ...BUILT_IN_LISTS.flatMap((l) => l.words)]);
  return source
    .map((w) => ({ w, s: score(w) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.w);
}
