# How it works

This page explains the design of the engine in plain language. If you want to change the code, read this first, then the `CONTEXT.md` files in `src/` and `src/export/`.

## The one-sentence version

Ten answers about a shop go into a set of pure functions, and out come two things built from the same data: a readable plan and a runnable starter repo.

## Deterministic, by design

The engine is deterministic pure functions all the way down. There is no LLM, no network call, and no stored data. The same ten answers always produce the same plan and the same export, byte for byte. That is a feature, not a limitation:

- You can regenerate any output at any time and get the same result, so derived files (the example blueprints, `db/schema.sql`) are never hand-maintained.
- The whole engine runs in the browser (the tool at [damiankao.com/blueprint](https://damiankao.com/blueprint) uses this exact code), so nothing you type ever leaves your machine.
- Tests can assert exact output, which keeps changes honest.

This is also why `src/` uses no Node APIs: the code has to run in a browser `<script>` as well as in Node.

## The input

`BlueprintInput` (defined in `src/blueprint-model.ts`) is a plain object with ten fields: what you make, how it varies, whether you cut material to size, what you run on today, team size, your priority, whether you deliver or install, how you handle inventory, how you sell, and your order pattern. Each field is a small string union, and the option `Record`s in the same file (`PRODUCTS`, `VARIATIONS`, and the rest) carry the human labels. See [answers.md](answers.md) for every option and what it changes.

## The schema model is the single source of truth

The most important design decision in the codebase is that the relational schema exists exactly once, as typed data.

`buildSchema(input, noun)` in `src/schema-model.ts` returns an array of `SchemaTable` objects: table names, typed columns, foreign key references, and human notes. Two consumers render it:

1. The plan's "schema to start from" table (the `foundation` section in `src/blueprint-model.ts`) maps each `SchemaTable` to a display row.
2. The exported `db/schema.sql` (`schemaSql` in `src/export/sql.ts`) renders the same tables as Postgres DDL: `CREATE TABLE` statements, then foreign keys as `ALTER TABLE` statements so the output does not depend on table order.

Because both render from the same function, the schema a person reads in the browser and the schema an agent loads into Postgres cannot disagree. If you want to change the data model, you change `buildSchema` and both outputs follow.

The schema is tailored to the answers. For example, `variation` decides the product entity (`products` for catalog items, `product_templates` plus `product_variants` for configurable work, `project_specs` for fully custom orders), `cuts` adds `stock_items` and `cut_parts`, and `salesChannel: 'dealers'` adds `accounts` and `price_tiers`.

## How generateBlueprint composes the plan

`generateBlueprint(input)` returns a `Blueprint`: an intro paragraph plus six sections, each built by its own pure function in `src/blueprint-model.ts`:

| Section id | What it covers |
| --- | --- |
| `foundation` | The relational data model, including the schema table rendered from `buildSchema` |
| `process` | Operations and routing, SOPs, and the estimate-versus-actuals feedback loop |
| `files` | The shape of the system: one database, one API writer, documents referenced by id |
| `build` | Dependency-ordered build steps, reordered around the shop's stated priority |
| `tooling` | A self-hostable stack (Postgres, an API service, Docker, and so on) |
| `integrator` | Who builds and operates it, the analyses worth building, and the documents to generate from data |

Each section is a list of blocks, and `Block` is a closed union of seven kinds: `prose`, `subhead`, `list`, `steps`, `table`, `links`, and `callout`. Sections tailor themselves with plain conditionals on the input. The `build` section is the most tailored: it always starts with the cost engine, adds a backfill step when you already have data, a nesting step when you cut material, then orders the four core builds (quote, cost, production, catalog) by your priority, and appends the input-specific items (inventory, delivery, dealer pricing, and so on).

One structural detail matters more than it looks: the `build` section keeps the id `'build'` and contains a `steps` block, because the export reads the build order out of it (see below).

## How render.ts turns blocks into pages

`src/render.ts` has two renderers over the same `Blueprint`:

- `renderBlueprintHTML(bp)` produces an HTML string. Each block kind maps to one small template with global `bp-*` classes, and every piece of text passes through an escaping function. One render path serves both a server render and a client re-render, so there is no drift between the static page and the live tool.
- `renderBlueprintMarkdown(bp)` produces a portable markdown document: the same sections and blocks as headings, lists, numbered steps, blockquotes, and pipe tables (with pipes escaped inside cells). This is the `docs/blueprint.md` you get in an export, and what you would paste into a chat with an agent.

Because both renderers switch over the closed `Block` union, adding a new block kind means updating both, and the compiler tells you so.

## One model, three renderers: the Blueprint Map

The map works the same way the schema does: one model, rendered more than once.

- `buildMapModel(input)` in `src/map.ts` derives the map's nodes and edges from the same answers that drive `buildSchema` and the written plan: the always-present data spine (materials through clients), the modules the shop's answers switch on, and the estimate versus actual feedback loop. Every node carries the real table names it stands for and the id of the plan section it links to.
- `renderBlueprintMap(input, opts)` draws that model as a hand-drawn SVG, using the small sketch renderer in `src/sketch-lite.ts`. Every shape is seeded from its own string key (no `Math.random`, no dates), so the same input always produces the same wobble, byte for byte, and toggling one answer never redraws the parts that did not change. Two palettes: `'site'` takes its colors from the page, `'self-contained'` embeds a small `<style>` (light palette, dark mode override) so the file reads anywhere.
- `renderBlueprintMermaid(input)` emits the same model as a fenced Mermaid flowchart, which GitHub and most markdown viewers render as a diagram inside the exported plan.

Because all three render from one `buildMapModel`, the map cannot disagree with the plan: if an answer adds a table, the schema, the prose, the SVG, and the Mermaid diagram all pick it up from the same source.

## How buildExport assembles the starter repo

`buildExport(input)` in `src/export/index.ts` returns a flat, path-sorted list of `{ path, content }` files. Nothing touches disk; callers (the browser zip, the CLI at `bin/operations-blueprint.mjs`, `examples/generate.mjs`) decide where the files go. The pieces:

- `db/schema.sql`: the DDL, rendered from the same `buildSchema` tables as the plan.
- `AGENTS.md` and `TASKS.md` (`src/export/agents.ts`): the agent's operating manual and build checklist. Both derive from the generated `Blueprint` itself: they find the section with id `'build'`, take its `steps` block, and render those steps as a numbered build order and a checkbox list. The plan and the checklist cannot drift apart because they are the same data.
- `docs/blueprint.md`: the full plan, via `renderBlueprintMarkdown`, with the Mermaid map embedded after the intro.
- `docs/map.svg`: the Blueprint Map as a self-contained SVG (see above).
- The FastAPI skeleton (`src/export/skeleton.ts`): a real, runnable shell, not a finished app. `api/main.py`, `api/db.py`, a Dockerfile, and per-folder `CONTEXT.md` files, plus feature routers only for the features your answers call for. The two keystone pieces, the cost engine (`api/engine/cost.py`) and the quote endpoint (`api/routes/quotes.py`), are deliberately stubbed: they carry precise docstrings describing the joins and rules, then raise `NotImplementedError`. That is intentional. The stubs are the specification the agent (or you) implements against `db/schema.sql`, and the plan is explicit that pricing must exist in exactly one place.
- Project files (`src/export/project.ts`): a README, a `docker-compose.yml` that starts Postgres (loading `db/schema.sql` on first boot) and the API, `.env.example`, `.gitignore`, and `blueprint.json`, a small manifest recording the answers and the tables so any export can be traced back to its input.

For the default answers this comes to 25 files. A different set of answers produces a different schema, build order, and set of routers.

## Where to go next

- [answers.md](answers.md): every question, every option, and what each one changes.
- [build-with-an-agent.md](build-with-an-agent.md): the workflow for handing an export to a coding agent.
- `examples/northline-metalworks/`: a full worked example, from synthetic spreadsheets through a working vertical slice.
