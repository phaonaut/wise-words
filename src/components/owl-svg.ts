// Ollie the owl, the Wise Words mascot, as plain SVG markup.
// Kept free of imports so scripts/make-icons.ts can turn it into the app icon images.

export type OwlMood = 'happy' | 'cheer';

type Palette = {
  body: string;
  wing: string;
  belly: string;
  face: string;
  feather: string;
  eyeWhite: string;
  pupil: string;
  shine: string;
  beak: string;
  cheek: string;
  cover: string;
  page: string;
  line: string;
};

const COLOR: Palette = {
  body: '#9C6644',
  wing: '#7A4B2E',
  belly: '#F3D9B1',
  face: '#F8E9CF',
  feather: '#D9B48A',
  eyeWhite: '#FFFFFF',
  pupil: '#2D2A32',
  shine: '#FFFFFF',
  beak: '#F59E0B',
  cheek: '#F4A3A3',
  cover: '#3E9B47',
  page: '#FFFFFF',
  line: '#C9C2B5',
};

const TUFTS = `<path d="M50 74 L40 28 Q60 40 82 54 Z" stroke-width="6" stroke-linejoin="round"/>
  <path d="M150 74 L160 28 Q140 40 118 54 Z" stroke-width="6" stroke-linejoin="round"/>`;
const BEAK = 'M91 112 L109 112 L100 126 Z';
const COVER = 'M56 172 L100 166 L144 172 L144 192 L100 186 L56 192 Z';
const LEFT_PAGE = 'M60 168 Q80 160 100 166 L100 184 Q80 178 60 186 Z';
const RIGHT_PAGE = 'M140 168 Q120 160 100 166 L100 184 Q120 178 140 186 Z';

/** One-color owl with see-through eyes, beak and pages, for Android's themed icon. */
function monoOwl(sizeAttrs: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"${sizeAttrs}>
  <defs>
    <mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
      <rect width="200" height="200" fill="#fff"/>
      <circle cx="74" cy="96" r="21" fill="#000"/>
      <circle cx="126" cy="96" r="21" fill="#000"/>
      <path d="${BEAK}" fill="#000" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
      <path d="${LEFT_PAGE}" fill="#000"/>
      <path d="${RIGHT_PAGE}" fill="#000"/>
    </mask>
  </defs>
  <g mask="url(#cut)" fill="#000" stroke="#000">
    ${TUFTS}
    <ellipse cx="100" cy="116" rx="70" ry="74"/>
    <path d="${COVER}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="46" cy="164" rx="16" ry="12" transform="rotate(-25 46 164)"/>
    <ellipse cx="154" cy="164" rx="16" ry="12" transform="rotate(25 154 164)"/>
  </g>
  <circle cx="78" cy="99" r="11" fill="#000"/>
  <circle cx="122" cy="99" r="11" fill="#000"/>
</svg>`;
}

export function owlSvg({
  mood = 'happy',
  mono = false,
  size,
}: { mood?: OwlMood; mono?: boolean; size?: number } = {}) {
  const sizeAttrs = size ? ` width="${size}" height="${size}"` : '';
  if (mono) return monoOwl(sizeAttrs);
  const c = COLOR;

  // Open eyes, or happy closed "^ ^" eyes when cheering.
  const eyes =
    mood === 'cheer'
      ? `<path d="M58 100 Q74 82 90 100" fill="none" stroke="${c.pupil}" stroke-width="6" stroke-linecap="round"/>
         <path d="M110 100 Q126 82 142 100" fill="none" stroke="${c.pupil}" stroke-width="6" stroke-linecap="round"/>`
      : `<circle cx="74" cy="96" r="21" fill="${c.eyeWhite}"/>
         <circle cx="126" cy="96" r="21" fill="${c.eyeWhite}"/>
         <circle cx="78" cy="99" r="11" fill="${c.pupil}"/>
         <circle cx="122" cy="99" r="11" fill="${c.pupil}"/>
         <circle cx="82" cy="94" r="4" fill="${c.shine}"/>
         <circle cx="126" cy="94" r="4" fill="${c.shine}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"${sizeAttrs}>
  <g fill="${c.body}" stroke="${c.body}">${TUFTS}</g>
  <ellipse cx="100" cy="116" rx="70" ry="74" fill="${c.body}"/>
  <ellipse cx="100" cy="146" rx="46" ry="42" fill="${c.belly}"/>
  <path d="M84 134 l6 6 l6 -6 M104 134 l6 6 l6 -6 M94 150 l6 6 l6 -6" fill="none" stroke="${c.feather}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="74" cy="96" r="30" fill="${c.face}"/>
  <circle cx="126" cy="96" r="30" fill="${c.face}"/>
  ${eyes}
  <circle cx="54" cy="122" r="7" fill="${c.cheek}" opacity="0.7"/>
  <circle cx="146" cy="122" r="7" fill="${c.cheek}" opacity="0.7"/>
  <path d="${BEAK}" fill="${c.beak}" stroke="${c.beak}" stroke-width="4" stroke-linejoin="round"/>
  <path d="${COVER}" fill="${c.cover}" stroke="${c.cover}" stroke-width="4" stroke-linejoin="round"/>
  <path d="${LEFT_PAGE}" fill="${c.page}"/>
  <path d="${RIGHT_PAGE}" fill="${c.page}"/>
  <path d="M68 172 Q80 168 92 171 M68 178 Q80 174 92 177 M108 171 Q120 168 132 172 M108 177 Q120 174 132 178" fill="none" stroke="${c.line}" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="46" cy="164" rx="16" ry="12" fill="${c.wing}" transform="rotate(-25 46 164)"/>
  <ellipse cx="154" cy="164" rx="16" ry="12" fill="${c.wing}" transform="rotate(25 154 164)"/>
</svg>`;
}
