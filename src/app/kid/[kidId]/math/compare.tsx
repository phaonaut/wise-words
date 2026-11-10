import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MissingKid, RoundDone, RoundProgress } from '@/components/game';
import { TenFrames, useCell, useMathRound, useTries } from '@/components/math';
import { goBack, Screen, SpeakerButton, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { compareRound, type CompareProblem } from '@/lib/math';
import { say } from '@/lib/speech';
import { useKid } from '@/lib/store';

// The child taps the bigger (or smaller) group or number.
export default function MoreOrLess() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const kid = useKid(kidId);
  const round = useMathRound(kid, 'compare', compareRound);

  if (!kid) return <MissingKid />;
  if (round.done || !round.current)
    return (
      <RoundDone
        kid={kid}
        stars={round.stars}
        sticker={round.sticker}
        total={round.problems.length}
        onAgain={round.restart}
      />
    );

  return (
    <Screen back={() => goBack()} title="More or Less">
      <RoundProgress index={round.index} total={round.problems.length} color={colors.spell} />
      <CompareQuestion key={round.index} problem={round.current} onAnswer={round.answer} />
    </Screen>
  );
}

function CompareQuestion({
  problem,
  onAnswer,
}: {
  problem: CompareProblem;
  onAnswer: (firstTry: boolean) => void;
}) {
  const cell = useCell();
  const { wrong, solved, pick } = useTries(problem.answer, onAnswer);

  useEffect(() => {
    const t = setTimeout(() => say(problem.prompt), 350);
    return () => clearTimeout(t);
  }, [problem.prompt]);

  return (
    <View style={styles.wrap}>
      <View style={styles.prompt}>
        <SpeakerButton onPress={() => say(problem.prompt)} />
        <Txt bold size={32} center style={{ flexShrink: 1 }}>
          {problem.prompt}
        </Txt>
      </View>
      <View style={styles.cards}>
        {problem.numbers.map((n) => {
          const isWrong = wrong.includes(n);
          const isRight = solved && n === problem.answer;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={problem.emoji ? `A group of ${n}` : `${n}`}
              disabled={isWrong || solved}
              onPress={() => pick(n)}
              style={({ pressed }) => [
                styles.card,
                !problem.emoji && { minWidth: 150 },
                isWrong && { backgroundColor: colors.badSoft, borderColor: colors.badSoft, opacity: 0.6 },
                isRight && { backgroundColor: colors.goodSoft, borderColor: colors.good },
                { transform: [{ scale: pressed ? 0.96 : isRight ? 1.04 : 1 }] },
              ]}>
              {problem.emoji ? (
                <TenFrames count={n} emoji={problem.emoji} cell={cell * 0.8} />
              ) : (
                <Txt bold size={problem.numbers.length > 2 ? 54 : 64} center style={{ lineHeight: 82 }}>
                  {n}
                </Txt>
              )}
              {isRight && <Txt size={30}>⭐</Txt>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 28, paddingBottom: 20 },
  prompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, justifyContent: 'center' },
  card: {
    minWidth: 180,
    minHeight: 150,
    padding: 16,
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 4,
    borderColor: colors.spell,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
