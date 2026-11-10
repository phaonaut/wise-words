import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  BigButton,
  Card,
  Checkbox,
  Choice,
  ConfirmButton,
  goBack,
  Screen,
  SectionTitle,
  Txt,
} from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { AVATARS, KID_COLORS, pickOne } from '@/data/fun';
import { MATH_LEVELS } from '@/lib/math';
import { statusOf, type WordStatus } from '@/lib/srs';
import {
  deleteKid,
  mathTally,
  newId,
  progressFor,
  resetKidProgress,
  saveKid,
  useStore,
} from '@/lib/store';
import type { Kid, MathGame, Skill } from '@/lib/types';
import { allLists, wordKey } from '@/lib/words';

const STATUS_COLORS: Record<WordStatus, string> = {
  new: colors.fresh,
  learning: colors.learning,
  mastered: colors.goodSoft,
};

export default function EditKid() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const { data, update } = useStore();
  const existing = data.kids.find((k) => k.id === kidId);
  const isNew = !existing;

  const [kid, setKid] = useState<Kid>(
    () =>
      existing ?? {
        id: newId(),
        name: '',
        avatar: pickOne(AVATARS),
        color: pickOne(KID_COLORS),
        listIds: ['dolch-prek'],
        spellInput: 'tiles',
        findChoices: 3,
        mathLevel: 1,
      },
  );
  const change = (patch: Partial<Kid>) => setKid({ ...kid, ...patch });
  const lists = allLists(data);

  const save = () => {
    update(saveKid({ ...kid, name: kid.name.trim() }));
    goBack('/grownups');
  };

  return (
    <Screen
      scroll
      back={() => goBack('/grownups')}
      title={isNew ? 'Add a child' : `${kid.avatar} ${existing.name}`}>
      <SectionTitle>Name</SectionTitle>
      <TextInput
        value={kid.name}
        onChangeText={(name) => change({ name })}
        placeholder="First name"
        maxLength={20}
        style={styles.input}
      />

      <SectionTitle>Picture</SectionTitle>
      <View style={styles.wrapRow}>
        {AVATARS.map((a) => (
          <Pressable
            key={a}
            accessibilityRole="radio"
            accessibilityState={{ selected: kid.avatar === a }}
            onPress={() => change({ avatar: a })}
            style={[styles.pick, kid.avatar === a && { borderColor: colors.grownups, backgroundColor: '#E8EAF6' }]}>
            <Txt size={32} style={{ lineHeight: 42 }}>
              {a}
            </Txt>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Color</SectionTitle>
      <View style={styles.wrapRow}>
        {KID_COLORS.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="radio"
            accessibilityState={{ selected: kid.color === c }}
            onPress={() => change({ color: c })}
            style={[styles.swatch, { backgroundColor: c }, kid.color === c && { borderColor: colors.ink }]}
          />
        ))}
      </View>

      <SectionTitle>Word lists to practice</SectionTitle>
      <Card style={{ paddingVertical: 8 }}>
        {lists.map((l) => (
          <Checkbox
            key={l.id}
            label={l.name}
            detail={`${l.words.length} words`}
            checked={kid.listIds.includes(l.id)}
            onToggle={() =>
              change({
                listIds: kid.listIds.includes(l.id)
                  ? kid.listIds.filter((id) => id !== l.id)
                  : lists.filter((x) => x.id === l.id || kid.listIds.includes(x.id)).map((x) => x.id),
              })
            }
          />
        ))}
      </Card>
      <Txt size={14} color={colors.muted} style={{ marginTop: 6 }}>
        Suggested start: Pre-K list for age 4–5, Kindergarten for age 5–6, 1st grade for age 6–7.
        New words come from the first list until it&apos;s mostly learned.
      </Txt>

      <SectionTitle>Spell It uses</SectionTitle>
      <Choice
        value={kid.spellInput}
        onChange={(spellInput) => change({ spellInput })}
        options={[
          { value: 'tiles', label: 'Letter tiles (easier)' },
          { value: 'keyboard', label: 'Keyboard' },
        ]}
      />

      <SectionTitle>Answer choices (Hear & Find and math)</SectionTitle>
      <Choice
        value={kid.findChoices}
        onChange={(findChoices) => change({ findChoices })}
        options={[
          { value: 3, label: '3 choices (easier)' },
          { value: 4, label: '4 choices' },
        ]}
      />

      <SectionTitle>Math level</SectionTitle>
      <Choice
        value={kid.mathLevel ?? 1}
        onChange={(mathLevel) => change({ mathLevel })}
        options={MATH_LEVELS.map((l) => ({ value: l.level, label: l.label }))}
      />
      <Txt size={14} color={colors.muted} style={{ marginTop: 6 }}>
        {MATH_LEVELS.find((l) => l.level === (kid.mathLevel ?? 1))?.detail}
      </Txt>
      {existing && <MathView kid={existing} />}

      <BigButton
        label={isNew ? 'Add child' : 'Save'}
        emoji="💾"
        disabled={!kid.name.trim()}
        onPress={save}
        style={{ marginTop: 24, alignSelf: 'flex-start' }}
      />

      {existing && (
        <>
          <ProgressView kid={existing} />
          <SectionTitle>Start over</SectionTitle>
          <View style={styles.wrapRow}>
            <ConfirmButton
              label="Reset progress and stickers"
              onConfirm={() => update(resetKidProgress(existing.id))}
            />
            <ConfirmButton
              label={`Remove ${existing.name}`}
              onConfirm={() => {
                router.replace('/grownups');
                update(deleteKid(existing.id));
              }}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const MATH_GAMES: { game: MathGame; name: string }[] = [
  { game: 'count', name: 'Count It' },
  { game: 'add', name: 'Add & Subtract' },
  { game: 'compare', name: 'More or Less' },
];

/** How the child is doing at their saved math level, to help decide when to move up. */
function MathView({ kid }: { kid: Kid }) {
  const { data } = useStore();
  const level = kid.mathLevel ?? 1;
  const tallies = MATH_GAMES.map((g) => ({ ...g, ...mathTally(data, kid.id, g.game, level) }));
  if (tallies.every((t) => t.total === 0)) return null;
  return (
    <Card style={{ marginTop: 10, gap: 4 }}>
      <Txt bold>Right on the first try at level {level}</Txt>
      {tallies.map((t) => (
        <Txt key={t.game} size={15} color={colors.muted}>
          {t.name}: {t.total ? `${t.right} of ${t.total}` : 'not tried yet'}
        </Txt>
      ))}
      <Txt size={14} color={colors.muted}>
        Mostly right? Try the next level.
      </Txt>
    </Card>
  );
}

function ProgressView({ kid }: { kid: Kid }) {
  const { data } = useStore();
  const [skill, setSkill] = useState<Skill>('read');
  const progress = progressFor(data, kid.id)[skill];
  const lists = allLists(data).filter((l) => kid.listIds.includes(l.id));

  const tricky = Object.entries(progress)
    .filter(([, p]) => p.wrong > 0 && statusOf(p) !== 'mastered')
    .sort(([, a], [, b]) => b.wrong - a.wrong)
    .slice(0, 8);

  return (
    <>
      <SectionTitle>Progress</SectionTitle>
      <Choice
        value={skill}
        onChange={setSkill}
        options={[
          { value: 'read', label: '📖 Reading' },
          { value: 'spell', label: '✏️ Spelling' },
        ]}
      />
      <View style={[styles.wrapRow, { marginTop: 10 }]}>
        {(['new', 'learning', 'mastered'] as const).map((s) => (
          <View key={s} style={[styles.chip, { backgroundColor: STATUS_COLORS[s] }]}>
            <Txt size={14}>{s === 'new' ? 'Not tried yet' : s === 'learning' ? 'Learning' : 'Learned'}</Txt>
          </View>
        ))}
      </View>

      {tricky.length > 0 && (
        <Card style={{ marginTop: 12, gap: 6 }}>
          <Txt bold>Tricky words</Txt>
          <Txt size={15} color={colors.muted}>
            {tricky.map(([word, p]) => `${word} (missed ${p.wrong}×)`).join(', ')}
          </Txt>
        </Card>
      )}

      {lists.map((l) => {
        const learned = l.words.filter((w) => statusOf(progress[wordKey(w.word)]) === 'mastered').length;
        return (
          <Card key={l.id} style={{ marginTop: 12, gap: 8 }}>
            <Txt bold>
              {l.name}: {learned} of {l.words.length} learned
            </Txt>
            <View style={styles.wrapRow}>
              {l.words.map((w) => (
                <View
                  key={w.word}
                  style={[styles.chip, { backgroundColor: STATUS_COLORS[statusOf(progress[wordKey(w.word)])] }]}>
                  <Txt size={16}>{w.word}</Txt>
                </View>
              ))}
            </View>
          </Card>
        );
      })}
    </>
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
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pick: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: colors.card,
  },
  swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 4, borderColor: 'transparent' },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
});
