import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ROUND_SIZE } from '@/components/game';
import { Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { PRAISE, pickOne, TRY_AGAIN } from '@/data/fun';
import { buzz, say, stopSpeaking, type Part } from '@/lib/speech';
import { chooseSticker, giveSticker, recordMath, useStore } from '@/lib/store';
import type { Kid, MathGame, MathLevel } from '@/lib/types';

/** Runs one round of a math game: the problems, which one we're on, stars, and the sticker at the end. */
export function useMathRound<P>(
  kid: Kid | undefined,
  game: MathGame,
  makeRound: (level: MathLevel, choiceCount: number, size: number) => P[],
) {
  const { data, update } = useStore();
  const level = kid?.mathLevel ?? 1;
  const make = () => (kid ? makeRound(level, kid.findChoices, ROUND_SIZE) : []);

  const [problems, setProblems] = useState<P[]>(make);
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [sticker, setSticker] = useState<string | null>(null);
  // Guards against a quick double-tap counting the same problem twice.
  const answered = useRef(-1);

  useEffect(() => () => stopSpeaking(), []);

  const done = problems.length > 0 && index >= problems.length;

  return {
    problems,
    index,
    current: problems[index] as P | undefined,
    done,
    stars,
    sticker,
    /** Saves the answer and moves to the next problem. `correct` means right on the first try. */
    answer(correct: boolean) {
      if (!kid || done || answered.current === index) return;
      answered.current = index;
      update(recordMath(kid.id, game, level, correct));
      if (correct) setStars((s) => s + 1);
      const next = index + 1;
      setIndex(next);
      if (next >= problems.length) {
        const s = chooseSticker(data, kid.id);
        setSticker(s);
        update(giveSticker(kid.id, s));
      }
    },
    restart() {
      answered.current = -1;
      setProblems(make());
      setIndex(0);
      setStars(0);
      setSticker(null);
    },
  };
}

/**
 * Tracks the taps on one problem. A wrong answer is crossed off and the child tries again;
 * the right one is praised and then `onAnswer` moves on.
 */
export function useTries(
  answer: number,
  onAnswer: (firstTry: boolean) => void,
  /** What to say after the praise, like the answer, or "3 plus 2 is 5" when it took more than one try. */
  afterPraise: (firstTry: boolean) => Part[] = () => [],
) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const pick = (value: number) => {
    if (solved) return;
    if (value === answer) {
      setSolved(true);
      buzz('good');
      const firstTry = wrong.length === 0;
      // Move on once the voice has finished, but leave the star up for a moment either way,
      // and never wait longer than a few seconds if the voice gets stuck.
      const spoken = say(pickOne(PRAISE), ...afterPraise(firstTry));
      const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
      void Promise.all([Promise.race([spoken, pause(7000)]), pause(1600)]).then(() => {
        if (mounted.current) onAnswer(firstTry);
      });
    } else if (!wrong.includes(value)) {
      buzz('oops');
      setWrong([...wrong, value]);
      say(pickOne(TRY_AGAIN));
    }
  };

  return { wrong, solved, pick };
}

/** A row of big number buttons to answer with. */
export function NumberChoices({
  choices,
  answer,
  wrong,
  solved,
  color,
  onPick,
}: {
  choices: number[];
  answer: number;
  wrong: number[];
  solved: boolean;
  color: string;
  onPick: (value: number) => void;
}) {
  return (
    <View style={styles.choices}>
      {choices.map((n) => {
        const isWrong = wrong.includes(n);
        const isRight = solved && n === answer;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n}`}
            disabled={isWrong || solved}
            onPress={() => onPick(n)}
            style={({ pressed }) => [
              styles.choice,
              { borderColor: color },
              isWrong && styles.wrong,
              isRight && styles.right,
              { transform: [{ scale: pressed ? 0.95 : isRight ? 1.06 : 1 }] },
            ]}>
            <Txt bold size={54} center style={{ lineHeight: 70 }}>
              {n}
            </Txt>
            {isRight && <Txt size={30}>⭐</Txt>}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Size of one counting square: smaller on phones so everything fits, bigger on tablets. */
export function useCell() {
  const { width } = useWindowDimensions();
  return width < 520 ? 34 : width < 800 ? 50 : 60;
}

/**
 * Things to count, set out in ten-frames (two rows of five) so kids can see groups of 5 and 10.
 * `crossed` crosses off that many from the end, to show taking away.
 */
export function TenFrames({
  count,
  emoji,
  crossed = 0,
  cell,
}: {
  count: number;
  emoji: string;
  crossed?: number;
  cell: number;
}) {
  const frames = Math.max(1, Math.ceil(count / 10));
  return (
    <View style={styles.frames} accessibilityLabel={`${count} to count`}>
      {Array.from({ length: frames }, (_, f) => (
        <View key={f} style={[styles.frame, { width: cell * 5 + 6 }]}>
          {Array.from({ length: 10 }, (_, i) => {
            const n = f * 10 + i;
            const gone = n < count && n >= count - crossed;
            return (
              <View key={i} style={[styles.cell, { width: cell, height: cell }]}>
                {n < count && (
                  <Txt size={cell * 0.58} style={{ lineHeight: cell * 0.8, opacity: gone ? 0.3 : 1 }}>
                    {emoji}
                  </Txt>
                )}
                {gone && <View style={[styles.slash, { width: cell * 0.9 }]} />}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** A number shown as tens rods and ones cubes. */
export function Blocks({ value, cell }: { value: number; cell: number }) {
  const unit = cell * 0.36;
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return (
    <View style={styles.blocks} accessibilityLabel="Tens and ones blocks">
      <View style={styles.blockGroup}>
        <View style={styles.rods}>
          {Array.from({ length: tens }, (_, r) => (
            <View key={r} style={styles.rod}>
              {Array.from({ length: 10 }, (_, i) => (
                <View key={i} style={[styles.unit, { width: unit, height: unit, backgroundColor: colors.find }]} />
              ))}
            </View>
          ))}
        </View>
        <Txt size={16} color={colors.muted}>
          tens
        </Txt>
      </View>
      {ones > 0 && (
        <View style={styles.blockGroup}>
          <View style={[styles.onesGrid, { width: unit * 3 + 8 }]}>
            {Array.from({ length: ones }, (_, i) => (
              <View key={i} style={[styles.unit, { width: unit, height: unit, backgroundColor: colors.flashcards }]} />
            ))}
          </View>
          <Txt size={16} color={colors.muted}>
            ones
          </Txt>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  choice: {
    minWidth: 116,
    minHeight: 110,
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  wrong: { backgroundColor: colors.badSoft, borderColor: colors.badSoft, opacity: 0.6 },
  right: { backgroundColor: colors.goodSoft, borderColor: colors.good },
  frames: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  frame: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 3,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  slash: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bad,
    transform: [{ rotate: '-45deg' }],
  },
  blocks: { flexDirection: 'row', gap: 28, justifyContent: 'center', alignItems: 'flex-end', flexWrap: 'wrap' },
  blockGroup: { alignItems: 'center', gap: 6 },
  rods: { flexDirection: 'row', gap: 6, alignItems: 'flex-end' },
  rod: { gap: 2 },
  onesGrid: { flexDirection: 'row', flexWrap: 'wrap-reverse', gap: 4 },
  unit: { borderRadius: 3 },
});
