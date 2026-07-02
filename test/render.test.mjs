// Rendering: HTML output escapes user-visible prose, markdown escapes table
// cells that would break the table, internal links (external: false) do not get
// target="_blank" while default links do, and every link the engine emits is an
// absolute https URL (the export is read outside any site context).
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBlueprintHTML, renderBlueprintMarkdown, generateBlueprint, DEFAULT_INPUT } from '../dist/index.js';

// A hand-crafted Blueprint that exercises the escaping and link paths directly.
const CRAFTED = {
  intro: 'Intro with & and <angle> brackets',
  sections: [
    {
      id: 'crafted',
      title: 'Title & <tag>',
      blocks: [
        { kind: 'prose', text: 'a & b < c > d' },
        { kind: 'table', headers: ['H1', 'H2'], rows: [['cell with | pipe', 'plain cell']] },
        {
          kind: 'links',
          items: [
            { label: 'internal link', href: 'https://example.com/internal', external: false },
            { label: 'default link', href: 'https://example.com/default' },
          ],
        },
      ],
    },
  ],
};

test('HTML render escapes &, <, and > in prose and titles', () => {
  const html = renderBlueprintHTML(CRAFTED);
  assert.ok(html.includes('a &amp; b &lt; c &gt; d'), 'prose was not escaped');
  assert.ok(html.includes('Intro with &amp; and &lt;angle&gt; brackets'), 'intro was not escaped');
  assert.ok(html.includes('Title &amp; &lt;tag&gt;'), 'section title was not escaped');
  assert.ok(!html.includes('<tag>'), 'raw <tag> leaked into the HTML');
  assert.ok(!html.includes('a & b < c > d'), 'raw unescaped prose leaked into the HTML');
});

test('markdown render escapes pipe characters in table cells', () => {
  const md = renderBlueprintMarkdown(CRAFTED);
  assert.ok(md.includes('cell with \\| pipe'), 'pipe in a table cell was not escaped');
  assert.ok(!md.includes('| cell with | pipe |'), 'unescaped pipe would split the table cell');
});

test('links with external: false lack target="_blank"; default links have it', () => {
  const html = renderBlueprintHTML(CRAFTED);
  assert.ok(
    html.includes('<a href="https://example.com/internal">internal link</a>'),
    'internal link should have no target/rel attributes'
  );
  assert.ok(
    html.includes('<a href="https://example.com/default" target="_blank" rel="noopener">default link</a>'),
    'default link should open in a new tab with rel="noopener"'
  );
});

// The same gallery inputs the export tests use.
const GALLERY_INPUTS = [
  {
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
  {
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
  {
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
  {
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
];

test('every link href the engine emits is an absolute https URL', () => {
  let linksSeen = 0;
  for (const input of [DEFAULT_INPUT, ...GALLERY_INPUTS]) {
    const bp = generateBlueprint(input);
    for (const section of bp.sections) {
      for (const block of section.blocks) {
        if (block.kind !== 'links') continue;
        for (const item of block.items) {
          linksSeen += 1;
          assert.ok(
            item.href.startsWith('https://'),
            `non-absolute href "${item.href}" (label "${item.label}", section "${section.id}")`
          );
        }
      }
    }
  }
  assert.ok(linksSeen > 0, 'no links blocks were found; the check ran vacuously');
});
