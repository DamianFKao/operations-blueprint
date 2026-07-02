---
name: excel-to-schema
description: >-
  Use when ingesting a shop's existing spreadsheets into the generated schema
  (the backfill step in an exported starter repo, or any one-pass import of
  workbook data into relational tables). Covers mapping every sheet to its
  target table before writing any code, normalizing units and keys on the way
  in, matching line items by known keys instead of row position so headers and
  totals fall out automatically, and landing every unmappable row in an
  exceptions list the owner can see instead of dropping it.
---

# excel-to-schema

Turn a stack of messy workbooks into joinable rows, in one pass, without losing anything.

Real shop spreadsheets are built for human eyes, not for joins: merged title rows, section
headers, subtotal blocks, units spelled three ways, and one catch-all line with no cost.
This procedure gets that data into the schema honestly.

## Procedure

1. **Map each sheet to its target table before writing any code.** Open every workbook,
   list every sheet, and write the mapping down (sheet to table, column to column) at the
   top of the ingest script. If a sheet has no target table, decide now whether it is data
   (extend the mapping) or a document (leave it as a file). Writing code before the map is
   how sheets get forgotten.

2. **Normalize units and keys first.** One normalization function, applied to every value
   on the way in: `foot` and `feet` become `ft`, `each` becomes `ea`, match keys are
   trimmed and casefolded before comparison. Dedupe after normalizing, not before, or the
   duplicates hide behind spelling.

3. **Match line items by known keys, never by row position.** A row is a material line
   because its code exists in `materials`; it is a labor line because its station exists
   in `labor_ops`. Do not count header rows or hardcode "data starts at row 3" beyond the
   obvious skip: merged titles, section headers, and totals blocks fail every key match
   and fall out automatically, which is the point.

4. **Never silently drop an unmappable row.** Anything that matches no known key lands in
   an exceptions list the owner can see: a table, a notes column, or a printed report at
   the end of the run. A dropped row is a silent hole in a price. The owner decides what
   each exception is; the ingest just refuses to lose it.

## Worked micro-example

A quote detail tab (invented data):

| A | B | C | D |
| --- | --- | --- | --- |
| Quote Q-1042 (Harbor Rail Co.) | | | |
| Item | Qty | Unit | Cost |
| AL-TUBE-25 | 12 | foot | 3.40 |
| Welding | 1.5 | hour | |
| Subtotal | | | 40.80 |
| shop supplies | 1 | each | |

Applying the procedure:

- `AL-TUBE-25` matches a code in `materials`, so it lands in `quote_materials` with
  `foot` normalized to `ft`.
- `Welding` casefolds to match the `welding` station in `labor_ops`, so it lands in
  `quote_labor`.
- The title row, the header row, and the `Subtotal` row match no key and fall out
  without any row counting.
- `shop supplies` also matches no key, but it is not structure: it lands in the
  exceptions list. The owner looks at it and decides (here it turns out to be the
  quote's overhead line, which matters, because pricing it as a material would
  double-count overhead).

## Maturity

v0.1. Validated end to end on one archetype: a configurable metal fabricator (the
Northline example in `examples/northline-metalworks`, six workbooks into the generated
schema). A second, different archetype hardens it to v1; until then expect edges.
