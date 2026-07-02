# Skills changelog

Reusable procedures that stabilized while building this sandbox. They are candidate Claude Code skills;
per the crawl-walk-run plan they get formalized into `.claude/skills/` once a second shop confirms the
shape. Recording them now so sandbox #2 starts from a procedure, not a blank page.

## excel-to-schema (candidate, v0.1)
Turn a stack of messy workbooks into joinable rows.
- Map each sheet to its table; read data rows past the merged title and header rows.
- Normalize units and keys on the way in (`foot` → `ft`, `each` → `ea`); dedupe.
- Match line items by known keys (a code that exists in `materials`, a station in `labor_ops`) rather
  than by position, so section headers and totals blocks are ignored automatically.
- Never drop a row you cannot map; keep it with a flag.
Proven on: Northline's six workbooks (11 materials, 7 stations, 8 clients, 3 quotes, 13 actuals).

## blueprint-vertical-slice (candidate, v0.1)
Take an export and stand up the smallest honest slice.
- Build the schema, then the cost engine first (everything prices through it).
- Add exactly one report that pays off the shop's stated priority (here: estimate-vs-actual variance).
- Write a `run_demo` that builds, ingests, and prints the outputs, and hand-check one quote to the cent
  before trusting anything.
- Keep it to the priority spine; leave scheduling, catalog, and cut/yield out of the first slice.
Proven on: Northline (cost → quote → variance), math verified against the source workbooks.

## Next
When sandbox #2 (a different shop archetype) runs, confirm both procedures hold, then promote them to
`.claude/skills/`.
