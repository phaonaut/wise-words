import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { MissingKid } from '@/components/game';
import { BigButton, goBack, Screen, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { statusOf } from '@/lib/srs';
import { buzz, say } from '@/lib/speech';
import { progressFor, rewardsFor, useKid, useStore } from '@/lib/store';
import { wordKey, wordPool } from '@/lib/words';

const GAMES = [
  { route: 'flashcards', name: 'Flashcards', emoji: '🃏', color: colors.flashcards, hint: 'Read the word to a grown-up' },
  { route: 'find', name: 'Hear & Find', emoji: '👂', color: colors.find, hint: 'Listen, then tap the word' },
  { route: 'spell', name: 'Spell It', emoji: '✏️', color: colors.spell, hint: 'Listen, then spell the word' },
] as const;

export default function KidHome() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const kid = useKid(kidId);
  const { data } = useStore();
  if (!kid) return <MissingKid />;

  const pool = wordPool(data, kid);
  const progress = progressFor(data, kid.id);
  const canRead = pool.filter((w) => statusOf(progress.read[wordKey(w.word)]) === 'mastered').length;
  const canSpell = pool.filter((w) => statusOf(progress.spell[wordKey(w.word)]) === 'mastered').length;
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
        <Meter label="Words I can read" value={canRead} total={pool.length} color={colors.flashcards} />
        <Meter label="Words I can spell" value={canSpell} total={pool.length} color={colors.spell} />
      </View>

      <View style={styles.games}>
        {GAMES.map((g) => (
          <Pressable
            key={g.route}
            accessibilityRole="button"
            accessibilityLabel={g.name}
            onPress={() => {
              buzz('tap');
              say(g.name);
              router.push(`/kid/${kid.id}/${g.route}` as Href);
            }}
            style={({ pressed }) => [
              styles.game,
              { backgroundColor: g.color, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}>
            <Txt size={70} style={{ lineHeight: 90 }}>
              {g.emoji}
            </Txt>
            <Txt bold size={28} color="#fff" center>
              {g.name}
            </Txt>
            <Txt size={16} color="#fff" center>
              {g.hint}
            </Txt>
          </Pressable>
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

function Meter({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.meter}>
      <Txt bold size={18}>
        {label}: {value} of {total}
      </Txt>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meters: { gap: 12, marginTop: 4, marginBottom: 20 },
  meter: { gap: 4 },
  track: { height: 16, borderRadius: 8, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8 },
  games: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  game: {
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
});
