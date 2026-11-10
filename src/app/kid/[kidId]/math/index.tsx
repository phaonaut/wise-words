import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GameTile, MissingKid } from '@/components/game';
import { goBack, Screen, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { rewardsFor, useKid, useStore } from '@/lib/store';

const GAMES = [
  { route: 'count', name: 'Count It', emoji: '🐞', color: colors.find, hint: 'How many are there?' },
  { route: 'add', name: 'Add & Subtract', spoken: 'Add and Subtract', emoji: '➕', color: colors.flashcards, hint: 'Put together and take away' },
  { route: 'compare', name: 'More or Less', emoji: '⚖️', color: colors.spell, hint: 'Which one is bigger?' },
] as const;

export default function MathHome() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const kid = useKid(kidId);
  const { data } = useStore();
  if (!kid) return <MissingKid />;

  const rewards = rewardsFor(data, kid.id);

  return (
    <Screen
      scroll
      back={() => goBack()}
      title="🔢 Math"
      right={
        <Txt bold size={24} accessibilityLabel={`${rewards.stars} stars`}>
          ⭐ {rewards.stars}
        </Txt>
      }>
      <View style={styles.games}>
        {GAMES.map((g) => (
          <GameTile key={g.route} {...g} onPress={() => router.push(`/kid/${kid.id}/math/${g.route}` as Href)} />
        ))}
      </View>
      <Txt size={15} color={colors.muted} center style={{ marginTop: 22 }}>
        Level {kid.mathLevel ?? 1}. Grown-ups can change the level.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  games: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 12 },
});
