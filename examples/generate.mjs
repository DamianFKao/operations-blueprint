/**
 * Example: generate a starter repo from a set of answers, using the local source.
 *
 * Bundles src/index.ts with esbuild and runs it, so you can try the engine without a build step.
 * Run:  node examples/generate.mjs   (after: npm install)
 */
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { pathToFileURL } from 'url';

const here = import.meta.dirname;
const root = resolve(here, '..');
const bundle = join(root, 'node_modules/.cache/ob-example.mjs');

await build({
  entryPoints: [join(root, 'src/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundle,
  logLevel: 'warning',
});
const { generateBlueprint, buildExport, renderBlueprintMarkdown } = await import(pathToFileURL(bundle).href);

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

const out = join(here, 'output');
rmSync(out, { recursive: true, force: true });
const files = buildExport(answers);
for (const f of files) {
  const p = join(out, f.path);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, f.content);
}

console.log(`Wrote a ${files.length}-file starter repo to examples/output/ for these answers:`);
console.log(answers);
console.log('\nThe plan (first 700 chars of the markdown):\n');
console.log(renderBlueprintMarkdown(generateBlueprint(answers)).slice(0, 700) + '\n...');
