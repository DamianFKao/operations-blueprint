"""SQLite connection + schema init for the Northline vertical slice."""
import pathlib
import sqlite3

HERE = pathlib.Path(__file__).parent
DB_PATH = HERE / "northline.db"
SCHEMA_PATH = HERE / "schema.sql"


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA_PATH.read_text())
    conn.commit()


def reset() -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()
