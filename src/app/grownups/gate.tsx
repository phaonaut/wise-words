import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { goBack, Screen, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';

const newQuestion = () => {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 3 + Math.floor(Math.random() * 7);
  return { a, b, answer: a * b };
};

// A simple "grown-ups only" check so kids don't wander into settings.
export default function GrownupGate() {
  const [q, setQ] = useState(newQuestion);
  const [entry, setEntry] = useState('');
  const [missed, setMissed] = useState(false);

  const press = (key: string) => {
    if (key === '⌫') return setEntry(entry.slice(0, -1));
    if (key === 'OK') {
      if (Number(entry) === q.answer) router.replace('/grownups');
      else {
        setMissed(true);
        setQ(newQuestion());
        setEntry('');
      }
      return;
    }
    if (entry.length < 3) setEntry(entry + key);
  };

  return (
    <Screen back={() => goBack()} title="Grown-ups only" contentStyle={styles.wrap}>
      <Txt size={22} center>
        What is {q.a} × {q.b}?
      </Txt>
      <View style={styles.display}>
        <Txt bold size={40}>{entry || ' '}</Txt>
      </View>
      {missed && (
        <Txt color={colors.bad} center>
          Not quite. Here&apos;s a new one.
        </Txt>
      )}
      <View style={styles.pad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={k === '⌫' ? 'Delete' : k}
            onPress={() => press(k)}
            style={({ pressed }) => [
              styles.key,
              k === 'OK' && { backgroundColor: colors.grownups },
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <Txt bold size={26} color={k === 'OK' ? '#fff' : colors.ink}>
              {k}
            </Txt>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  display: {
    minWidth: 160,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
  },
  pad: { width: 280, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  key: {
    width: 80,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
