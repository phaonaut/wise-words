import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MissingKid, NoWords, RoundDone, RoundProgress, useRound } from '@/components/game';
import { goBack, Screen, SpeakerButton, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { PRAISE, pickOne } from '@/data/fun';
import { asWord, buzz, say } from '@/lib/speech';
import { useKid } from '@/lib/store';
import type { WordEntry } from '@/lib/types';
import { pickDistractors, shuffle, wordKey } from '@/lib/words';

// The app says a word; the child taps it from a few choices.
export default function HearAndFind() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const kid = useKid(kidId);
  const round = useRound(kid, 'read');

  if (!kid) return <MissingKid />;
  if (!round.words.length) return <NoWords kid={kid} />;
  if (round.done || !round.current)
    return (
      <RoundDone
        kid={kid}
        stars={round.stars}
        sticker={round.sticker}
        total={round.words.length}
        onAgain={round.restart}
      />
    );

  return (
    <Screen back={() => goBack()} title="Hear & Find">
      <RoundProgress index={round.index} total={round.words.length} color={colors.find} />
      <FindQuestion
        key={round.index}
        target={round.current}
        pool={round.pool}
        choiceCount={kid.findChoices}
        onAnswer={round.answer}
      />
    </Screen>
  );
}

function FindQuestion({
  target,
  pool,
  choiceCount,
  onAnswer,
}: {
  target: WordEntry;
  pool: WordEntry[];
  choiceCount: number;
  onAnswer: (firstTry: boolean) => void;
}) {
  const [choices] = useState(() =>
    shuffle([target, ...pickDistractors(target, pool, choiceCount - 1)]),
  );
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const t = setTimeout(() => say('Find the word', asWord(target.word)), 350);
    return () => {
      clearTimeout(t);
      clearTimeout(timer.current);
    };
  }, [target.word]);

  const pick = (choice: WordEntry) => {
    if (solved) return;
    const key = wordKey(choice.word);
    if (key === wordKey(target.word)) {
      setSolved(true);
      buzz('good');
      say(pickOne(PRAISE), asWord(target.word));
      timer.current = setTimeout(() => onAnswer(wrong.length === 0), 1600);
    } else if (!wrong.includes(key)) {
      buzz('oops');
      setWrong([...wrong, key]);
      say('That says', asWord(choice.word), 'Find', asWord(target.word));
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.prompt}>
        <SpeakerButton size={110} onPress={() => say(asWord(target.word))} />
        <Txt size={20} color={colors.muted}>
          Tap 🔊 to hear the word again
        </Txt>
      </View>
      <View style={styles.choices}>
        {choices.map((c) => {
          const key = wordKey(c.word);
          const isWrong = wrong.includes(key);
          const isRight = solved && key === wordKey(target.word);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={c.word}
              disabled={isWrong || solved}
              onPress={() => pick(c)}
              style={({ pressed }) => [
                styles.choice,
                isWrong && { backgroundColor: colors.badSoft, borderColor: colors.badSoft, opacity: 0.6 },
                isRight && { backgroundColor: colors.goodSoft, borderColor: colors.good },
                { transform: [{ scale: pressed ? 0.95 : isRight ? 1.06 : 1 }] },
              ]}>
              <Txt bold size={54} center style={{ lineHeight: 70 }}>
                {c.word}
              </Txt>
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
  prompt: { alignItems: 'center', gap: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  choice: {
    minWidth: 200,
    minHeight: 120,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 4,
    borderColor: colors.find,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
