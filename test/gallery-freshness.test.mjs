// Gallery freshness: the pre-generated blueprints in blueprints/ are committed so
// people can read real output without running anything, which means they can go
// stale when the engine changes. This regenerates each shop's plan and schema in
// memory from its committed answers.json and asserts the committed files match
// byte for byte. If it fails, run `node scripts/build-blueprints.mjs` and commit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { generateBlueprint, renderBlueprintMarkdown, buildExport } from '../dist/index.js';

const root = resolve(import.meta.dirname, '..');
const blueprintsDir = join(root, 'blueprints');

const slugs = readdirSync(blueprintsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

test('the gallery holds the four expected shops', () => {
  assert.deepEqual(slugs, [
    'catalog-furniture-maker',
    'configurable-sign-shop',
    'custom-cabinet-shop',
    'general-job-shop',
  ]);
});

for (const slug of slugs) {
  const dir = join(blueprintsDir, slug);

  test(`${slug}: plan.md and schema.sql match the engine byte for byte`, () => {
    for (const name of ['answers.json', 'plan.md', 'schema.sql']) {
      assert.ok(existsSync(join(dir, name)), `${slug}/${name} is missing`);
    }

    const answers = JSON.parse(readFileSync(join(dir, 'answers.json'), 'utf8'));

    const expectedPlan = renderBlueprintMarkdown(generateBlueprint(answers));
    const committedPlan = readFileSync(join(dir, 'plan.md'));
    assert.ok(
      committedPlan.equals(Buffer.from(expectedPlan)),
      `${slug}/plan.md is stale: regenerate with \`node scripts/build-blueprints.mjs\``
    );

    const schemaFile = buildExport(answers).find((f) => f.path === 'db/schema.sql');
    assert.ok(schemaFile, `the export for ${slug} has no db/schema.sql entry`);
    const committedSchema = readFileSync(join(dir, 'schema.sql'));
    assert.ok(
      committedSchema.equals(Buffer.from(schemaFile.content)),
      `${slug}/schema.sql is stale: regenerate with \`node scripts/build-blueprints.mjs\``
    );
  });
}
