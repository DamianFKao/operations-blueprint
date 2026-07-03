// Export completeness: for a representative set of inputs, the exported starter
// repo must contain AGENTS.md and TASKS.md with a real build order, a db/schema.sql
// that creates every table the schema builder returns, a non-empty docs/blueprint.md
// that embeds the mermaid Blueprint Map, and a non-empty docs/map.svg.
// The build-order checks guard a real silent-failure mode:
// src/export/agents.ts returns an empty step list if the blueprint's 'build'
// section (or its first steps block) disappears, which would export files that
// look fine but tell the agent to build nothing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildExport, buildSchema, generateBlueprint, DEFAULT_INPUT, PRODUCTS } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const northlineAnswers = JSON.parse(
  readFileSync(join(here, '..', 'examples', 'northline-metalworks', '03-blueprint', 'answers.json'), 'utf8')
);

const GALLERY = [
  {
    slug: 'custom-cabinet-shop',
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

const CASES = [
  ['DEFAULT_INPUT', DEFAULT_INPUT],
  ['northline-metalworks example', northlineAnswers],
  ...GALLERY.map((g) => [g.slug, g.answers]),
];

/** The build-order steps as the blueprint itself defines them. */
function buildSteps(input) {
  const bp = generateBlueprint(input);
  const section = bp.sections.find((s) => s.id === 'build');
  const block = section?.blocks.find((b) => b.kind === 'steps');
  return block && block.kind === 'steps' ? block.items : [];
}

for (const [name, input] of CASES) {
  test(`export is complete for ${name}`, () => {
    const files = buildExport(input);
    const byPath = new Map(files.map((f) => [f.path, f.content]));

    const steps = buildSteps(input);
    assert.ok(steps.length > 0, "the blueprint's 'build' section has no steps block (silent-failure mode)");

    // AGENTS.md: a non-empty numbered build order that matches the blueprint's steps.
    const agents = byPath.get('AGENTS.md');
    assert.ok(agents, 'AGENTS.md missing from export');
    assert.match(agents, /## Build order\n\n1\. /, 'AGENTS.md build order is empty or unnumbered');
    for (const [idx, step] of steps.entries()) {
      assert.ok(agents.includes(`${idx + 1}. ${step}`), `AGENTS.md missing build step ${idx + 1}`);
    }

    // TASKS.md: the same build order as a non-empty checklist.
    const tasks = byPath.get('TASKS.md');
    assert.ok(tasks, 'TASKS.md missing from export');
    assert.match(tasks, /## Build\n\n- \[ \] /, 'TASKS.md build checklist is empty');
    for (const [idx, step] of steps.entries()) {
      assert.ok(tasks.includes(`- [ ] ${step}`), `TASKS.md missing build step ${idx + 1}`);
    }

    // db/schema.sql: a CREATE TABLE for every table the schema builder returns.
    const sql = byPath.get('db/schema.sql');
    assert.ok(sql, 'db/schema.sql missing from export');
    const tables = buildSchema(input, PRODUCTS[input.product].noun);
    assert.ok(tables.length > 0, 'buildSchema returned no tables');
    for (const t of tables) {
      assert.ok(sql.includes(`CREATE TABLE ${t.name} (`), `db/schema.sql missing CREATE TABLE ${t.name}`);
    }

    // docs/blueprint.md: exists, non-empty, and embeds the mermaid Blueprint Map.
    const doc = byPath.get('docs/blueprint.md');
    assert.ok(doc, 'docs/blueprint.md missing from export');
    assert.ok(doc.trim().length > 0, 'docs/blueprint.md is empty');
    assert.ok(doc.includes('```mermaid'), 'docs/blueprint.md is missing the mermaid Blueprint Map');

    // docs/map.svg: the self-contained Blueprint Map, present and non-empty.
    const map = byPath.get('docs/map.svg');
    assert.ok(map, 'docs/map.svg missing from export');
    assert.ok(map.trim().length > 0, 'docs/map.svg is empty');
  });
}
