/**
 * embedFont: inject the Architects Daughter woff2 into a self-contained map SVG.
 *
 * The engine deliberately carries no font bytes (src/ must stay small and
 * browser-safe), so the self-contained palette only declares a cursive font
 * stack. For files committed to this repo (the gallery's map.svg), this helper
 * prepends an @font-face rule with a base64 data URI of the woff2 from
 * node_modules/@fontsource/architects-daughter, so the maps look hand-drawn
 * on GitHub and on disk without any network fetch.
 *
 * Idempotent (a marker comment guards against double injection) and
 * deterministic (same font file, same output). Shared by
 * scripts/build-blueprints.mjs and test/gallery-freshness.test.mjs so the
 * freshness test regenerates exactly what the build script wrote.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const MARKER = '/*ob-embedded-font*/';

const require = createRequire(import.meta.url);
const woff2Path = require.resolve(
  '@fontsource/architects-daughter/files/architects-daughter-latin-400-normal.woff2',
);
const fontFace =
  MARKER +
  "@font-face{font-family:'Architects Daughter';" +
  `src:url(data:font/woff2;base64,${readFileSync(woff2Path).toString('base64')}) format('woff2')}`;

/** Inject the @font-face rule inside the SVG's existing <style> block. */
export function embedFont(svg) {
  if (svg.includes(MARKER)) return svg;
  if (!svg.includes('<style>')) {
    throw new Error('embedFont expects a self-contained map SVG with a <style> block');
  }
  return svg.replace('<style>', '<style>' + fontFace);
}
