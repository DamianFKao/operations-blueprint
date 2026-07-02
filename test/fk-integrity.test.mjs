// Foreign-key integrity: sweep the entire input space (all 104,976 combinations
// of the ten answers) and assert that every column's "references" target names a
// table that actually exists in that combination's schema. This is the guard
// against a conditional table being referenced by a table that is always present
// (or vice versa) under some combination nobody tried by hand.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSchema,
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

const products = Object.keys(PRODUCTS);
const variations = Object.keys(VARIATIONS);
const cutsValues = Object.keys(CUTS).map((k) => k === 'yes');
const states = Object.keys(STATES);
const teams = Object.keys(TEAMS);
const priorities = Object.keys(PRIORITIES);
const installs = Object.keys(INSTALLS);
const inventories = Object.keys(INVENTORIES);
const salesChannels = Object.keys(SALES_CHANNELS);
const orderPatterns = Object.keys(ORDER_PATTERNS);

const EXPECTED_COMBOS =
  products.length *
  variations.length *
  cutsValues.length *
  states.length *
  teams.length *
  priorities.length *
  installs.length *
  inventories.length *
  salesChannels.length *
  orderPatterns.length;

test('every foreign key targets a table present in the same schema, across the full input space', () => {
  assert.equal(EXPECTED_COMBOS, 104976, 'the option space changed size; update this sweep');

  let combos = 0;
  let referencesChecked = 0;
  const failures = [];

  for (const product of products)
    for (const variation of variations)
      for (const cuts of cutsValues)
        for (const state of states)
          for (const team of teams)
            for (const priority of priorities)
              for (const install of installs)
                for (const inventory of inventories)
                  for (const salesChannel of salesChannels)
                    for (const orderPattern of orderPatterns) {
                      combos += 1;
                      const input = {
                        product,
                        variation,
                        cuts,
                        state,
                        team,
                        priority,
                        install,
                        inventory,
                        salesChannel,
                        orderPattern,
                      };
                      const schema = buildSchema(input, PRODUCTS[product].noun);
                      const names = new Set(schema.map((t) => t.name));
                      for (const t of schema) {
                        for (const c of t.columns) {
                          if (c.references === undefined) continue;
                          referencesChecked += 1;
                          if (!names.has(c.references)) {
                            failures.push(
                              `${t.name}.${c.name} -> ${c.references} missing for ${JSON.stringify(input)}`
                            );
                          }
                        }
                      }
                    }

  assert.equal(combos, EXPECTED_COMBOS, 'sweep did not cover the full input space');
  assert.ok(referencesChecked > 0, 'no foreign key references were checked');
  assert.equal(
    failures.length,
    0,
    `${failures.length} dangling foreign key reference(s); first few: ${failures.slice(0, 5).join(' | ')}`
  );
});
