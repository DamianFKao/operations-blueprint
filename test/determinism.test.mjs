// Determinism: the engine is pure, so calling it twice on the same input must
// produce byte-identical output. This is what makes the generator trustworthy
// as a build target (and what lets exports be diffed and cached).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_INPUT,
  generateBlueprint,
  renderBlueprintMarkdown,
  renderBlueprintHTML,
  buildExport,
} from '../dist/index.js';

// A second input that exercises the opposite branches from DEFAULT_INPUT.
const CONTRASTING_INPUT = {
  product: 'cabinets',
  variation: 'custom',
  cuts: true,
  state: 'paper',
  team: 'solo',
  priority: 'cost',
  install: 'install',
  inventory: 'managed',
  salesChannel: 'online',
  orderPattern: 'runs',
};

const INPUTS = [
  ['DEFAULT_INPUT', DEFAULT_INPUT],
  ['contrasting input', CONTRASTING_INPUT],
];

for (const [name, input] of INPUTS) {
  test(`generateBlueprint is deterministic (${name})`, () => {
    const a = generateBlueprint(input);
    const b = generateBlueprint(input);
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  });

  test(`renderBlueprintMarkdown is deterministic (${name})`, () => {
    const bp = generateBlueprint(input);
    assert.equal(renderBlueprintMarkdown(bp), renderBlueprintMarkdown(generateBlueprint(input)));
  });

  test(`renderBlueprintHTML is deterministic (${name})`, () => {
    const bp = generateBlueprint(input);
    assert.equal(renderBlueprintHTML(bp), renderBlueprintHTML(generateBlueprint(input)));
  });

  test(`buildExport is deterministic (${name})`, () => {
    const a = buildExport(input);
    const b = buildExport(input);
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  });

  test(`buildExport paths are sorted and unique, contents non-empty (${name})`, () => {
    const files = buildExport(input);
    assert.ok(files.length > 0, 'export produced no files');

    const paths = files.map((f) => f.path);
    const sorted = [...paths].sort((x, y) => x.localeCompare(y));
    assert.deepEqual(paths, sorted, 'export paths are not sorted');
    assert.equal(new Set(paths).size, paths.length, 'export paths are not unique');

    for (const f of files) {
      assert.equal(typeof f.content, 'string', `${f.path}: content is not a string`);
      // Python package markers (__init__.py) are intentionally empty in the
      // exported skeleton (src/export/skeleton.ts); every other file must have content.
      if (f.path.endsWith('__init__.py')) continue;
      assert.ok(f.content.length > 0, `${f.path}: content is empty`);
    }
  });
}
