// Build order: the 'build' section's steps are dependency-ordered. The
// product-and-cost engine always comes first, the backfill step appears only
// when there is existing data to import, the cut/nesting step appears only for
// shops that cut material, and the stated priority reorders the four module
// steps. Prefixes below match the step wording in src/blueprint-model.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBlueprint, DEFAULT_INPUT } from '../dist/index.js';

const ENGINE_PREFIX = 'Product-and-cost engine (build this first; everything depends on it).';
const BACKFILL_PREFIX = 'Backfill from what you already have.';
const CUT_PREFIX = 'Cut and nesting optimizer.';
const MODULE_PREFIX = {
  quote: 'Quote builder.',
  cost: 'True-cost model.',
  production: 'Production capture and variance.',
  catalog: 'Catalog and document generation.',
};

function steps(overrides = {}) {
  const bp = generateBlueprint({ ...DEFAULT_INPUT, ...overrides });
  const section = bp.sections.find((s) => s.id === 'build');
  assert.ok(section, "no section with id 'build'");
  const block = section.blocks.find((b) => b.kind === 'steps');
  assert.ok(block, "the 'build' section has no steps block");
  assert.ok(block.items.length > 0, 'the steps block is empty');
  return block.items;
}

function indexOfPrefix(items, prefix) {
  return items.findIndex((s) => s.startsWith(prefix));
}

test('the first build step is always the product-and-cost engine', () => {
  assert.ok(steps()[0].startsWith(ENGINE_PREFIX), 'DEFAULT_INPUT: engine is not first');
  assert.ok(
    steps({ state: 'paper', cuts: false, priority: 'production' })[0].startsWith(ENGINE_PREFIX),
    'minimal input: engine is not first'
  );
  assert.ok(
    steps({ variation: 'custom', priority: 'catalog', orderPattern: 'runs' })[0].startsWith(ENGINE_PREFIX),
    'custom variation: engine is not first'
  );
});

test("a backfill step appears iff state is not 'paper'", () => {
  assert.equal(indexOfPrefix(steps({ state: 'paper' }), BACKFILL_PREFIX), -1, 'paper: unexpected backfill step');
  assert.notEqual(indexOfPrefix(steps({ state: 'spreadsheets' }), BACKFILL_PREFIX), -1, 'spreadsheets: backfill step missing');
  assert.notEqual(indexOfPrefix(steps({ state: 'software' }), BACKFILL_PREFIX), -1, 'software: backfill step missing');
});

test('a cut/nesting step appears iff the shop cuts material', () => {
  assert.notEqual(indexOfPrefix(steps({ cuts: true }), CUT_PREFIX), -1, 'cuts=true: cut step missing');
  assert.equal(indexOfPrefix(steps({ cuts: false }), CUT_PREFIX), -1, 'cuts=false: unexpected cut step');
});

function assertModuleOrder(priority, expectedOrder) {
  const items = steps({ priority });
  const indices = expectedOrder.map((key) => {
    const idx = indexOfPrefix(items, MODULE_PREFIX[key]);
    assert.notEqual(idx, -1, `priority=${priority}: module step "${key}" missing`);
    return idx;
  });
  for (let n = 1; n < indices.length; n += 1) {
    assert.ok(
      indices[n - 1] < indices[n],
      `priority=${priority}: expected ${expectedOrder[n - 1]} before ${expectedOrder[n]} (got indices ${indices.join(', ')})`
    );
  }
}

test("priority 'quoting' orders the modules quote, cost, production, catalog", () => {
  assertModuleOrder('quoting', ['quote', 'cost', 'production', 'catalog']);
});

test("priority 'production' orders the modules production, cost, quote, catalog", () => {
  assertModuleOrder('production', ['production', 'cost', 'quote', 'catalog']);
});
