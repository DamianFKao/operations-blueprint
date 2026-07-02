# Examples

## northline-metalworks
A full worked example: a fictional seven-person steel fabrication shop, run end to end through the method.

- `01-profile` who they are and how they work today
- `02-source-data` their (synthetic) spreadsheets, reproducible via `generate_workbooks.py`
- `03-blueprint` the blueprint and starter repo the engine produced for their answers
- `04-build` a working vertical slice built from that export (ingest the workbooks, then cost engine, quote, variance)
- `05-results` what the system produced, once the data was loaded
- `06-lessons` what the run taught, and the fixes it drove back into the engine

Everything here is invented for demonstration. Nothing is from, or about, any real company.

## generate.mjs
Run `node examples/generate.mjs` (after `npm install`) to generate a starter repo from a sample set of
answers into `examples/output/`, and print the plan.
