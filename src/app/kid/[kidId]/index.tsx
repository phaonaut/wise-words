import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GameTile, MissingKid } from '@/components/game';
import { BigButton, goBack, Screen, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { countWords, type WordCounts } from '@/lib/srs';
import { progressFor, rewardsFor, useKid, useStore } from '@/lib/store';
import { wordPool } from '@/lib/words';

const GAMES = [
  { route: 'flashcards', name: 'Flashcards', spoken: 'Flashcards', emoji: '🃏', color: colors.flashcards, hint: 'Read the word to a grown-up' },
  { route: 'find', name: 'Hear & Find', spoken: 'Hear and Find', emoji: '👂', color: colors.find, hint: 'Listen, then tap the word' },
  { route: 'spell', name: 'Spell It', spoken: 'Spell It', emoji: '✏️', color: colors.spell, hint: 'Listen, then spell the word' },
  { route: 'math', name: 'Math', spoken: 'Math', emoji: '🔢', color: colors.math, hint: 'Count, add and compare' },
] as const;

export default function KidHome() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const kid = useKid(kidId);
  const { data } = useStore();
  if (!kid) return <MissingKid />;

  const pool = wordPool(data, kid);
  const progress = progressFor(data, kid.id);
  const rewards = rewardsFor(data, kid.id);
  const read = countWords(pool, progress.read);
  const spell = countWords(pool, progress.spell);
  // Until the first words are learned, say why the learned count is still zero.
  const justStarting = read.learned + spell.learned === 0 && read.practicing + spell.practicing > 0;

  return (
    <Screen
      scroll
      back={() => goBack()}
      title={`${kid.avatar} ${kid.name}`}
      right={
        <Txt bold size={24} accessibilityLabel={`${rewards.stars} stars`}>
          ⭐ {rewards.stars}
        </Txt>
      }>
      <View style={styles.meters}>
        <Meter label="Words I can read" stats={read} color={colors.flashcards} />
        <Meter label="Words I can spell" stats={spell} color={colors.spell} />
        {justStarting && (
          <Txt size={14} color={colors.muted}>
            A word is learned once it&apos;s right on 3 different days, so the first ones take about 4 days.
          </Txt>
        )}
      </View>

      <View style={styles.games}>
        {GAMES.map((g) => (
          <GameTile key={g.route} {...g} onPress={() => router.push(`/kid/${kid.id}/${g.route}` as Href)} />
        ))}
      </View>

      <BigButton
        label={`My stickers (${rewards.stickers.length})`}
        emoji="📒"
        color={colors.star}
        size="lg"
        style={{ alignSelf: 'center', marginTop: 22 }}
        onPress={() => router.push(`/kid/${kid.id}/stickers` as Href)}
      />
    </Screen>
  );
}

// The bar fills solid for learned words and lightly for each good day on the words
// still being practiced. Otherwise it wouldn't move for the first few days.
function Meter({ label, stats, color }: { label: string; stats: WordCounts; color: string }) {
  const pct = (n: number) => (stats.total ? (n / stats.total) * 100 : 0);
  return (
    <View style={styles.meter}>
      <Txt bold size={18}>
        {label}
      </Txt>
      <Txt size={16} color={colors.muted}>
        ⭐ {stats.learned} of {stats.total} learned{'   '}🌱 {stats.practicing} practicing
      </Txt>
      <View style={styles.track}>
        <View style={{ width: `${pct(stats.learned)}%`, backgroundColor: color }} />
        <View style={{ width: `${pct(stats.partial)}%`, backgroundColor: color, opacity: 0.4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meters: { gap: 12, marginTop: 4, marginBottom: 20 },
  meter: { gap: 4 },
  track: {
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.line,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  games: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
});
