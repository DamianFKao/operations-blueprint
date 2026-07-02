"""Database access. One connection; the API is the only writer."""
import os

import psycopg

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@db:5432/ops")


def get_conn() -> "psycopg.Connection":
    """Open a connection. Swap for a pool (psycopg_pool) once you have concurrency."""
    return psycopg.connect(DATABASE_URL)
