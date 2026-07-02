/**
 * Regenerate the pre-built example blueprints in blueprints/.
 *
 * For each invented shop below, this writes:
 *   blueprints/<slug>/answers.json   the ten answers that define the shop
 *   blueprints/<slug>/plan.md        the generated operations plan
 *   blueprints/<slug>/schema.sql     the database schema from the starter repo export
 *
 * Output is deterministic: rerunning produces byte-identical files.
 * Run:  node scripts/build-blueprints.mjs   (after: npm install)
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist', 'index.js');
if (!existsSync(dist)) {
  console.error('dist/index.js not found: run npm install first.');
  process.exit(1);
}
const { generateBlueprint, renderBlueprintMarkdown, buildExport } = await import(
  pathToFileURL(dist).href
);

const SHOPS = [
  {
    slug: 'custom-cabinet-shop',
    title: 'A custom cabinet shop',
    answers: {
      product: 'cabinets',
      variation: 'custom',
      cuts: true,
      state: 'paper',
      team: 'solo',
      priority: 'quoting',
      install: 'install',
      inventory: 'perjob',
      salesChannel: 'direct',
      orderPattern: 'oneoffs',
    },
  },
  {
    slug: 'catalog-furniture-maker',
    title: 'A catalog furniture maker selling through dealers',
    answers: {
      product: 'furniture',
      variation: 'catalog',
      cuts: false,
      state: 'software',
      team: 'larger',
      priority: 'cost',
      install: 'delivery',
      inventory: 'stock',
      salesChannel: 'dealers',
      orderPattern: 'repeat',
    },
  },
  {
    slug: 'configurable-sign-shop',
    title: 'A configurable sign shop selling online',
    answers: {
      product: 'signage',
      variation: 'configurable',
      cuts: false,
      state: 'spreadsheets',
      team: 'small',
      priority: 'production',
      install: 'none',
      inventory: 'managed',
      salesChannel: 'online',
      orderPattern: 'runs',
    },
  },
  {
    slug: 'general-job-shop',
    title: 'A general job shop (the minimal spine)',
    answers: {
      product: 'general',
      variation: 'catalog',
      cuts: false,
      state: 'spreadsheets',
      team: 'small',
      priority: 'catalog',
      install: 'none',
      inventory: 'perjob',
      salesChannel: 'direct',
      orderPattern: 'oneoffs',
    },
  },
];

const blueprintsDir = join(root, 'blueprints');
for (const shop of SHOPS) {
  const dir = join(blueprintsDir, shop.slug);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const plan = renderBlueprintMarkdown(generateBlueprint(shop.answers));
  const schema = buildExport(shop.answers).find((f) => f.path === 'db/schema.sql');
  if (!schema) {
    console.error(`no db/schema.sql in the export for ${shop.slug}`);
    process.exit(1);
  }

  writeFileSync(join(dir, 'answers.json'), JSON.stringify(shop.answers, null, 2) + '\n');
  writeFileSync(join(dir, 'plan.md'), plan);
  writeFileSync(join(dir, 'schema.sql'), schema.content);
  console.log(`${shop.slug}: ${shop.title}`);
}
