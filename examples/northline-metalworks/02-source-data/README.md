# 02 · Source data (Northline's current spreadsheets)

The synthetic "before" workbooks: the files Northline actually works from today. All invented, deliberately a
little messy, and internally consistent (the same materials, stations, and jobs reference each other across
files) so the built system can ingest them and the numbers add up.

Regenerate any time:

```
python3 generate_workbooks.py     # needs openpyxl
```

Values are baked (not live Excel formulas) so ingestion reads real numbers and the output is reproducible.

| File | Sheets | What it is |
| --- | --- | --- |
| `materials-price-list.xlsx` | Price List | steel, hardware, finish, with cost/unit + vendor. Messy: `foot` vs `ft`, `each` vs `ea`, a blank-cost `MISC` catch-all, a missing update date. |
| `labor-rates.xlsx` | Shop Rates | per-station base labor + fixed/variable overhead → shop rate/hr. "Set last year." |
| `job-quotes-2025.xlsx` | Quote Log + 3 detail tabs | three 2025 quotes with material/labor/overhead/markup → sell. `Q-2025-031` has a hand-set sell (750) under its formula (785.67): the margin leak. |
| `cut-lists.xlsx` | Q-2025-018, Q-2025-023 | parts + lengths for the saw, disconnected from the quotes. |
| `customers.xlsx` | Customers | the "CRM": names, contacts, terms, notes. |
| `production-log.xlsx` | Job Log | hand-logged est vs actual hours and material. `Q-2025-018` welding ran ~33% over estimate: the "felt tight, couldn't say why" job. |

### The threads these plant for the "after"
- Material appears in the price list, again in each quote, again (as an invoice) in QuickBooks: one source of truth collapses that.
- The shop rate carries overhead, but the quote also adds an overhead line: the engine settles how cost is actually applied.
- `Q-2025-031`'s hand-set price is invisible today; once every quote goes through one engine, the override stands out.
- The production log is the only place estimate meets actual: the variance report is built to read exactly this.
