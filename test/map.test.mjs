// Blueprint Map: buildMapModel, renderBlueprintMap, and renderBlueprintMermaid.
// The map derives from the same answers as the schema and the written plan, so
// these suites pin that contract: byte-identical output for the same input
// (per-shape seeding means the drawing only changes when a schema-affecting
// answer changes), clean geometry across every schema-affecting combination,
// node integrity against buildSchema and generateBlueprint, attribute escaping,
// and the fenced Mermaid variant.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMapModel,
  renderBlueprintMap,
  renderBlueprintMermaid,
  buildSchema,
  generateBlueprint,
  DEFAULT_INPUT,
  PRODUCTS,
  STATES,
  TEAMS,
  PRIORITIES,
} from '../dist/index.js';

const VIEW_W = 920;
const VIEW_H = 430;

// The six answers that change the schema (and therefore may change the map).
// The other four (product, state, team, priority) stay at DEFAULT_INPUT values.
const SCHEMA_AXES = {
  variation: ['catalog', 'configurable', 'custom'],
  cuts: [true, false],
  inventory: ['perjob', 'stock', 'managed'],
  salesChannel: ['direct', 'dealers', 'online'],
  install: ['none', 'delivery', 'install'],
  orderPattern: ['oneoffs', 'repeat', 'runs'],
};

/** Every schema-affecting combination on top of DEFAULT_INPUT: 3*2*3*3*3*3 = 486. */
function schemaCombos() {
  const combos = [];
  for (const variation of SCHEMA_AXES.variation)
    for (const cuts of SCHEMA_AXES.cuts)
      for (const inventory of SCHEMA_AXES.inventory)
        for (const salesChannel of SCHEMA_AXES.salesChannel)
          for (const install of SCHEMA_AXES.install)
            for (const orderPattern of SCHEMA_AXES.orderPattern)
              combos.push({
                name: `variation=${variation} cuts=${cuts} inventory=${inventory} salesChannel=${salesChannel} install=${install} orderPattern=${orderPattern}`,
                input: { ...DEFAULT_INPUT, variation, cuts, inventory, salesChannel, install, orderPattern },
              });
  return combos;
}

const COMBOS = schemaCombos();

// A second input that flips every schema-affecting answer away from DEFAULT_INPUT.
const CONTRASTING_INPUT = {
  ...DEFAULT_INPUT,
  variation: 'custom',
  cuts: false,
  inventory: 'perjob',
  salesChannel: 'dealers',
  install: 'none',
  orderPattern: 'runs',
};

test('the schema-affecting sweep covers all 486 combinations', () => {
  assert.equal(COMBOS.length, 486);
});

// ── Determinism ──

test('renderBlueprintMap is byte-identical across calls (both palettes)', () => {
  for (const input of [DEFAULT_INPUT, CONTRASTING_INPUT]) {
    for (const palette of ['site', 'self-contained']) {
      assert.equal(
        renderBlueprintMap(input, { palette }),
        renderBlueprintMap(input, { palette }),
        `palette "${palette}" was not deterministic`
      );
    }
  }
});

test('renderBlueprintMermaid is byte-identical across calls', () => {
  for (const input of [DEFAULT_INPUT, CONTRASTING_INPUT]) {
    assert.equal(renderBlueprintMermaid(input), renderBlueprintMermaid(input));
  }
});

test('two different schema-affecting inputs produce different SVGs', () => {
  assert.notEqual(renderBlueprintMap(DEFAULT_INPUT), renderBlueprintMap(CONTRASTING_INPUT));
});

// ── Stability: only schema-affecting answers may change the drawing ──

test('toggling product, state, team, or priority leaves the SVG byte-identical', () => {
  const base = renderBlueprintMap(DEFAULT_INPUT);
  const axes = [
    ['product', Object.keys(PRODUCTS)],
    ['state', Object.keys(STATES)],
    ['team', Object.keys(TEAMS)],
    ['priority', Object.keys(PRIORITIES)],
  ];
  for (const [field, values] of axes) {
    for (const value of values) {
      if (value === DEFAULT_INPUT[field]) continue;
      assert.equal(
        renderBlueprintMap({ ...DEFAULT_INPUT, [field]: value }),
        base,
        `${field}=${value} changed the map, but it does not affect the schema`
      );
    }
  }
});

test('toggling install between none and delivery changes the SVG', () => {
  assert.notEqual(
    renderBlueprintMap({ ...DEFAULT_INPUT, install: 'none' }),
    renderBlueprintMap({ ...DEFAULT_INPUT, install: 'delivery' })
  );
});

// ── No broken geometry: the full sweep never leaks a bad number ──

test('no NaN, undefined, or Infinity in any rendered SVG (full sweep, both palettes)', () => {
  for (const { name, input } of COMBOS) {
    for (const palette of ['site', 'self-contained']) {
      const svg = renderBlueprintMap(input, { palette });
      for (const bad of ['NaN', 'undefined', 'Infinity']) {
        assert.ok(!svg.includes(bad), `${name} (${palette}): SVG contains "${bad}"`);
      }
    }
  }
});

// ── Model geometry invariant: rects never collide and never leave the canvas ──

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

test('node rects are pairwise non-overlapping and inside the viewBox (full sweep)', () => {
  for (const { name, input } of COMBOS) {
    const { nodes } = buildMapModel(input);
    for (const n of nodes) {
      assert.ok(n.w > 0 && n.h > 0, `${name}: node "${n.id}" has a degenerate rect`);
      assert.ok(
        n.x >= 0 && n.y >= 0 && n.x + n.w <= VIEW_W && n.y + n.h <= VIEW_H,
        `${name}: node "${n.id}" leaves the ${VIEW_W}x${VIEW_H} viewBox`
      );
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        assert.ok(
          !rectsOverlap(nodes[i], nodes[j]),
          `${name}: nodes "${nodes[i].id}" and "${nodes[j].id}" overlap`
        );
      }
    }
  }
});

// ── Node integrity: real tables, real sections, modules exactly per the answers ──

const SPINE_IDS = ['materials', 'recipes', 'product', 'quotes', 'jobs', 'clients'];

test('every node points at real tables and a real plan section; modules match their conditions (full sweep)', () => {
  for (const { name, input } of COMBOS) {
    const m = buildMapModel(input);
    const tableNames = new Set(buildSchema(input, 'product').map((t) => t.name));
    const sectionIds = new Set(generateBlueprint(input).sections.map((s) => s.id));
    const ids = new Set(m.nodes.map((n) => n.id));
    assert.equal(ids.size, m.nodes.length, `${name}: duplicate node ids`);

    for (const n of m.nodes) {
      assert.ok(n.tables.length > 0, `${name}: node "${n.id}" lists no tables`);
      for (const t of n.tables) {
        assert.ok(tableNames.has(t), `${name}: node "${n.id}" claims table "${t}", which buildSchema does not return`);
      }
      assert.ok(sectionIds.has(n.sectionId), `${name}: node "${n.id}" links section "${n.sectionId}", not in the blueprint`);
    }

    for (const id of SPINE_IDS) assert.ok(ids.has(id), `${name}: spine node "${id}" missing`);
    assert.ok(ids.has('actuals'), `${name}: loop node "actuals" missing`);

    const conditionals = [
      ['cutting', input.cuts],
      ['inventory', input.inventory !== 'perjob'],
      ['catalog', input.salesChannel === 'online'],
      ['dealers', input.salesChannel === 'dealers'],
      ['delivery', input.install !== 'none'],
      ['runs', input.orderPattern === 'runs'],
    ];
    let expectedModules = 0;
    for (const [id, present] of conditionals) {
      assert.equal(ids.has(id), present, `${name}: module "${id}" should be ${present ? 'present' : 'absent'}`);
      if (present) expectedModules += 1;
    }
    assert.equal(m.nodes.length, SPINE_IDS.length + 1 + expectedModules, `${name}: unexpected extra nodes`);

    assert.equal(m.edges.filter((e) => e.kind === 'loop').length, 1, `${name}: expected exactly one loop edge`);
    assert.ok(renderBlueprintMap(input).includes('bp-map-accent'), `${name}: SVG lost the bp-map-accent loop class`);
  }
});

// ── Escaping and markup ──

test('data-note and aria-label values carry no raw "<" (full sweep)', () => {
  const attr = /(?:data-note|aria-label)="([^"]*)"/g;
  for (const { name, input } of COMBOS) {
    const svg = renderBlueprintMap(input);
    let seen = 0;
    for (const match of svg.matchAll(attr)) {
      seen += 1;
      assert.ok(!match[1].includes('<'), `${name}: raw "<" inside an attribute value: ${match[1]}`);
    }
    assert.ok(seen > 0, `${name}: no data-note/aria-label attributes found; the check ran vacuously`);
  }
});

test('the SVG is a complete document; only the self-contained palette embeds a <style>', () => {
  for (const input of [DEFAULT_INPUT, CONTRASTING_INPUT]) {
    const site = renderBlueprintMap(input, { palette: 'site' });
    const selfContained = renderBlueprintMap(input, { palette: 'self-contained' });
    for (const svg of [site, selfContained]) {
      assert.ok(svg.startsWith('<svg'), 'SVG does not start with <svg');
      assert.ok(svg.endsWith('</svg>'), 'SVG does not end with </svg>');
    }
    assert.ok(selfContained.includes('<style>'), 'self-contained palette is missing its embedded <style>');
    assert.ok(!site.includes('<style>'), 'site palette should not embed a <style>');
  }
});

test('animate: true adds the self-drawing hooks; animate: false has neither', () => {
  const on = renderBlueprintMap(DEFAULT_INPUT, { animate: true });
  const off = renderBlueprintMap(DEFAULT_INPUT, { animate: false });
  assert.ok(on.includes('bp-map--draw'), 'animate: true is missing the bp-map--draw root class');
  assert.ok(on.includes('pathLength'), 'animate: true is missing pathLength on its strokes');
  assert.ok(!off.includes('bp-map--draw'), 'animate: false leaked the bp-map--draw root class');
  assert.ok(!off.includes('pathLength'), 'animate: false leaked pathLength attributes');
});

// ── Mermaid variant ──

test('mermaid: fenced flowchart with a line per node, the loop edge, and no "&" in labels (full sweep)', () => {
  for (const { name, input } of COMBOS) {
    const md = renderBlueprintMermaid(input);
    assert.ok(md.startsWith('```mermaid'), `${name}: block does not start with the mermaid fence`);
    assert.ok(md.endsWith('```'), `${name}: block does not end with a closing fence`);
    assert.ok(md.includes('flowchart LR'), `${name}: block is not a flowchart`);
    for (const n of buildMapModel(input).nodes) {
      assert.ok(md.includes(`  ${n.id}["`), `${name}: no node line for "${n.id}"`);
    }
    assert.ok(md.includes('-. estimate vs actual .->'), `${name}: the feedback-loop edge is missing`);
    for (const match of md.matchAll(/\["([^"]*)"\]/g)) {
      assert.ok(!match[1].includes('&'), `${name}: "&" inside a node label: ${match[1]}`);
    }
  }
});
