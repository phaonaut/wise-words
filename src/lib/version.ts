// The publish workflow (.github/workflows/deploy-web.yml) stamps these in when it builds the site.
// The number is the count of commits, so it goes up by one with every update.
// Expo only fills in `process.env.EXPO_PUBLIC_...` when it's written out in full like this.
const number = process.env.EXPO_PUBLIC_BUILD_NUMBER;
const time = process.env.EXPO_PUBLIC_BUILD_TIME;

function when(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Shown in the app so a grown-up can tell which update they have, like "Version 8 · Nov 11, 3:15 PM". */
export const versionLabel = number
  ? [`Version ${number}`, time && when(time)].filter(Boolean).join(' · ')
  : 'Test version (not published)';
