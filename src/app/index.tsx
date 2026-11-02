import { router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Logo } from '@/components/owl';
import { BigButton, Card, Screen, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { buzz, say } from '@/lib/speech';
import { useStore } from '@/lib/store';

export default function WhoIsPlaying() {
  const { data } = useStore();
  const { width } = useWindowDimensions();
  const openGrownups = () => router.push('/grownups/gate');

  return (
    <Screen
      scroll
      right={
        <BigButton
          size="sm"
          label={width < 600 ? '🔒' : '🔒 Grown-ups'}
          accessibilityLabel="Grown-ups"
          onPress={openGrownups}
        />
      }>
      <View style={styles.titleBlock}>
        <Logo />
        {data.kids.length > 0 && (
          <Txt size={26} center color={colors.muted}>
            Whoo&apos;s learning?
          </Txt>
        )}
      </View>

      {data.kids.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 14 }}>
          <Txt size={18} color={colors.muted} center>
            Hi, I&apos;m Ollie the owl!
          </Txt>
          <Txt bold size={24} center>
            Welcome!
          </Txt>
          <Txt center color={colors.muted}>
            Grown-ups: add your kids and pick their word lists to get started.
          </Txt>
          <BigButton label="Set up" emoji="🔒" onPress={openGrownups} />
        </Card>
      ) : (
        <View style={styles.grid}>
          {data.kids.map((kid) => (
            <Pressable
              key={kid.id}
              accessibilityRole="button"
              accessibilityLabel={kid.name}
              onPress={() => {
                buzz('tap');
                say('Hi! Ready to learn?');
                router.push({ pathname: '/kid/[kidId]', params: { kidId: kid.id } });
              }}
              style={({ pressed }) => [
                styles.kid,
                { backgroundColor: kid.color, transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}>
              <Txt size={84} style={{ lineHeight: 104 }}>
                {kid.avatar}
              </Txt>
              <View style={styles.nameTag}>
                <Txt bold size={28} numberOfLines={1}>
                  {kid.name}
                </Txt>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleBlock: { marginTop: 12, marginBottom: 28, gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' },
  nameTag: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, maxWidth: 190 },
  kid: {
    width: 220,
    height: 220,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
