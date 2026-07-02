// Schema tailoring: each answer adds or removes specific tables. These
// assertions pin the per-input table presence/absence so a refactor cannot
// silently drop a table (or leak one into an operation that did not ask for it).
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSchema, DEFAULT_INPUT, PRODUCTS } from '../dist/index.js';

/** Table names for DEFAULT_INPUT with the given overrides applied. */
function tableNames(overrides = {}) {
  const input = { ...DEFAULT_INPUT, ...overrides };
  return new Set(buildSchema(input, PRODUCTS[input.product].noun).map((t) => t.name));
}

function assertHas(names, table, label) {
  assert.ok(names.has(table), `${label}: expected table "${table}" to be present`);
}
function assertLacks(names, table, label) {
  assert.ok(!names.has(table), `${label}: expected table "${table}" to be absent`);
}

test('install: none omits deliveries and installs', () => {
  const names = tableNames({ install: 'none' });
  assertLacks(names, 'deliveries', 'install=none');
  assertLacks(names, 'installs', 'install=none');
});

test('install: delivery adds deliveries but not installs', () => {
  const names = tableNames({ install: 'delivery' });
  assertHas(names, 'deliveries', 'install=delivery');
  assertLacks(names, 'installs', 'install=delivery');
});

test('install: install adds deliveries and installs', () => {
  const names = tableNames({ install: 'install' });
  assertHas(names, 'deliveries', 'install=install');
  assertHas(names, 'installs', 'install=install');
});

test('inventory: perjob omits inventory and reorder_rules', () => {
  const names = tableNames({ inventory: 'perjob' });
  assertLacks(names, 'inventory', 'inventory=perjob');
  assertLacks(names, 'reorder_rules', 'inventory=perjob');
});

test('inventory: stock adds inventory but not reorder_rules', () => {
  const names = tableNames({ inventory: 'stock' });
  assertHas(names, 'inventory', 'inventory=stock');
  assertLacks(names, 'reorder_rules', 'inventory=stock');
});

test('inventory: managed adds inventory and reorder_rules', () => {
  const names = tableNames({ inventory: 'managed' });
  assertHas(names, 'inventory', 'inventory=managed');
  assertHas(names, 'reorder_rules', 'inventory=managed');
});

test('salesChannel: dealers adds accounts and price_tiers', () => {
  const names = tableNames({ salesChannel: 'dealers' });
  assertHas(names, 'accounts', 'salesChannel=dealers');
  assertHas(names, 'price_tiers', 'salesChannel=dealers');
  assertLacks(names, 'catalog_items', 'salesChannel=dealers');
});

test('salesChannel: online adds catalog_items', () => {
  const names = tableNames({ salesChannel: 'online' });
  assertHas(names, 'catalog_items', 'salesChannel=online');
  assertLacks(names, 'accounts', 'salesChannel=online');
  assertLacks(names, 'price_tiers', 'salesChannel=online');
});

test('salesChannel: direct adds none of the channel tables', () => {
  const names = tableNames({ salesChannel: 'direct' });
  assertLacks(names, 'accounts', 'salesChannel=direct');
  assertLacks(names, 'price_tiers', 'salesChannel=direct');
  assertLacks(names, 'catalog_items', 'salesChannel=direct');
});

test('orderPattern: runs adds work_orders; other patterns do not', () => {
  assertHas(tableNames({ orderPattern: 'runs' }), 'work_orders', 'orderPattern=runs');
  assertLacks(tableNames({ orderPattern: 'oneoffs' }), 'work_orders', 'orderPattern=oneoffs');
  assertLacks(tableNames({ orderPattern: 'repeat' }), 'work_orders', 'orderPattern=repeat');
});

test('cuts: true adds stock_items and cut_parts; false omits both', () => {
  const withCuts = tableNames({ cuts: true });
  assertHas(withCuts, 'stock_items', 'cuts=true');
  assertHas(withCuts, 'cut_parts', 'cuts=true');
  const without = tableNames({ cuts: false });
  assertLacks(without, 'stock_items', 'cuts=false');
  assertLacks(without, 'cut_parts', 'cuts=false');
});

test('variation: catalog uses products only', () => {
  const names = tableNames({ variation: 'catalog' });
  assertHas(names, 'products', 'variation=catalog');
  assertLacks(names, 'product_templates', 'variation=catalog');
  assertLacks(names, 'product_variants', 'variation=catalog');
  assertLacks(names, 'project_specs', 'variation=catalog');
});

test('variation: configurable uses product_templates and product_variants', () => {
  const names = tableNames({ variation: 'configurable' });
  assertHas(names, 'product_templates', 'variation=configurable');
  assertHas(names, 'product_variants', 'variation=configurable');
  assertLacks(names, 'products', 'variation=configurable');
  assertLacks(names, 'project_specs', 'variation=configurable');
});

test('variation: custom uses project_specs', () => {
  const names = tableNames({ variation: 'custom' });
  assertHas(names, 'project_specs', 'variation=custom');
  assertLacks(names, 'products', 'variation=custom');
  assertLacks(names, 'product_templates', 'variation=custom');
  assertLacks(names, 'product_variants', 'variation=custom');
});
