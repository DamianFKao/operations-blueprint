# 06 · Lessons (and what changed in the tool)

The point of a sandbox is not the demo; it is what running a real shop's data through the method
teaches, and what that fixes. Sandbox #1 hardened the blueprint in three concrete ways.

## What we tested
Northline's ten answers → the generated blueprint and starter repo → a working vertical slice (cost
engine, `POST /quotes`, one variance report, Excel ingestion) → the shop's six workbooks loaded and run.

## What worked
- The export built cleanly and the schema was correctly tailored to this shop (templates + variants,
  stock_items + cut_parts, inventory, deliveries; nothing it does not need).
- The cost engine, priced through one join, matched a hand-check to the cent ($4,106.70 on Q-2025-018).
- Both problems planted in the messy data surfaced on their own: the hand-set price (Q-2025-031, off by
  35.67) and the welding overrun (Q-2025-018, margin 1,064.70 → 812.50).
- The AGENTS.md build order was a genuinely followable spec for building the slice.

## What the run exposed, and the fix shipped back into the tool

### 1. A configurable shop quotes by assembly, not by catalog product
The export modeled a quote line as a reference to a catalog product/variant. Northline does not keep a
product catalog; each quote is an assembly built up from its own materials and operations. The slice had
to add `quote_materials` / `quote_labor` line tables to fit reality.
- **Fixed:** the blueprint now tells configurable and custom shops that a quote line can reference either
  a defined product or a per-quote assembly, priced the same way. (`blueprint-model.ts`, foundation.)

### 2. There was no "import your existing data" step
Every real shop starts from spreadsheets, and ingesting them is where the mess lives (inconsistent
units, a blank-cost catch-all). The export jumped straight to building features with no backfill step.
- **Fixed:** the build now includes a "backfill from what you already have" step for any shop not
  starting on paper: import the current spreadsheets in one pass, normalizing units and keys and keeping
  anything that does not map cleanly. (`blueprint-model.ts`, build.)

### 3. Overhead could be double-counted, and unpriceable lines could vanish
Northline's labor sheet carries a fully loaded shop rate, but its quotes also add a separate overhead
line: apply both and you double-count. And a material with no cost (the MISC line) could silently drop
from a price.
- **Fixed:** the engine guidance now says to apply overhead once (a loaded rate or a separate line,
  never both) and to surface any line it cannot price rather than dropping it. (`blueprint-model.ts`
  engine text and the `cost.py` stub in `export/skeleton.ts`.)

### Minor, documented, no change
The slice runs on SQLite so the whole demo is one command; the export targets Postgres. The logic is
identical, so this stayed a note, not a fix.

## Files touched by this round
- `src/lib/blueprint/blueprint-model.ts`: itemized-assembly note (configurable/custom), the backfill
  build step (state != paper), the overhead-once and flag-do-not-drop guidance.
- `src/lib/blueprint/export/skeleton.ts`: the same two engine notes in the `cost.py` stub.
- Northline's `../03-blueprint` export was regenerated, so it now carries all three improvements. Verified
  they are tailored: a paper/catalog shop gets neither the backfill step nor the assembly note.

## The meta-point
A fully synthetic shop, taken end to end, found three real gaps in the tool and closed them, without any
real company's data. That is the loop working on itself, which is exactly the thesis.
