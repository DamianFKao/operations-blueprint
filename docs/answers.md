# The ten answers, and what each one changes

This is the reference for the ten questions the engine asks. Every field below is a property of `BlueprintInput` (see `src/blueprint-model.ts`), the values are the literal strings the engine accepts, and the labels are what the form shows. The "what it changes" notes are grounded in `src/schema-model.ts` (the schema conditionals) and the `build()` function in `src/blueprint-model.ts` (the build-step conditionals).

## 1. `product`: what do you make?

The kind of custom product the shop produces.

| Value | Label |
| --- | --- |
| `'general'` | Custom / made-to-order products |
| `'furniture'` | Furniture / millwork |
| `'metalfab'` | Metal fabrication |
| `'cabinets'` | Cabinets / casework |
| `'signage'` | Signage / displays |
| `'other'` | Other custom product |

What it changes: the noun used throughout the plan and the schema notes (`'general'` and `'other'` say "product", `'furniture'` says "piece", `'metalfab'` says "part", `'cabinets'` says "cabinet", `'signage'` says "sign") plus the intro's description of the operation; it does not change the tables or the build order.

## 2. `variation`: how much does each order vary?

| Value | Label |
| --- | --- |
| `'catalog'` | Mostly standard catalog items |
| `'configurable'` | Configurable / parametric |
| `'custom'` | Fully custom per order |

What it changes: the product entity at the heart of the schema (`'catalog'` gets a `products` table, `'configurable'` gets `product_templates` plus `product_variants`, `'custom'` gets per-order `project_specs`), which in turn decides what `bom_lines`, `quote_lines`, and the other product references point at, and any value other than `'catalog'` adds the plan's note that a quote line can be a per-quote assembly rather than a catalog item.

## 3. `cuts`: do you cut or machine material to size?

This field is a boolean on `BlueprintInput`; the form options map `'yes'` to `true` and `'no'` to `false`.

| Value | Label |
| --- | --- |
| `'yes'` | Yes, we cut/machine material to size |
| `'no'` | No, we assemble bought-to-size parts |

What it changes: answering `'yes'` adds the `stock_items` and `cut_parts` tables, a cut-and-nesting optimizer build step (bin-packing parts onto stock and feeding yield back into material cost), a material-yield analysis, and a cut/nesting report in the documents table.

## 4. `state`: what do you run the business on today?

| Value | Label |
| --- | --- |
| `'paper'` | Paper, or nothing yet |
| `'spreadsheets'` | Spreadsheets |
| `'software'` | Some software already |

What it changes: the framing of the foundation section (starting clean, turning spreadsheet columns into a related model, or consolidating existing software into one source of truth), and any value other than `'paper'` adds a backfill build step that imports your current data into the schema in one pass.

## 5. `team`: how many people?

| Value | Label |
| --- | --- |
| `'solo'` | Just me |
| `'small'` | 2 to 10 people |
| `'larger'` | 10+ people |

What it changes: the SOP advice (a solo shop keeps short docs beside the work, a team writes one SOP per role with named table owners), the hosting and storage guidance in the files section, and who owns the integrator role; it does not change the tables.

## 6. `priority`: what hurts most right now?

| Value | Label |
| --- | --- |
| `'quoting'` | Accurate quoting |
| `'production'` | Production and scheduling |
| `'catalog'` | Keeping catalog and pricing current |
| `'cost'` | Knowing true cost |

What it changes: the order of the four core build items (quote builder, true-cost model, production capture, catalog generation) after the cost engine, so the thing that hurts most gets built first, and the section 4 title names the priority; the cost engine always comes first regardless.

## 7. `install`: do you deliver or install?

| Value | Label |
| --- | --- |
| `'none'` | Customer collects, or we ship |
| `'delivery'` | We deliver |
| `'install'` | We deliver and install on site |

What it changes: `'delivery'` adds a `deliveries` table, a delivery-scheduling build step, a deliveries route stub in the exported skeleton, and a delivery sheet in the documents table; `'install'` adds an `installs` table and crew scheduling on top of that, plus a site SOP note in the process section; `'none'` adds none of these.

## 8. `inventory`: how do you handle materials?

| Value | Label |
| --- | --- |
| `'perjob'` | Buy materials per job |
| `'stock'` | Keep and track stock |
| `'managed'` | Stock with reorder points |

What it changes: `'stock'` adds an `inventory` table, an inventory-tracking build step, and an inventory route stub in the skeleton; `'managed'` adds a `reorder_rules` table on top of that and upgrades the build step to raise purchase suggestions when on-hand stock crosses the minimum; `'perjob'` adds no inventory tables at all.

## 9. `salesChannel`: how do you sell?

| Value | Label |
| --- | --- |
| `'direct'` | Direct (B2B / retail) |
| `'dealers'` | Through dealers / distributors |
| `'online'` | Online / direct to customer |

What it changes: `'dealers'` adds `accounts` and `price_tiers` tables, a dealer-pricing build step, a dealer price sheet in the documents table, and a tier-discount note inside the exported quote stub; `'online'` adds a `catalog_items` table, a public catalog build step, a catalog route stub, and a public catalog row in the documents table; `'direct'` adds none of these.

## 10. `orderPattern`: what does the order flow look like?

| Value | Label |
| --- | --- |
| `'oneoffs'` | Mostly one-offs |
| `'repeat'` | Repeat batches |
| `'runs'` | Production runs |

What it changes: `'runs'` adds a `work_orders` table, a work-orders build step (release runs to stations, track WIP, derive capacity), a work-orders route stub, and points the work order document at `work_orders` instead of `projects`; `'oneoffs'` and `'repeat'` currently produce identical output, which is honest, because the base plan already fits both.
