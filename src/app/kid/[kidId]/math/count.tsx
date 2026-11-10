import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { MissingKid, RoundDone, RoundProgress } from '@/components/game';
import { Blocks, NumberChoices, TenFrames, useCell, useMathRound, useTries } from '@/components/math';
import { goBack, Screen, SpeakerButton, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { countRound, type CountProblem } from '@/lib/math';
import { asNumber, say } from '@/lib/speech';
import { useKid } from '@/lib/store';

// The child counts things (or tens and ones blocks) and taps the number.
export default function CountIt() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const kid = useKid(kidId);
  const round = useMathRound(kid, 'count', countRound);

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
    <Screen back={() => goBack()} title="Count It">
      <RoundProgress index={round.index} total={round.problems.length} color={colors.find} />
      <CountQuestion key={round.index} problem={round.current} onAnswer={round.answer} />
    </Screen>
  );
}

function CountQuestion({ problem, onAnswer }: { problem: CountProblem; onAnswer: (firstTry: boolean) => void }) {
  const cell = useCell();
  const { wrong, solved, pick } = useTries(problem.answer, onAnswer, () => [asNumber(problem.answer)]);

  useEffect(() => {
    const t = setTimeout(() => say('How many?'), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.prompt}>
        <SpeakerButton onPress={() => say('How many?')} />
        <Txt bold size={36}>
          How many?
        </Txt>
      </View>
      {problem.blocks ? (
        <Blocks value={problem.answer} cell={cell} />
      ) : (
        <TenFrames count={problem.answer} emoji={problem.emoji} cell={cell} />
      )}
      <NumberChoices
        choices={problem.choices}
        answer={problem.answer}
        wrong={wrong}
        solved={solved}
        color={colors.find}
        onPick={pick}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 26, paddingBottom: 20 },
  prompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
});
