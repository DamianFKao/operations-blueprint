"""
Thin HTTP surface over the same engine and reports (FastAPI). The API is the only writer; every
route validates, calls the engine or a report, and returns. No pricing logic lives here.

Run:  uvicorn main:app --reload    (after: python3 run_demo.py to build + seed the database)
"""
from fastapi import FastAPI, HTTPException

import db
import engine
import reports

app = FastAPI(title="Northline Metalworks (sandbox vertical slice)")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/quotes/{number}")
def get_quote(number: str):
    conn = db.connect()
    try:
        return engine.price_quote(conn, number)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"no quote {number}")
    finally:
        conn.close()


@app.get("/reports/margins")
def get_margins():
    conn = db.connect()
    try:
        return reports.margins(conn)
    finally:
        conn.close()


@app.get("/reports/variance/{number}")
def get_variance(number: str):
    conn = db.connect()
    try:
        return reports.variance(conn, number)
    finally:
        conn.close()
