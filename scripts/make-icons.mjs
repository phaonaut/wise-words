// Draws the app icon, Android icons, splash image and favicon from the owl in owl-svg.ts.
// Run with: npm run icons
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

import { owlSvg } from '../src/components/owl-svg.ts';

const CREAM = '#FFF6E5';

function image({ size, owlSize, background, mono = false }) {
  const inner = owlSvg({ mono }).replace(/^<svg[^>]*>|<\/svg>\s*$/g, '');
  const at = (size - owlSize) / 2;
  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bg}
    <svg x="${at}" y="${at}" width="${owlSize}" height="${owlSize}" viewBox="0 0 200 200">${inner}</svg></svg>`;
}

function save(name, svg) {
  const png = new Resvg(svg).render().asPng();
  writeFileSync(new URL(`../assets/images/${name}`, import.meta.url), png);
  console.log('wrote', name);
}

// Full icon (iOS and web): cream square, owl filling most of it.
save('icon.png', image({ size: 1024, owlSize: 820, background: CREAM }));
// Android adaptive icon: the owl stays inside the middle 66% so no launcher shape crops it.
save('android-icon-foreground.png', image({ size: 512, owlSize: 316 }));
save('android-icon-background.png', image({ size: 512, owlSize: 0, background: CREAM }));
save('android-icon-monochrome.png', image({ size: 432, owlSize: 266, mono: true }));
save('splash-icon.png', image({ size: 512, owlSize: 512 }));
save('favicon.png', image({ size: 48, owlSize: 48 }));
