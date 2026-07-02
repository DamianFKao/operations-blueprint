/**
 * Generate Northline's blueprint + exported starter repo, straight from this repo's engine.
 *
 * Bundles src/export/index.ts with esbuild (the same code that runs in the browser at
 * damiankao.com/blueprint), runs buildExport() with Northline's ten answers, and writes:
 *   answers.json                 the recorded inputs
 *   blueprint.md                 the human-readable plan
 *   operations-system/           the tailored starter repo
 *
 * Run:  node regenerate.mjs
 */
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { pathToFileURL } from 'url';

const OUT = import.meta.dirname;
const repoRoot = resolve(OUT, '../../..');
const entry = join(repoRoot, 'src/export/index.ts');
const bundle = join(repoRoot, 'node_modules/.cache/northline-export.mjs');

// Northline Metalworks: the ten answers (see ../01-profile/PROFILE.md).
const answers = {
  product: 'metalfab',
  variation: 'configurable',
  cuts: true,
  state: 'spreadsheets',
  team: 'small',
  priority: 'quoting',
  install: 'delivery',
  inventory: 'stock',
  salesChannel: 'direct',
  orderPattern: 'repeat',
};

await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'warning' });
const { buildExport } = await import(pathToFileURL(bundle).href);

writeFileSync(join(OUT, 'answers.json'), JSON.stringify(answers, null, 2) + '\n');

rmSync(join(OUT, 'operations-system'), { recursive: true, force: true });
const files = buildExport(answers);
for (const f of files) {
  const p = join(OUT, 'operations-system', f.path);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, f.content);
}
writeFileSync(join(OUT, 'blueprint.md'), files.find((f) => f.path === 'docs/blueprint.md').content);

console.log(`Wrote answers.json, blueprint.md, and ${files.length} files under operations-system/`);
for (const f of files) console.log('  operations-system/' + f.path);
