---
name: blueprint-vertical-slice
description: >-
  Use when building the first working slice from an exported starter repo (the
  operations-system folder this engine produces). Covers starting from the
  export instead of rescaffolding, building the cost engine first so everything
  prices through one function, adding exactly one report that pays off the
  shop's stated priority answer, hand-checking one quote to the cent before
  trusting the engine, and keeping scheduling, catalog generation, and
  cut-yield optimization out of slice one.
---

# blueprint-vertical-slice

Take an export and stand up the smallest honest slice: one path from data to a number the
owner already cares about, verified by hand.

## Procedure

1. **Start from the export; do not rescaffold.** The exported repo already carries a
   schema tailored to this shop's ten answers, plus `AGENTS.md` (the operating manual)
   and `TASKS.md` (the build order). Read those first and work inside them. Rebuilding
   the scaffold throws away the tailoring, which is the whole value of the export.

2. **Build the cost engine first, and make everything price through it.** The
   `cost()` function is the keystone: materials joined to quantities, labor joined to
   rates, overhead applied exactly once (a loaded rate or a separate line, never both),
   and any line it cannot price surfaced rather than dropped. No other surface computes
   a price on its own. If a route or report starts doing its own arithmetic, stop and
   route it through the engine.

3. **Add exactly one report, and make it pay off the shop's stated priority answer.**
   The blueprint records what the owner said hurts most. Build the one report that
   answers it (if the priority is margin, that is estimate-versus-actual variance) and
   nothing else. One report proves the loop from raw data to a useful number; a second
   one dilutes the slice before the first is trusted.

4. **Hand-check one quote to the cent before trusting the engine.** Pick one real quote,
   compute it manually from the source data (line by line, on paper or in a scratch
   sheet), and compare. The engine and the hand calculation must match to the cent. Any
   gap, however small, is a modeling error worth finding now: a double-counted overhead,
   a dropped line, a unit that did not normalize. In the Northline example the
   hand-check matched at $4,106.70, and getting there is what caught the
   overhead-once rule.

5. **Keep scheduling, catalog generation, and cut-yield optimization out of slice one.**
   They are real, they are in the build order, and they come later. Slice one earns
   trust; the rest of the build spends it.

## Maturity

v0.1. Validated end to end on one archetype: a configurable metal fabricator (the
Northline example in `examples/northline-metalworks`, cost engine to quote to variance
report). A second, different archetype hardens it to v1; until then expect edges.
