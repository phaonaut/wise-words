import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  BigButton,
  Card,
  Checkbox,
  ConfirmButton,
  goBack,
  Screen,
  SectionTitle,
  Txt,
} from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { deleteList, newId, saveKid, saveList, useStore } from '@/lib/store';
import type { AppData, WordList } from '@/lib/types';
import { allLists, parseWordText, sentenceFor, wordsToText } from '@/lib/words';

export default function EditList() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { data } = useStore();
  const list = allLists(data).find((l) => l.id === listId);

  if (list?.builtIn) return <BuiltInList list={list} />;
  return <CustomListEditor existing={list} />;
}

function BuiltInList({ list }: { list: WordList }) {
  return (
    <Screen scroll back={() => goBack('/grownups')} title={list.name}>
      <Txt color={colors.muted} style={{ marginVertical: 10 }}>
        {list.words.length} words. Built-in lists can&apos;t be changed, but you can make your own list.
      </Txt>
      <Card>
        <View style={styles.chips}>
          {list.words.map((w) => (
            <View key={w.word} style={styles.chip}>
              <Txt>{w.word}</Txt>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

function CustomListEditor({ existing }: { existing?: WordList }) {
  const { data, update } = useStore();
  const [id] = useState(() => existing?.id ?? newId());
  const [name, setName] = useState(existing?.name ?? '');
  const [text, setText] = useState(existing ? wordsToText(existing.words) : '');
  const [kidIds, setKidIds] = useState(() =>
    data.kids.filter((k) => k.listIds.includes(id)).map((k) => k.id),
  );
  const words = parseWordText(text);
  const canSave = name.trim().length > 0 && words.length > 0;

  const save = () => {
    update((d: AppData) => {
      let next = saveList({ id, name: name.trim(), words })(d);
      for (const kid of next.kids) {
        const wants = kidIds.includes(kid.id);
        const has = kid.listIds.includes(id);
        if (wants && !has) next = saveKid({ ...kid, listIds: [...kid.listIds, id] })(next);
        if (!wants && has) next = saveKid({ ...kid, listIds: kid.listIds.filter((x) => x !== id) })(next);
      }
      return next;
    });
    goBack('/grownups');
  };

  return (
    <Screen scroll back={() => goBack('/grownups')} title={existing ? 'Edit word list' : 'New word list'}>
      <SectionTitle>List name</SectionTitle>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Spelling words, week 5"
        maxLength={40}
        style={styles.input}
      />

      <SectionTitle>Words</SectionTitle>
      <Txt size={15} color={colors.muted} style={{ marginBottom: 8 }}>
        Type or paste the words, separated by commas, spaces or new lines. To have a sentence read
        aloud with a word, put the word on its own line followed by a colon, like{' '}
        <Txt size={15} bold>
          their: They ride their bikes.
        </Txt>
      </Txt>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={'cat, hat, sat\nthere: The ball is over there.'}
        style={[styles.input, { minHeight: 160, textAlignVertical: 'top' }]}
      />

      <Txt bold style={{ marginTop: 12 }}>
        {words.length} {words.length === 1 ? 'word' : 'words'}
      </Txt>
      <View style={[styles.chips, { marginTop: 6 }]}>
        {words.map((w) => (
          <View key={w.word} style={styles.chip}>
            <Txt>
              {w.word}
              {sentenceFor(w) ? ' 💬' : ''}
            </Txt>
          </View>
        ))}
      </View>

      {data.kids.length > 0 && (
        <>
          <SectionTitle>Who practices this list?</SectionTitle>
          <Card style={{ paddingVertical: 8 }}>
            {data.kids.map((k) => (
              <Checkbox
                key={k.id}
                label={`${k.avatar} ${k.name}`}
                checked={kidIds.includes(k.id)}
                onToggle={() =>
                  setKidIds(kidIds.includes(k.id) ? kidIds.filter((x) => x !== k.id) : [...kidIds, k.id])
                }
              />
            ))}
          </Card>
          <Txt size={14} color={colors.muted} style={{ marginTop: 6 }}>
            Tip: to focus on just this week&apos;s words, untick the other lists on your child&apos;s page.
          </Txt>
        </>
      )}

      <View style={styles.buttons}>
        <BigButton label="Save list" emoji="💾" disabled={!canSave} onPress={save} />
        {existing && (
          <ConfirmButton
            label="Delete list"
            onConfirm={() => {
              router.replace('/grownups');
              update(deleteList(existing.id));
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.regular,
    fontSize: 20,
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
    color: colors.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.fresh },
  buttons: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 24 },
});
