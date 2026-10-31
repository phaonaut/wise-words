import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { MissingKid, NoWords, RoundDone, RoundProgress, useRound } from '@/components/game';
import { BigButton, Card, goBack, Screen, SpeakerButton, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { PRAISE, pickOne } from '@/data/fun';
import { buzz, say } from '@/lib/speech';
import { useKid } from '@/lib/store';
import type { WordEntry } from '@/lib/types';
import { sentenceFor } from '@/lib/words';

// The child reads the word out loud; a grown-up taps whether they got it.
export default function Flashcards() {
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
    <Screen back={() => goBack()} title="Flashcards">
      <RoundProgress index={round.index} total={round.words.length} color={colors.flashcards} />
      <FlashCard key={round.index} word={round.current} onAnswer={round.answer} />
    </Screen>
  );
}

function FlashCard({ word, onAnswer }: { word: WordEntry; onAnswer: (correct: boolean) => void }) {
  const { width } = useWindowDimensions();
  const [learning, setLearning] = useState(false);
  const fontSize = Math.min(150, Math.max(64, (width - 80) / Math.max(word.word.length, 3)));

  return (
    <View style={styles.wrap}>
      <Txt center size={20} color={colors.muted}>
        {learning ? 'Say it together!' : 'Read this word out loud.'}
      </Txt>
      <Card style={[styles.card, learning && { borderColor: colors.flashcards }]}>
        <Txt bold size={fontSize} center style={{ lineHeight: fontSize * 1.25 }}>
          {word.word}
        </Txt>
      </Card>

      {learning ? (
        <View style={styles.row}>
          <SpeakerButton onPress={() => say(word.word, sentenceFor(word))} />
          <BigButton
            label="Next"
            emoji="➡️"
            color={colors.flashcards}
            size="lg"
            onPress={() => onAnswer(false)}
          />
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <BigButton
              label="Got it!"
              emoji="✅"
              color={colors.good}
              size="lg"
              onPress={() => {
                buzz('good');
                say(pickOne(PRAISE));
                onAnswer(true);
              }}
            />
            <BigButton
              label="Practice"
              emoji="🔁"
              color={colors.flashcards}
              size="lg"
              onPress={() => {
                setLearning(true);
                say(`This word is ${word.word}.`, sentenceFor(word));
              }}
            />
          </View>
          <Txt center size={15} color={colors.muted}>
            Grown-ups: tap ✅ if they read it, or 🔁 to hear it and try together.
          </Txt>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 22, paddingBottom: 20 },
  card: { minHeight: 220, alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  row: { flexDirection: 'row', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
});
