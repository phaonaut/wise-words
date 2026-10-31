import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MissingKid } from '@/components/game';
import { goBack, Screen, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { STICKERS } from '@/data/fun';
import { rewardsFor, useKid, useStore } from '@/lib/store';

export default function Stickers() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const kid = useKid(kidId);
  const { data } = useStore();
  if (!kid) return <MissingKid />;

  const owned = new Set(rewardsFor(data, kid.id).stickers);

  return (
    <Screen scroll back={() => goBack()} title="My stickers">
      <Txt center size={20} color={colors.muted} style={{ marginBottom: 16 }}>
        {owned.size} of {STICKERS.length} found. Finish a game to get a new one!
      </Txt>
      <View style={styles.grid}>
        {STICKERS.map((s) => (
          <View key={s} style={[styles.slot, owned.has(s) ? styles.slotOn : null]}>
            <Txt size={48} style={{ lineHeight: 60, opacity: owned.has(s) ? 1 : 0.12 }}>
              {owned.has(s) ? s : '❔'}
            </Txt>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  slot: {
    width: 84,
    height: 84,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fresh,
  },
  slotOn: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.star },
});
