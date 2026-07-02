# TASKS

Work top to bottom. Each build task names the tables and logic it needs and assumes the ones above it exist.

## Setup

- [ ] Copy `.env.example` to `.env`
- [ ] `docker compose up` and confirm Postgres + the API are healthy
- [ ] Verify the tables from `db/schema.sql` exist

## Build

- [ ] Product-and-cost engine (build this first; everything depends on it). Tables: the product/template/spec, bom_lines, materials, labor_ops. Build a cost(product_ref, options) service that joins the product to its bom_lines (sum of material.cost_per_unit times qty) and to its routing (sum of labor_ops.std_minutes / 60 times rate_per_hr), then adds overhead and margin and writes an audit row on every price change. Every other surface calls this one function; nothing prices on its own. Decide once where overhead lives (inside a loaded labor rate or as its own line, never both) so it cannot be double-counted, and when a line cannot be priced (a material with no cost, an operation the model does not know) surface it rather than dropping it silently.
- [ ] Backfill from what you already have. Import your current spreadsheets into the schema in one pass: map each sheet to its table, normalize units and keys (ft vs foot, ea vs each) and dedupe, and keep anything that does not map cleanly in a notes column so nothing is lost. This is usually where the real mess surfaces; fix it in the data once, here.
- [ ] Cut and nesting optimizer. Input: cut_parts and stock_items. Logic: a bin-packing pass (for example MaxRects) that nests parts onto stock and returns yield, fed back into material cost so batch pricing reflects real offcut waste.
- [ ] Quote builder. Tables: quotes, quote_lines (versioned). Endpoint POST /quotes that calls the engine per line for unit_price (applying a dealer tier discount where relevant), persists the lines, totals the quote, and returns it; GET /quotes/:id/pdf renders it. Internal and customer-facing quoting both go through the one engine, so they cannot disagree.
- [ ] True-cost model. Derive each station rate_per_hr from (labor + overhead + machine cost) over available hours instead of typing it, and snapshot the computed cost onto the project when work completes, so historical cost does not move when current rates change. The engine reads the derived rate.
- [ ] Production capture and variance. Table: production_actuals. Capture material_used and time_used per job (import from the floor or enter), then a variance view that joins actuals to the estimate by operation and station (time_used vs std_minutes, material_used vs bom qty) and feeds corrections back into labor_ops.
- [ ] Catalog and document generation. A generator that reads products and materials at request time and renders the catalog and spec docs (GET /catalog, plus per-product spec sheets). Keep curated fields (descriptions) in their own columns so regeneration never overwrites them, and stamp provenance (source, as_of) on each derived field.
- [ ] Inventory tracking. Tables: inventory, vendors. Decrement stock on consumption so quoting and purchasing read real on-hand levels, not a guess.
- [ ] Delivery scheduling. Table: deliveries. A simple calendar and status flow tied to the project record.
