import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { MissingKid, NoWords, RoundDone, RoundProgress, useRound } from '@/components/game';
import { BigButton, goBack, Screen, SpeakerButton, Txt } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { PRAISE, TRY_AGAIN, pickOne } from '@/data/fun';
import { buzz, say } from '@/lib/speech';
import { useKid } from '@/lib/store';
import type { WordEntry } from '@/lib/types';
import { sentenceFor, shuffle } from '@/lib/words';

const MAX_TRIES = 3;

// Letters kids often mix up, used as extra tiles so they have to look carefully.
const LOOKALIKE: Record<string, string> = {
  b: 'd', d: 'b', p: 'q', q: 'p', m: 'n', n: 'm', a: 'e', e: 'i', i: 'e', o: 'u', u: 'o',
  w: 'v', v: 'w', c: 'k', k: 'c', s: 'z', y: 'i', h: 'n', t: 'f', f: 't', l: 'i', r: 'w', g: 'j', j: 'g',
};

function extraLetters(word: string) {
  const inWord = new Set(word.toLowerCase());
  const count = word.length <= 3 ? 2 : 3;
  const extras: string[] = [];
  const add = (ch: string | undefined) => {
    if (ch && !inWord.has(ch) && !extras.includes(ch) && extras.length < count) extras.push(ch);
  };
  shuffle([...inWord]).forEach((ch) => add(LOOKALIKE[ch]));
  shuffle([...'abcdefghijklmnoprstuwy']).forEach(add);
  return extras;
}

const sayWord = (w: WordEntry) => say('Spell', w.word, sentenceFor(w), w.word);

// The app says a word; the child spells it with letter tiles (or the keyboard).
export default function SpellIt() {
  const { kidId } = useLocalSearchParams<{ kidId: string }>();
  const kid = useKid(kidId);
  const round = useRound(kid, 'spell');

  if (!kid) return <MissingKid />;
  if (!round.words.length) return <NoWords kid={kid} />;
  if (round.done || !round.current)
    return (
      <RoundDone
        kid={kid}
        stars={round.stars}
        sticker={round.sticker}
        total={round.words.length}
        onAgain={round.restart}
      />
    );

  return (
    <Screen back={() => goBack()} title="Spell It">
      <RoundProgress index={round.index} total={round.words.length} color={colors.spell} />
      {kid.spellInput === 'keyboard' ? (
        <KeyboardQuestion key={round.index} target={round.current} onAnswer={round.answer} />
      ) : (
        <TileQuestion key={round.index} target={round.current} onAnswer={round.answer} />
      )}
    </Screen>
  );
}

type QuestionProps = { target: WordEntry; onAnswer: (firstTry: boolean) => void };

/** Shared bits: saying the word, peeking, and what happens on right/wrong answers. */
function useSpelling(target: WordEntry, onAnswer: QuestionProps['onAnswer']) {
  const [misses, setMisses] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [usedPeek, setUsedPeek] = useState(false);
  const [result, setResult] = useState<'solved' | 'revealed' | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const list = timers.current;
    list.push(setTimeout(() => sayWord(target), 350));
    return () => list.forEach(clearTimeout);
  }, [target]);

  return {
    misses,
    peeking,
    result,
    peek() {
      setUsedPeek(true);
      setPeeking(true);
      say(target.word);
      timers.current.push(setTimeout(() => setPeeking(false), 2500));
    },
    right() {
      setResult('solved');
      buzz('good');
      say(pickOne(PRAISE));
      const firstTry = misses === 0 && !usedPeek;
      timers.current.push(setTimeout(() => onAnswer(firstTry), 1800));
    },
    /** Returns true when out of tries and the answer is being shown. */
    wrong() {
      const next = misses + 1;
      setMisses(next);
      buzz('oops');
      if (next >= MAX_TRIES) {
        setResult('revealed');
        say(`${target.word} is spelled`, [...target.word].join(', '));
        return true;
      }
      say(pickOne(TRY_AGAIN));
      return false;
    },
  };
}

function TileQuestion({ target, onAnswer }: QuestionProps) {
  const letters = [...target.word];
  const { width } = useWindowDimensions();
  const [tiles] = useState(() =>
    shuffle([...letters, ...extraLetters(target.word)]).map((ch, id) => ({ id, ch })),
  );
  // Each slot holds the id of the tile placed there.
  const [slots, setSlots] = useState<(number | null)[]>(() => letters.map(() => null));
  const [locked, setLocked] = useState<boolean[]>(() => letters.map(() => false));
  const [checking, setChecking] = useState(false);
  const s = useSpelling(target, onAnswer);
  const finished = s.result !== null;

  const slotSize = Math.min(72, (Math.min(width, 900) - 40) / letters.length - 8);
  const tileChar = (id: number | null) => (id === null ? '' : tiles[id].ch);
  const matches = (id: number | null, i: number) =>
    tileChar(id).toLowerCase() === letters[i].toLowerCase();

  const check = (filled: (number | null)[]) => {
    setChecking(false);
    const good = filled.map((id, i) => matches(id, i));
    if (good.every(Boolean)) {
      setLocked(good);
      s.right();
      return;
    }
    const outOfTries = s.wrong();
    if (outOfTries) {
      // Show the right spelling using the tiles.
      const used = new Set<number>();
      const answer = letters.map((ch) => {
        const tile = tiles.find((t) => !used.has(t.id) && t.ch.toLowerCase() === ch.toLowerCase());
        if (tile) used.add(tile.id);
        return tile ? tile.id : null;
      });
      setSlots(answer);
      setLocked(letters.map(() => true));
    } else {
      // Keep the letters that are right; send the rest back.
      setLocked(good);
      setSlots(filled.map((id, i) => (good[i] ? id : null)));
    }
  };

  const placeTile = (id: number) => {
    if (finished || checking || slots.includes(id)) return;
    const at = slots.indexOf(null);
    if (at === -1) return;
    buzz('tap');
    const next = [...slots];
    next[at] = id;
    setSlots(next);
    if (!next.includes(null)) {
      setChecking(true);
      setTimeout(() => check(next), 300);
    }
  };

  const removeAt = (i: number) => {
    if (finished || checking || locked[i] || slots[i] === null) return;
    const next = [...slots];
    next[i] = null;
    setSlots(next);
  };

  return (
    <View style={styles.wrap}>
      <Controls target={target} spelling={s} onAnswer={onAnswer} />

      <View style={styles.slots}>
        {letters.map((_, i) => {
          const id = slots[i];
          const ok = locked[i];
          return (
            <Pressable
              key={i}
              accessibilityLabel={id === null ? `Empty box ${i + 1}` : `Letter ${tileChar(id)}`}
              onPress={() => removeAt(i)}
              style={[
                styles.slot,
                { width: slotSize, height: slotSize * 1.2 },
                ok && { borderColor: colors.good, backgroundColor: colors.goodSoft },
                s.result === 'revealed' && { borderColor: colors.flashcards, backgroundColor: '#FFE4D9' },
              ]}>
              <Txt bold size={slotSize * 0.6} style={{ lineHeight: slotSize * 0.8 }}>
                {tileChar(id)}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tiles}>
        {tiles.map((t) => {
          const used = slots.includes(t.id);
          return (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={`Letter ${t.ch}`}
              disabled={used || finished}
              onPress={() => placeTile(t.id)}
              style={({ pressed }) => [
                styles.tile,
                used && { opacity: 0.15 },
                { transform: [{ scale: pressed ? 0.9 : 1 }] },
              ]}>
              <Txt bold size={40} color="#fff" style={{ lineHeight: 50 }}>
                {t.ch}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      {!finished && (
        <Txt center size={15} color={colors.muted}>
          Tap a letter to put it in. Tap a box to take a letter out.
        </Txt>
      )}
    </View>
  );
}

function KeyboardQuestion({ target, onAnswer }: QuestionProps) {
  const [text, setText] = useState('');
  const s = useSpelling(target, onAnswer);
  const finished = s.result !== null;

  const submit = () => {
    if (finished || !text.trim()) return;
    if (text.trim().toLowerCase() === target.word.toLowerCase()) s.right();
    else if (s.wrong()) setText(target.word);
  };

  return (
    <View style={styles.wrap}>
      <Controls target={target} spelling={s} onAnswer={onAnswer} />
      <Txt center size={18} color={colors.muted}>
        {target.word.length} letters
      </Txt>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        editable={!finished}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        keyboardType="visible-password"
        accessibilityLabel="Type the word"
        style={[
          styles.input,
          s.result === 'solved' && { borderColor: colors.good, backgroundColor: colors.goodSoft },
          s.result === 'revealed' && { borderColor: colors.flashcards, backgroundColor: '#FFE4D9' },
        ]}
      />
      {!finished && (
        <BigButton label="Check" emoji="✔️" color={colors.spell} size="lg" onPress={submit} style={{ alignSelf: 'center' }} />
      )}
    </View>
  );
}

function Controls({
  target,
  spelling: s,
  onAnswer,
}: {
  target: WordEntry;
  spelling: ReturnType<typeof useSpelling>;
  onAnswer: QuestionProps['onAnswer'];
}) {
  return (
    <View style={styles.controls}>
      <SpeakerButton size={96} onPress={() => sayWord(target)} />
      {s.result === 'revealed' ? (
        <BigButton label="Next" emoji="➡️" color={colors.spell} size="lg" onPress={() => onAnswer(false)} />
      ) : s.result === 'solved' ? (
        <Txt bold size={34} color={colors.good}>
          ⭐ {target.word}
        </Txt>
      ) : s.peeking ? (
        <View style={styles.peek}>
          <Txt bold size={44} style={{ lineHeight: 56 }}>
            {target.word}
          </Txt>
        </View>
      ) : (
        <BigButton label="Peek" emoji="👀" color={colors.star} onPress={s.peek} />
      )}
      {s.misses > 0 && s.result === null && (
        <Txt size={16} color={colors.muted}>
          Try {s.misses + 1} of {MAX_TRIES}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 24, paddingBottom: 20 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap', minHeight: 100 },
  peek: { backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 22, borderWidth: 3, borderColor: colors.star },
  slots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  slot: {
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.line,
    borderBottomWidth: 6,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  tile: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.spell,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  input: {
    alignSelf: 'center',
    width: '90%',
    maxWidth: 520,
    fontFamily: fonts.bold,
    fontSize: 48,
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: colors.spell,
    backgroundColor: colors.card,
    color: colors.ink,
  },
});
