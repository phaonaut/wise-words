import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GameTile, MissingKid } from '@/components/game';
import { BigButton, goBack, Screen, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { MASTERED } from '@/lib/srs';
import { progressFor, rewardsFor, useKid, useStore } from '@/lib/store';
import type { WordEntry, WordProgress } from '@/lib/types';
import { wordKey, wordPool } from '@/lib/words';

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
        <Meter label="Words I can read" stats={meterStats(pool, progress.read)} color={colors.flashcards} />
        <Meter label="Words I can spell" stats={meterStats(pool, progress.spell)} color={colors.spell} />
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

type MeterStats = { total: number; learned: number; onTheWay: number; partial: number };

// A word is learned after 3 good days, so the bar also fills a little for each step
// along the way. Otherwise a first round would never move it.
function meterStats(pool: WordEntry[], progress: Record<string, WordProgress>): MeterStats {
  let learned = 0;
  let onTheWay = 0;
  let partial = 0;
  for (const w of pool) {
    const p = progress[wordKey(w.word)];
    if (!p) continue;
    if (p.box >= MASTERED) learned++;
    else if (p.box > 0) {
      onTheWay++;
      partial += p.box / MASTERED;
    }
  }
  return { total: pool.length, learned, onTheWay, partial };
}

function Meter({ label, stats, color }: { label: string; stats: MeterStats; color: string }) {
  const pct = (n: number) => (stats.total ? (n / stats.total) * 100 : 0);
  return (
    <View style={styles.meter}>
      <Txt bold size={18}>
        {label}: {stats.learned} of {stats.total}
        {stats.onTheWay > 0 && (
          <Txt size={16} color={colors.muted}>
            {'  '}⭐ {stats.onTheWay} on the way
          </Txt>
        )}
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
