import type { WordList } from '@/lib/types';

// The 220 Dolch sight words, grouped by the levels schools usually use.
const LEVELS: { id: string; name: string; words: string }[] = [
  {
    id: 'dolch-prek',
    name: 'Pre-K sight words',
    words:
      'a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run said see the three to two up we where yellow you',
  },
  {
    id: 'dolch-k',
    name: 'Kindergarten sight words',
    words:
      'all am are at ate be black brown but came did do eat four get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they this too under want was well went what white who will with yes',
  },
  {
    id: 'dolch-1',
    name: '1st grade sight words',
    words:
      'after again an any as ask by could every fly from give going had has her him his how just know let live may of old once open over put round some stop take thank them then think walk were when',
  },
  {
    id: 'dolch-2',
    name: '2nd grade sight words',
    words:
      "always around because been before best both buy call cold does don't fast first five found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use very wash which why wish work would write your",
  },
  {
    id: 'dolch-3',
    name: '3rd grade sight words',
    words:
      'about better bring carry clean cut done draw drink eight fall far full got grow hold hot hurt if keep kind laugh light long much myself never only own pick seven shall show six small start ten today together try warm',
  },
];

// Sentences for words that sound like other words, or that the voice may say oddly on their own.
export const SENTENCES: Record<string, string> = {
  a: 'I see a cat.',
  i: 'I like to play.',
  to: 'We go to school.',
  two: 'I have two hands.',
  too: 'I want to come too.',
  there: 'The ball is over there.',
  their: 'The kids ride their bikes.',
  for: 'This gift is for you.',
  four: 'A dog has four legs.',
  by: 'Sit by me.',
  buy: 'We buy food at the store.',
  no: 'No, thank you.',
  know: 'I know my name.',
  right: 'Turn to the right.',
  write: 'I can write my name.',
  one: 'I have one nose.',
  ate: 'I ate my lunch.',
  eight: 'A spider has eight legs.',
  new: 'I have new shoes.',
  be: 'I want to be a cat.',
  see: 'I see a bird.',
  its: 'The dog wags its tail.',
  our: 'This is our house.',
  which: 'Which one do you want?',
  would: 'Would you like to play?',
  so: 'I am so happy.',
  red: 'The apple is red.',
  read: 'I like to read books.',
  live: 'I live in a house.',
  blue: 'The sky is blue.',
  made: 'I made a cake.',
  here: 'Come here, please.',
  where: 'Where is my hat?',
  some: 'Can I have some milk?',
  not: 'I am not sad.',
  him: 'I gave him a ball.',
  wish: 'I wish I could fly.',
  close: 'Please close the door.',
  wind: 'The wind is cold.',
};

export const BUILT_IN_LISTS: WordList[] = LEVELS.map((level) => ({
  id: level.id,
  name: level.name,
  builtIn: true,
  words: level.words.split(' ').map((word) => ({ word })),
}));

export const STARTING_LEVELS = BUILT_IN_LISTS.map((l) => ({ id: l.id, name: l.name }));
