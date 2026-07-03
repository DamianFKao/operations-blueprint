/**
 * sketch-lite: a tiny, dependency-free, deterministic hand-drawn SVG renderer.
 *
 * Imitates the double-stroke "sketch" line quality of rough.js (MIT, by Preet Shihn;
 * the jitter model here follows its line algorithm) without adding a dependency:
 * every stroke is a cubic bezier drawn twice with independently jittered control
 * points, endpoints pinned exactly so boxes close and arrows land where they should.
 *
 * Determinism contract: every shape is seeded from a caller-supplied string key via
 * FNV-1a, so the same key always yields the same wobble. No Math.random anywhere.
 * Pure functions, browser-safe: this module runs identically in the site's client
 * script, at SSR time, in the CLI, and in tests.
 */

/** FNV-1a over a string, folded into a non-zero 31-bit LCG seed. */
export function seedFrom(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h & 0x7fffffff) || 1;
}

/** Park-Miller LCG (the same core rough.js uses). Never seed with 0. */
export function createRng(seed: number): () => number {
  let s = (seed & 0x7fffffff) || 1;
  return () => {
    s = (2 ** 31 - 1) & Math.imul(48271, s);
    return s / 2 ** 31;
  };
}

export interface StrokeOptions {
  /** Peak jitter in px before length scaling. Default 2 (rough.js default). */
  maxOffset?: number;
  /** Jitter multiplier. Default 1.05 (matches the site's sketch.ts). */
  roughness?: number;
  /** Perpendicular bow of the whole stroke. Default 0.8 (matches the site). */
  bowing?: number;
}

const fmt = (n: number): string => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};

/**
 * One jittered pass of a line as a cubic bezier "M ... C ..." fragment.
 * Endpoints are exact (preserveVertices); only the two control points wobble.
 */
function linePass(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rng: () => number,
  o: StrokeOptions,
  overlay: boolean,
): string {
  const lenSq = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
  const len = Math.sqrt(lenSq);
  let gain = 1;
  if (len > 500) gain = 0.4;
  else if (len > 200) gain = -0.0016668 * len + 1.233334;
  let offset = o.maxOffset ?? 2;
  if (offset * offset * 100 > lenSq) offset = len / 10;
  const off = (overlay ? offset / 2 : offset) * gain * (o.roughness ?? 1.05);
  const bow = ((o.bowing ?? 0.8) * (o.maxOffset ?? 2)) / 200;
  const midX = bow * (y2 - y1);
  const midY = bow * (x1 - x2);
  const jitter = () => (rng() * 2 - 1) * off;
  const d1 = 0.2 + rng() * 0.2;
  const d2 = 0.2 + rng() * 0.2;
  const c1x = midX + x1 + (x2 - x1) * d1 + jitter();
  const c1y = midY + y1 + (y2 - y1) * d1 + jitter();
  const c2x = midX + x2 - (x2 - x1) * d2 + jitter();
  const c2y = midY + y2 - (y2 - y1) * d2 + jitter();
  return `M${fmt(x1)} ${fmt(y1)} C${fmt(c1x)} ${fmt(c1y)}, ${fmt(c2x)} ${fmt(c2y)}, ${fmt(x2)} ${fmt(y2)}`;
}

/** A double-pass sketch line as a path `d` string (two subpaths). */
export function lineD(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rng: () => number,
  o: StrokeOptions = {},
): string {
  return `${linePass(x1, y1, x2, y2, rng, o, false)} ${linePass(x1, y1, x2, y2, rng, o, true)}`;
}

/** A double-pass sketch rectangle (four sketched sides) as a path `d` string. */
export function rectD(x: number, y: number, w: number, h: number, rng: () => number, o: StrokeOptions = {}): string {
  return [
    lineD(x, y, x + w, y, rng, o),
    lineD(x + w, y, x + w, y + h, rng, o),
    lineD(x + w, y + h, x, y + h, rng, o),
    lineD(x, y + h, x, y, rng, o),
  ].join(' ');
}

/** A sketch line with a small hand-drawn arrowhead at (x2,y2). */
export function arrowD(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rng: () => number,
  o: StrokeOptions = {},
): string {
  const head = 9;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a1 = ang + Math.PI - 0.42;
  const a2 = ang + Math.PI + 0.42;
  return [
    lineD(x1, y1, x2, y2, rng, o),
    lineD(x2, y2, x2 + Math.cos(a1) * head, y2 + Math.sin(a1) * head, rng, o),
    lineD(x2, y2, x2 + Math.cos(a2) * head, y2 + Math.sin(a2) * head, rng, o),
  ].join(' ');
}

/**
 * One jittered pass of a cubic bezier with exact endpoints; control points get a
 * small wobble. Used for the curved feedback-loop arrow.
 */
export function curveD(
  x1: number,
  y1: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  x2: number,
  y2: number,
  rng: () => number,
  o: StrokeOptions = {},
): string {
  const off = (o.maxOffset ?? 2) * (o.roughness ?? 1.05) * 1.6;
  const jitter = () => (rng() * 2 - 1) * off;
  const pass = () =>
    `M${fmt(x1)} ${fmt(y1)} C${fmt(c1x + jitter())} ${fmt(c1y + jitter())}, ${fmt(c2x + jitter())} ${fmt(
      c2y + jitter(),
    )}, ${fmt(x2)} ${fmt(y2)}`;
  return `${pass()} ${pass()}`;
}

/**
 * Diagonal hachure fill (-45 degrees) for a rectangle, as sparse single-pass
 * sketch lines. Quiet emphasis for one node, in the spirit of rough.js hachure.
 */
export function hachureD(
  x: number,
  y: number,
  w: number,
  h: number,
  rng: () => number,
  gap = 7,
  inset = 4,
): string {
  const x0 = x + inset;
  const y0 = y + inset;
  const x1 = x + w - inset;
  const y1 = y + h - inset;
  const parts: string[] = [];
  // Lines of slope +1 (down-right): sweep the diagonal offset c in x - y = c.
  for (let c = x0 - y1 + gap; c < x1 - y0; c += gap) {
    const ax = Math.max(x0, y0 + c);
    const ay = ax - c;
    const bx = Math.min(x1, y1 + c);
    const by = bx - c;
    if (bx > ax) parts.push(linePass(ax, ay, bx, by, rng, { maxOffset: 1.4 }, false));
  }
  return parts.join(' ');
}
