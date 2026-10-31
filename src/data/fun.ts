export const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐙', '🦄', '🐯', '🐨', '🐶', '🐱', '🐵', '🦖', '🐢', '🦋', '🐧', '🚀'];

export const KID_COLORS = ['#FF8A65', '#4FC3F7', '#81C784', '#BA68C8', '#FFD54F', '#F06292', '#4DB6AC', '#7986CB'];

export const STICKERS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦉', '🦄',
  '🐝', '🦋', '🐢', '🐙', '🦀', '🐬', '🐳', '🦕', '🦖', '🐞',
  '🌈', '⭐', '🌻', '🍓', '🍩', '🍦', '🚀', '🚂', '🎈', '🏰',
];

export const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Super!', 'Nice work!', 'Yes!'];

export const TRY_AGAIN = ['Try again!', 'Almost! Try again.', 'Keep going!'];

export const pickOne = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
