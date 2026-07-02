# 03 · Blueprint + export (Northline)

Northline's ten answers, run through this repo's engine.

Regenerate (bundles `src/export` with esbuild and runs `buildExport`, the same code that runs in the browser at [damiankao.com/blueprint](https://damiankao.com/blueprint)):

```
node regenerate.mjs
```

| Item | What it is |
| --- | --- |
| `answers.json` | the ten recorded inputs (see `../01-profile/PROFILE.md`) |
| `blueprint.md` | the human-readable plan |
| `operations-system/` | the tailored starter repo the export produces (24 files) |

The schema this produced is tailored to Northline: `product_templates` + `product_variants` (configurable),
`stock_items` + `cut_parts` (they cut to size), `inventory` (they keep stock), `deliveries` (they deliver), and
route stubs for `inventory` and `deliveries`. It correctly leaves out `reorder_rules`, `installs`, `price_tiers`,
`catalog_items`, and `work_orders` (not how this shop operates). Phase 3 builds a working vertical slice from
this: the cost engine, `POST /quotes`, one variance report, and an Excel ingestion step for the `../02-source-data`
workbooks.
