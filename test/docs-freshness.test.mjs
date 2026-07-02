// Docs freshness: docs/answers.md documents the ten questions by hand, so it can
// drift when an option is added or renamed in the engine. This pins the doc to the
// option Records: every value key (as the quoted literal the doc uses, e.g. 'metalfab')
// and every exact label string must appear in the file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  PRODUCTS,
  VARIATIONS,
  CUTS,
  STATES,
  TEAMS,
  PRIORITIES,
  INSTALLS,
  INVENTORIES,
  SALES_CHANNELS,
  ORDER_PATTERNS,
} from '../dist/index.js';

const RECORDS = {
  PRODUCTS,
  VARIATIONS,
  CUTS,
  STATES,
  TEAMS,
  PRIORITIES,
  INSTALLS,
  INVENTORIES,
  SALES_CHANNELS,
  ORDER_PATTERNS,
};

const root = resolve(import.meta.dirname, '..');
const doc = readFileSync(join(root, 'docs', 'answers.md'), 'utf8');

test('docs/answers.md covers all ten option Records', () => {
  assert.equal(Object.keys(RECORDS).length, 10);
  for (const record of Object.values(RECORDS)) {
    assert.ok(Object.keys(record).length > 0, 'option Record is empty');
  }
});

for (const [recordName, record] of Object.entries(RECORDS)) {
  test(`docs/answers.md documents every ${recordName} option`, () => {
    for (const [key, option] of Object.entries(record)) {
      assert.ok(
        doc.includes(`'${key}'`),
        `docs/answers.md is missing the ${recordName} value key '${key}'`
      );
      assert.ok(
        doc.includes(option.label),
        `docs/answers.md is missing the ${recordName} label for '${key}': "${option.label}"`
      );
    }
  });
}
