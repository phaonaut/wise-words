import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { MissingKid, RoundDone, RoundProgress } from '@/components/game';
import { NumberChoices, TenFrames, useCell, useMathRound, useTries } from '@/components/math';
import { goBack, Screen, SpeakerButton, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { addRound, type AddProblem } from '@/lib/math';
import { asNumber, say } from '@/lib/speech';
import { useKid } from '@/lib/store';

// The child solves an addition or subtraction problem. Small ones come with pictures to count.
export default function AddAndSubtract() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const kid = useKid(kidId);
  const round = useMathRound(kid, 'add', addRound);

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
    <Screen back={() => goBack()} title="Add & Subtract">
      <RoundProgress index={round.index} total={round.problems.length} color={colors.flashcards} />
      <AddQuestion key={round.index} problem={round.current} onAnswer={round.answer} />
    </Screen>
  );
}

const ask = (p: AddProblem) => say('What is', asNumber(p.a), p.word, asNumber(p.b));

function AddQuestion({ problem, onAnswer }: { problem: AddProblem; onAnswer: (firstTry: boolean) => void }) {
  const cell = useCell();
  const { a, b, op, answer, emoji, word } = problem;
  // Right away: just the answer, to keep things moving. After a miss: the whole sentence, to help it stick.
  const { wrong, solved, pick } = useTries(answer, onAnswer, (firstTry) =>
    firstTry ? [asNumber(answer)] : [asNumber(a), word, asNumber(b), 'is', asNumber(answer)],
  );

  useEffect(() => {
    const t = setTimeout(() => ask(problem), 350);
    return () => clearTimeout(t);
  }, [problem]);

  return (
    <View style={styles.wrap}>
      <View style={styles.prompt}>
        <SpeakerButton onPress={() => ask(problem)} />
        <Txt bold size={64} style={{ lineHeight: 80 }} accessibilityLabel={`What is ${a} ${word} ${b}?`}>
          {a} {op === '+' ? '+' : '−'} {b} ={' '}
          <Txt bold size={64} color={solved ? colors.good : colors.muted}>
            {solved ? answer : '?'}
          </Txt>
        </Txt>
      </View>
      {emoji &&
        (op === '+' ? (
          <View style={styles.pictures}>
            <TenFrames count={a} emoji={emoji} cell={cell * 0.7} />
            <Txt bold size={40} color={colors.muted}>
              +
            </Txt>
            <TenFrames count={b} emoji={emoji} cell={cell * 0.7} />
          </View>
        ) : (
          <TenFrames count={a} emoji={emoji} crossed={b} cell={cell} />
        ))}
      <NumberChoices
        choices={problem.choices}
        answer={answer}
        wrong={wrong}
        solved={solved}
        color={colors.flashcards}
        onPick={pick}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 26, paddingBottom: 20 },
  prompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
  pictures: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' },
});
