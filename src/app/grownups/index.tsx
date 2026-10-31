import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BigButton, Card, Choice, Screen, SectionTitle, Txt } from '@/components/ui';
import { colors } from '@/constants/theme';
import { BUILT_IN_LISTS } from '@/data/dolch';
import { statusOf } from '@/lib/srs';
import { say } from '@/lib/speech';
import { progressFor, setSpeechRate, useStore } from '@/lib/store';
import type { WordList } from '@/lib/types';
import { allLists, wordKey, wordPool } from '@/lib/words';

export default function GrownupsHome() {
  const { data, update } = useStore();
  const lists = allLists(data);

  return (
    <Screen scroll back={() => router.replace('/')} title="Grown-ups">
      <SectionTitle>Kids</SectionTitle>
      <View style={{ gap: 10 }}>
        {data.kids.map((kid) => {
          const pool = wordPool(data, kid);
          const p = progressFor(data, kid.id);
          const read = pool.filter((w) => statusOf(p.read[wordKey(w.word)]) === 'mastered').length;
          const spell = pool.filter((w) => statusOf(p.spell[wordKey(w.word)]) === 'mastered').length;
          const listNames = kid.listIds
            .map((id) => lists.find((l) => l.id === id)?.name)
            .filter(Boolean)
            .join(', ');
          return (
            <Row
              key={kid.id}
              onPress={() => router.push({ pathname: '/grownups/kid/[kidId]', params: { kidId: kid.id } })}>
              <View style={[styles.avatar, { backgroundColor: kid.color }]}>
                <Txt size={30}>{kid.avatar}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt bold>{kid.name}</Txt>
                <Txt size={14} color={colors.muted} numberOfLines={1}>
                  {listNames || 'No word lists yet'}
                </Txt>
                <Txt size={14} color={colors.muted}>
                  Reads {read} of {pool.length} · Spells {spell} of {pool.length}
                </Txt>
              </View>
              <Txt color={colors.grownups} bold>
                Edit ›
              </Txt>
            </Row>
          );
        })}
        <BigButton
          label="Add a child"
          emoji="➕"
          size="sm"
          style={{ alignSelf: 'flex-start' }}
          onPress={() => router.push({ pathname: '/grownups/kid/[kidId]', params: { kidId: 'new' } })}
        />
      </View>

      <SectionTitle>Your word lists</SectionTitle>
      <Txt size={15} color={colors.muted} style={{ marginBottom: 8 }}>
        Add the spelling or sight words sent home from school.
      </Txt>
      <View style={{ gap: 10 }}>
        {data.customLists.map((l) => (
          <ListRow key={l.id} list={l} action="Edit ›" />
        ))}
        <BigButton
          label="New word list"
          emoji="➕"
          size="sm"
          style={{ alignSelf: 'flex-start' }}
          onPress={() => router.push({ pathname: '/grownups/list/[listId]', params: { listId: 'new' } })}
        />
      </View>

      <SectionTitle>Built-in sight word lists (Dolch)</SectionTitle>
      <View style={{ gap: 10 }}>
        {BUILT_IN_LISTS.map((l) => (
          <ListRow key={l.id} list={l} action="View ›" />
        ))}
      </View>

      <SectionTitle>Voice speed</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Choice
          value={data.settings.speechRate}
          onChange={(rate) => {
            update(setSpeechRate(rate));
            setTimeout(() => say('look', 'I can read!'), 50);
          }}
          options={[
            { value: 0.65, label: 'Slow' },
            { value: 0.85, label: 'Medium' },
            { value: 1, label: 'Normal' },
          ]}
        />
        <Txt size={14} color={colors.muted}>
          The voice comes from the device. On iPhone and iPad, turn off silent mode to hear it.
        </Txt>
      </Card>

      <SectionTitle>How the games work</SectionTitle>
      <Card style={{ gap: 8 }}>
        <Txt size={16}>🃏 Flashcards: your child reads the word out loud, and you tap ✅ or 🔁.</Txt>
        <Txt size={16}>👂 Hear & Find: the app says a word and your child taps it. Good for playing alone.</Txt>
        <Txt size={16}>✏️ Spell It: the app says a word and your child spells it with letter tiles.</Txt>
        <Txt size={16} color={colors.muted}>
          A word counts as learned after it&apos;s answered right on the first try on 3 different days.
          Missed words come back sooner, and learned words come back now and then for review.
        </Txt>
      </Card>
    </Screen>
  );
}

function ListRow({ list, action }: { list: WordList; action: string }) {
  return (
    <Row onPress={() => router.push({ pathname: '/grownups/list/[listId]', params: { listId: list.id } })}>
      <View style={{ flex: 1 }}>
        <Txt bold>{list.name}</Txt>
        <Txt size={14} color={colors.muted} numberOfLines={1}>
          {list.words.length} words: {list.words.slice(0, 8).map((w) => w.word).join(', ')}
          {list.words.length > 8 ? '…' : ''}
        </Txt>
      </View>
      <Txt color={colors.grownups} bold>
        {action}
      </Txt>
    </Row>
  );
}

function Row({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
