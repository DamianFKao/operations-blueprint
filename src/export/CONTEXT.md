# src/export

Turns a `BlueprintInput` into the starter repo: a flat, path-sorted list of `{ path, content }` files. Nothing here touches disk; callers (the browser zip, `examples/generate.mjs`) write the files.

## What lives here

- `index.ts`: `buildExport`, the assembler. Calls `buildSchema` and `generateBlueprint` once and fans the results out.
- `sql.ts`: `schemaSql`, renders the typed tables as Postgres DDL (creates first, then FKs as `ALTER TABLE`, so order never matters).
- `agents.ts`: `AGENTS.md` and `TASKS.md`. Both derive their build order from the generated Blueprint itself.
- `skeleton.ts`: the FastAPI shell, its per-folder `CONTEXT.md` files, and the conditional feature routers.
- `project.ts`: repo-level files (README, docker-compose, `.env.example`, `.gitignore`, the `blueprint.json` manifest).

## Invariants (a change must preserve all of these)

- Pure, deterministic, browser-safe. This code runs in the browser to build the download zip; no Node APIs, no I/O, no timestamps.
- `db/schema.sql` renders ONLY from the `SchemaTable[]` that `buildSchema` returns. Never hand-write DDL here; if the SQL needs a new table, the change belongs in `schema-model.ts`.
- `agents.ts` reads the build steps from the section with id `'build'` and its `steps` block. If `blueprint-model.ts` renames that id or drops the block, AGENTS.md and TASKS.md get an empty build order with no error. Keep the lookup and the model in step.
- The cost engine (`api/engine/cost.py`) and quote endpoint (`api/routes/quotes.py`) stay deliberately stubbed: precise docstrings plus `NotImplementedError`. They are the specification the agent implements. Do not "helpfully" fill them in.
- Conditional pieces must agree with the schema: a feature router only ships when its tables ship (for example the inventory router only when `inventory !== 'perjob'` adds the `inventory` table). If you add a conditional table, check `features()` in `skeleton.ts` and the docs rows in `blueprint-model.ts`.
- `buildExport` sorts by path; tests and the zip rely on a stable file order.
- `docs/map.svg` renders with the `'self-contained'` palette and no font bytes: the SVG only declares a cursive font stack, so exports stay small and deterministic in the browser. Font embedding lives exclusively in `scripts/lib/embed-font.mjs`, which the gallery build applies to committed files; never add it here.
- `docs/blueprint.md` embeds the Mermaid map (`renderBlueprintMermaid`) after the intro. It renders from the same `buildMapModel` as the SVG, so the two cannot drift.
- Exported content carries no real company, client, vendor, or cost data, and no reference to any private repo.

## Landmines

- The Python files are built from string concatenation. Indentation inside those strings IS the program; a careless reflow produces a skeleton that does not run. After changes, generate an export and run `docker compose up` in it.
- `docker-compose.yml` mounts `db/schema.sql` into Postgres's init directory; renaming that path breaks first boot.
- Table and column names appear inside stub docstrings and the exported `CONTEXT.md` strings (the `db` spine line, the cost formula). Renaming a table in `schema-model.ts` means grepping this folder for the old name.
- `blueprint.json` records the exact input and table list; treat its shape as a public contract, since it is how an export traces back to its answers.
