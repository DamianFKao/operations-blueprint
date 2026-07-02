# 04 · Build (Northline vertical slice)

A working slice built from `../03-blueprint/operations-system/`: the cost engine, quote pricing, one
estimate-vs-actual variance report, and an Excel ingestion step for `../02-source-data`. It runs on
SQLite so the whole thing is one command; the exported starter repo targets Postgres, and the logic is
identical (see `../06-lessons/LESSONS.md`).

## Run
```
python3 -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt                      # openpyxl (+ fastapi/uvicorn for the API)
python3 run_demo.py                                  # build db, ingest the workbooks, show the outputs
```

Optional HTTP surface (after `run_demo.py` has built the database):
```
uvicorn main:app --reload
#  GET /quotes/Q-2025-018
#  GET /reports/margins
#  GET /reports/variance/Q-2025-018
```

## What's here
| File | Role |
| --- | --- |
| `schema.sql` | the relational source of truth (SQLite) |
| `db.py` | connect + init |
| `ingest.py` | six workbooks → tables (normalises units, handles blanks, parses per-quote tabs) |
| `engine.py` | the cost engine: one place a quote is priced (material + labor + overhead + markup) |
| `reports.py` | margins (with hand-override flag) and estimate-vs-actual variance |
| `main.py` | thin FastAPI surface over the engine + reports |
| `run_demo.py` | end-to-end: build, ingest, and print the results |

Scope is the cost → quote → variance spine (Northline's stated priority, accurate quoting). Cut lists,
scheduling, and the public/product-catalog paths are deliberately out of this slice.
