-- Northline vertical slice schema (SQLite).
--
-- Derived from ../03-blueprint/operations-system/db/schema.sql, trimmed to the
-- cost -> quote -> variance spine, and run on SQLite so the whole demo is one command
-- (the export targets Postgres; the logic is identical). One divergence worth noting:
-- Northline quotes by itemized material + labor lines, not by catalog product, so this
-- slice adds quote_materials / quote_labor line tables (see ../06-lessons/LESSONS.md).

CREATE TABLE materials (
  id            INTEGER PRIMARY KEY,
  code          TEXT UNIQUE,
  description   TEXT,
  category      TEXT,
  unit          TEXT,
  cost_per_unit REAL,          -- may be NULL for un-itemized lines (the MISC catch-all)
  vendor        TEXT,
  lead_days     INTEGER
);

CREATE TABLE labor_ops (
  id        INTEGER PRIMARY KEY,
  station   TEXT UNIQUE,
  base_rate REAL,
  oh_rate   REAL               -- fixed + variable overhead, per hour
);

CREATE TABLE clients (
  id      INTEGER PRIMARY KEY,
  name    TEXT UNIQUE,
  contact TEXT,
  terms   TEXT
);

CREATE TABLE quotes (
  id            INTEGER PRIMARY KEY,
  number        TEXT UNIQUE,
  client_id     INTEGER REFERENCES clients(id),
  description   TEXT,
  markup        REAL,
  recorded_sell REAL,          -- what the shop actually quoted (may be hand-overridden)
  status        TEXT
);

CREATE TABLE quote_materials (
  id          INTEGER PRIMARY KEY,
  quote_id    INTEGER REFERENCES quotes(id),
  material_id INTEGER REFERENCES materials(id),
  qty         REAL
);

CREATE TABLE quote_labor (
  id       INTEGER PRIMARY KEY,
  quote_id INTEGER REFERENCES quotes(id),
  station  TEXT,
  hours    REAL
);

CREATE TABLE production_actuals (
  id              INTEGER PRIMARY KEY,
  quote_number    TEXT,
  station         TEXT,        -- a station name, or 'MATERIAL $'
  est_hours       REAL,
  actual_hours    REAL,
  material_actual REAL
);
