# src

The engine. Pure, deterministic functions that turn a `BlueprintInput` (ten answers) into a plan and a starter repo. No LLM, no network, no stored data.

## What lives here

- `blueprint-model.ts`: the input types, the ten option `Record`s (labels), the six section builders, `generateBlueprint`.
- `schema-model.ts`: `buildSchema`, the typed relational schema. The single source of truth for the data model.
- `render.ts`: `renderBlueprintHTML` and `renderBlueprintMarkdown`, the only two renderers over a `Blueprint`.
- `map.ts`: the Blueprint Map. `buildMapModel` derives nodes and edges from the answers; `renderBlueprintMap` draws the hand-drawn SVG; `renderBlueprintMermaid` emits the fenced Mermaid flowchart.
- `sketch-lite.ts`: the tiny deterministic hand-drawn stroke renderer the map draws with.
- `export/`: assembles the starter repo. Has its own `CONTEXT.md`.
- `index.ts`: the public API surface. Everything exported from the package goes through it.

## Invariants (a change must preserve all of these)

- The schema changes ONLY via `buildSchema`. The on-page schema table and the exported `db/schema.sql` both render from it; never define a table or column anywhere else.
- `Block` is a closed union. Both renderers in `render.ts` switch exhaustively over it; adding a kind means updating both HTML and markdown paths, or one output silently loses content.
- Everything is pure and deterministic: same input, same output, byte for byte. No `Date.now()`, no randomness, no I/O.
- Browser-safe: no Node APIs and no `node:*` imports anywhere in `src/`. This code is bundled into a client `<script>` on the website; a single `fs` import breaks the tool.
- The build section must keep id `'build'` and contain a `steps` block. `export/agents.ts` finds the build order by that id and kind; break either and `AGENTS.md`/`TASKS.md` render with a silently empty build order (no error is thrown).
- All link `href`s are absolute URLs. The output is rendered on pages and in exported markdown where relative links have no base.
- Every map node's `tables` must name tables that `buildSchema` actually returns for that input, and every `sectionId` must be a real section id (tests pin both). A node that names a table the schema does not ship is a lie on the map.
- `sketch-lite.ts` stays seeded-deterministic: every shape is seeded from a caller-supplied string key, no `Math.random`, no `Date`. Same key, same wobble, byte for byte.
- The map keeps both palettes. `'self-contained'` embeds its `<style>` (light palette plus a dark-mode override); `'site'` must NOT embed a `<style>`, because the page supplies the colors.
- The engine carries no font bytes. `renderBlueprintMap` only declares a cursive font stack; embedding the actual woff2 happens exclusively in `scripts/lib/embed-font.mjs`, and only for the committed gallery files.
- The `id="bp-<section id>"` attributes `render.ts` puts on sections are load-bearing: the site's map uses them for click-to-scroll, and the map's node links point at them. Renaming the prefix or a section id breaks that silently.
- Generated prose carries no real company, client, vendor, SKU, or cost data. Generic methodology only.

## Landmines

- The option `Record` keys (`'metalfab'`, `'perjob'`, ...) are the public contract: the website form, `docs/answers.md`, saved `blueprint.json` manifests, and tests all depend on them. Renaming a key is a breaking change.
- `PRODUCTS[product].noun` flows into schema notes and plan prose; check both when touching it.
- Table names in prose (the "spine" sentence, build steps, integrator analyses) are written by hand and must match `buildSchema`. Rename a table there and grep the prose.
- `renderBlueprintMarkdown` escapes `|` in table cells and collapses triple newlines; raw text with pipes or heavy whitespace behaves differently in HTML vs markdown output.
- `DEFAULT_INPUT` is exported and used by consumers and tests; changing it changes the default output everywhere at once.
