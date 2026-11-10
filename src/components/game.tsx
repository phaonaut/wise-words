import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Owl } from '@/components/owl';
import { BigButton, Card, goBack, Screen, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { pickRound } from '@/lib/srs';
import { buzz, say, stopSpeaking } from '@/lib/speech';
import {
  chooseSticker,
  giveSticker,
  progressFor,
  recordAnswer,
  rewardsFor,
  useStore,
} from '@/lib/store';
import type { Kid, Skill, WordEntry } from '@/lib/types';
import { wordPool } from '@/lib/words';

export const ROUND_SIZE = 10;

/** Runs one round of a game: which words, which one we're on, stars, and the sticker at the end. */
export function useRound(kid: Kid | undefined, skill: Skill) {
  const { data, update } = useStore();
  const pool = kid ? wordPool(data, kid) : [];
  const pick = () => (kid ? pickRound(pool, progressFor(data, kid.id)[skill], ROUND_SIZE) : []);

  const [words, setWords] = useState<WordEntry[]>(pick);
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [sticker, setSticker] = useState<string | null>(null);
  // Guards against a quick double-tap counting the same word twice.
  const answered = useRef(-1);

  useEffect(() => () => stopSpeaking(), []);

  const done = words.length > 0 && index >= words.length;

  return {
    pool,
    words,
    index,
    current: words[index] as WordEntry | undefined,
    done,
    stars,
    sticker,
    /** Saves the answer and moves to the next word. `correct` means right on the first try. */
    answer(correct: boolean) {
      if (!kid || done || answered.current === index) return;
      answered.current = index;
      const word = words[index];
      update(recordAnswer(kid.id, skill, word.word, correct));
      if (correct) setStars((s) => s + 1);
      const next = index + 1;
      setIndex(next);
      if (next >= words.length) {
        const s = chooseSticker(data, kid.id);
        setSticker(s);
        update(giveSticker(kid.id, s));
      }
    },
    restart() {
      answered.current = -1;
      setWords(pick());
      setIndex(0);
      setStars(0);
      setSticker(null);
    },
  };
}

/** A big colorful button for picking a game. Says the game's name when tapped. */
export function GameTile({
  name,
  spoken = name,
  emoji,
  hint,
  color,
  onPress,
}: {
  name: string;
  spoken?: string;
  emoji: string;
  hint: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => {
        buzz('tap');
        say(spoken);
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: color, transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}>
      <Txt size={70} style={{ lineHeight: 90 }}>
        {emoji}
      </Txt>
      <Txt bold size={28} color="#fff" center>
        {name}
      </Txt>
      <Txt size={16} color="#fff" center>
        {hint}
      </Txt>
    </Pressable>
  );
}

export function RoundProgress({ index, total, color }: { index: number; total: number; color: string }) {
  return (
    <View style={styles.dots} accessibilityLabel={`Word ${index + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i < index ? color : i === index ? colors.ink : colors.line },
          ]}
        />
      ))}
    </View>
  );
}

export function RoundDone({
  kid,
  stars,
  sticker,
  total,
  onAgain,
}: {
  kid: Kid;
  stars: number;
  sticker: string | null;
  total: number;
  onAgain: () => void;
}) {
  const [scale] = useState(() => new Animated.Value(0.2));
  const { data } = useStore();
  const totalStars = rewardsFor(data, kid.id).stars;

  useEffect(() => {
    say('Great job!', 'You got a new sticker!');
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [kid.name, scale]);

  return (
    <Screen contentStyle={styles.doneWrap}>
      <Txt bold size={40} center>
        🎉 Round done! 🎉
      </Txt>
      <Txt size={26} center>
        ⭐ {stars} of {total} on the first try
      </Txt>
      <View style={styles.celebrate}>
        <Owl size={140} mood="cheer" bounce />
        {sticker && (
          <Card style={{ alignItems: 'center', gap: 4 }}>
            <Txt size={20} color={colors.muted}>
              New sticker!
            </Txt>
            <Animated.View style={{ transform: [{ scale }] }}>
              <Txt size={110} style={{ lineHeight: 140 }}>
                {sticker}
              </Txt>
            </Animated.View>
          </Card>
        )}
      </View>
      <Txt size={18} color={colors.muted} center>
        You have {totalStars} stars in all!
      </Txt>
      <View style={styles.doneButtons}>
        <BigButton label="Play again" emoji="🔁" color={colors.spell} onPress={onAgain} size="lg" />
        <BigButton label="All done" emoji="🏠" color={colors.find} onPress={() => goBack()} size="lg" />
      </View>
    </Screen>
  );
}

export function NoWords({ kid }: { kid: Kid }) {
  return (
    <Screen back={() => goBack()} contentStyle={styles.doneWrap}>
      <Owl size={140} />
      <Txt bold size={26} center>
        No words yet, {kid.name}!
      </Txt>
      <Txt center color={colors.muted}>
        Ask a grown-up to pick some word lists for you.
      </Txt>
    </Screen>
  );
}

export function MissingKid() {
  return (
    <Screen back={() => router.replace('/')} contentStyle={styles.doneWrap}>
      <Txt bold size={24} center>
        We couldn&apos;t find that player.
      </Txt>
      <BigButton label="Go home" emoji="🏠" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 260,
    minHeight: 220,
    borderRadius: 32,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', flexWrap: 'wrap' },
  dot: { width: 14, height: 14, borderRadius: 7 },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  celebrate: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  doneButtons: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center' },
});
