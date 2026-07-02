# AGENTS.md

Operating manual for building this system. You are an AI coding agent. Read this file first,
then `db/schema.sql`, then `TASKS.md`. (This file also serves as CLAUDE.md / .cursorrules.)

## What you are building

A foundation-first plan for a metal fabrication operation. It rests on one idea: once you decompose your part into honest, relational data, the things above it (pricing, quoting, scheduling, sales) become outputs of that data rather than work you do by hand. The foundation and data sections are for you, the owner; the build, tooling, and integrator sections are for whoever implements it, whether that is you, a team member, or an AI agent you direct. Build it in the order below; each layer assumes the one before it is solid.

## Golden rules (do not break these)

- One source of truth: Postgres (`db/schema.sql`). Every fact lives in exactly one table.
- The API is the only writer to the database. Every surface goes through it.
- Everything prices through one function: `api/engine/cost.py`. No surface computes a price on its own.
- Decompose before you automate. If something is not joinable data, it is a file, not data.
- Build one deployable slice at a time, and run it before moving on. Read every change before it lands.

## Build order

1. Product-and-cost engine (build this first; everything depends on it). Tables: the product/template/spec, bom_lines, materials, labor_ops. Build a cost(product_ref, options) service that joins the product to its bom_lines (sum of material.cost_per_unit times qty) and to its routing (sum of labor_ops.std_minutes / 60 times rate_per_hr), then adds overhead and margin and writes an audit row on every price change. Every other surface calls this one function; nothing prices on its own. Decide once where overhead lives (inside a loaded labor rate or as its own line, never both) so it cannot be double-counted, and when a line cannot be priced (a material with no cost, an operation the model does not know) surface it rather than dropping it silently.
2. Backfill from what you already have. Import your current spreadsheets into the schema in one pass: map each sheet to its table, normalize units and keys (ft vs foot, ea vs each) and dedupe, and keep anything that does not map cleanly in a notes column so nothing is lost. This is usually where the real mess surfaces; fix it in the data once, here.
3. Cut and nesting optimizer. Input: cut_parts and stock_items. Logic: a bin-packing pass (for example MaxRects) that nests parts onto stock and returns yield, fed back into material cost so batch pricing reflects real offcut waste.
4. Quote builder. Tables: quotes, quote_lines (versioned). Endpoint POST /quotes that calls the engine per line for unit_price (applying a dealer tier discount where relevant), persists the lines, totals the quote, and returns it; GET /quotes/:id/pdf renders it. Internal and customer-facing quoting both go through the one engine, so they cannot disagree.
5. True-cost model. Derive each station rate_per_hr from (labor + overhead + machine cost) over available hours instead of typing it, and snapshot the computed cost onto the project when work completes, so historical cost does not move when current rates change. The engine reads the derived rate.
6. Production capture and variance. Table: production_actuals. Capture material_used and time_used per job (import from the floor or enter), then a variance view that joins actuals to the estimate by operation and station (time_used vs std_minutes, material_used vs bom qty) and feeds corrections back into labor_ops.
7. Catalog and document generation. A generator that reads products and materials at request time and renders the catalog and spec docs (GET /catalog, plus per-product spec sheets). Keep curated fields (descriptions) in their own columns so regeneration never overwrites them, and stamp provenance (source, as_of) on each derived field.
8. Inventory tracking. Tables: inventory, vendors. Decrement stock on consumption so quoting and purchasing read real on-hand levels, not a guess.
9. Delivery scheduling. Table: deliveries. A simple calendar and status flow tied to the project record.

## Conventions

- One folder per domain; each folder has a `CONTEXT.md` describing what it is and its rules. Keep them current.
- Migrations are forward-only; never edit a shipped migration.
- Generate documents (quotes, contracts, reports) from data at request time; never hand-maintain them.

## Guardrails

- A human approves anything that goes out the door (quotes, contracts, customer messages).
- Give any analysis or assistant agent read-scoped database access, not write access.

## How to run

1. Copy `.env.example` to `.env`.
2. `docker compose up` starts Postgres (loading `db/schema.sql`) and the API on :8000.
3. Confirm `http://localhost:8000/health`, then start filling `api/engine/cost.py` (the keystone).
