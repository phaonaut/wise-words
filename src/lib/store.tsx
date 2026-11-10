import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { STICKERS } from '@/data/fun';
import { applyAnswer } from '@/lib/srs';
import type { AppData, Kid, KidProgress, Rewards, Skill, WordList } from '@/lib/types';
import { wordKey } from '@/lib/words';

const STORAGE_KEY = 'wise-words/data/v1';

const EMPTY: AppData = {
  version: 1,
  kids: [],
  customLists: [],
  progress: {},
  rewards: {},
  settings: { speechRate: 0.85 },
};

const emptyProgress = (): KidProgress => ({ read: {}, spell: {} });
const emptyRewards = (): Rewards => ({ stars: 0, stickers: [] });

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

type Store = {
  data: AppData;
  ready: boolean;
  update: (change: (data: AppData) => AppData) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setData({ ...EMPTY, ...(JSON.parse(raw) as AppData) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data, ready]);

  return (
    <StoreContext.Provider value={{ data, ready, update: setData }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

export function useKid(kidId: string | undefined) {
  const { data } = useStore();
  return data.kids.find((k) => k.id === kidId);
}

export function progressFor(data: AppData, kidId: string): KidProgress {
  return data.progress[kidId] ?? emptyProgress();
}

export function rewardsFor(data: AppData, kidId: string): Rewards {
  return data.rewards[kidId] ?? emptyRewards();
}

// ---- Changes. Each takes the current data and returns new data. ----

export const saveKid = (kid: Kid) => (d: AppData): AppData => ({
  ...d,
  kids: d.kids.some((k) => k.id === kid.id)
    ? d.kids.map((k) => (k.id === kid.id ? kid : k))
    : [...d.kids, kid],
});

export const deleteKid = (kidId: string) => (d: AppData): AppData => {
  const progress = { ...d.progress };
  const rewards = { ...d.rewards };
  delete progress[kidId];
  delete rewards[kidId];
  return { ...d, kids: d.kids.filter((k) => k.id !== kidId), progress, rewards };
};

export const resetKidProgress = (kidId: string) => (d: AppData): AppData => ({
  ...d,
  progress: { ...d.progress, [kidId]: emptyProgress() },
  rewards: { ...d.rewards, [kidId]: emptyRewards() },
});

export const saveList = (list: WordList) => (d: AppData): AppData => ({
  ...d,
  customLists: d.customLists.some((l) => l.id === list.id)
    ? d.customLists.map((l) => (l.id === list.id ? list : l))
    : [...d.customLists, list],
});

export const deleteList = (listId: string) => (d: AppData): AppData => ({
  ...d,
  customLists: d.customLists.filter((l) => l.id !== listId),
  kids: d.kids.map((k) => ({ ...k, listIds: k.listIds.filter((id) => id !== listId) })),
});

export const recordAnswer =
  (kidId: string, skill: Skill, word: string, correct: boolean) =>
  (d: AppData): AppData => {
    const kidProgress = progressFor(d, kidId);
    const key = wordKey(word);
    const rewards = rewardsFor(d, kidId);
    return {
      ...d,
      progress: {
        ...d.progress,
        [kidId]: {
          ...kidProgress,
          [skill]: { ...kidProgress[skill], [key]: applyAnswer(kidProgress[skill][key], correct) },
        },
      },
      rewards: correct ? { ...d.rewards, [kidId]: { ...rewards, stars: rewards.stars + 1 } } : d.rewards,
    };
  };

/** Picks a sticker the kid doesn't have yet (or any sticker once they have them all). */
export function chooseSticker(data: AppData, kidId: string) {
  const owned = new Set(rewardsFor(data, kidId).stickers);
  const missing = STICKERS.filter((s) => !owned.has(s));
  const from = missing.length ? missing : STICKERS;
  return from[Math.floor(Math.random() * from.length)];
}

export const giveSticker = (kidId: string, sticker: string) => (d: AppData): AppData => {
  const rewards = rewardsFor(d, kidId);
  return {
    ...d,
    rewards: { ...d.rewards, [kidId]: { ...rewards, stickers: [...rewards.stickers, sticker] } },
  };
};

export const setSpeechRate = (speechRate: number) => (d: AppData): AppData => ({
  ...d,
  settings: { ...d.settings, speechRate },
});
