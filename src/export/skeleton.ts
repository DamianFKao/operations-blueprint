/**
 * skeleton: the FastAPI starter files for the export.
 *
 * Not a finished app: a real, runnable shell with the keystone (the cost engine and the
 * quote endpoint) stubbed precisely, plus per-folder CONTEXT.md files and the tailored
 * feature routers the inputs call for. The agent fills the TODOs against db/schema.sql.
 */
import type { BlueprintInput } from '../blueprint-model';

export interface ExportFile {
  path: string;
  content: string;
}

interface Feature {
  module: string;
  prefix: string;
  tag: string;
  doc: string;
  todo: string;
}

function features(i: BlueprintInput): Feature[] {
  const out: Feature[] = [];
  if (i.inventory !== 'perjob') {
    out.push({
      module: 'inventory',
      prefix: '/inventory',
      tag: 'inventory',
      doc: 'Inventory. Decrement stock on consumption so quoting and purchasing read real on-hand levels.',
      todo:
        i.inventory === 'managed'
          ? 'expose on_hand, and raise a purchase suggestion when on_hand crosses reorder_rules.min_qty.'
          : 'expose on_hand and decrement it as jobs consume material.',
    });
  }
  if (i.install !== 'none') {
    out.push({
      module: 'deliveries',
      prefix: '/deliveries',
      tag: 'deliveries',
      doc: 'Delivery scheduling tied back to the project record.',
      todo:
        i.install === 'install'
          ? 'schedule deliveries and on-site installs by crew/route, with a status flow tied to the project.'
          : 'schedule deliveries with a simple status flow tied to the project.',
    });
  }
  if (i.salesChannel === 'online') {
    out.push({
      module: 'catalog',
      prefix: '/catalog',
      tag: 'catalog',
      doc: 'Public catalog and order intake, priced by the same engine.',
      todo: 'serve a read-only catalog priced by engine.cost(), plus an order/quote-request intake that lands in projects.',
    });
  }
  if (i.orderPattern === 'runs') {
    out.push({
      module: 'work_orders',
      prefix: '/work-orders',
      tag: 'work_orders',
      doc: 'Work orders: release production runs to stations and track WIP.',
      todo: 'release runs to stations, track WIP, and derive basic capacity and a forecast from the pipeline.',
    });
  }
  return out;
}

const MAIN = (feats: Feature[]): string => {
  const imports = feats.map((f) => `from .routes import ${f.module}`).join('\n');
  const includes = feats.map((f) => `app.include_router(${f.module}.router)`).join('\n');
  return (
    '"""FastAPI entrypoint. The API is the only writer to the database; every surface goes through it."""\n' +
    'from fastapi import FastAPI\n\n' +
    'from .routes import quotes\n' +
    (imports ? imports + '\n' : '') +
    '\napp = FastAPI(title="Operations System")\n\n\n' +
    '@app.get("/health")\n' +
    'def health() -> dict:\n' +
    '    return {"status": "ok"}\n\n\n' +
    'app.include_router(quotes.router)\n' +
    (includes ? includes + '\n' : '')
  );
};

const DB_PY =
  '"""Database access. One connection; the API is the only writer."""\n' +
  'import os\n\n' +
  'import psycopg\n\n' +
  'DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@db:5432/ops")\n\n\n' +
  'def get_conn() -> "psycopg.Connection":\n' +
  '    """Open a connection. Swap for a pool (psycopg_pool) once you have concurrency."""\n' +
  '    return psycopg.connect(DATABASE_URL)\n';

const COST_PY =
  '"""\n' +
  'The product-and-cost engine. Build this FIRST; everything prices through it.\n\n' +
  'cost(product_ref, options) returns a priced breakdown by JOINING the data:\n' +
  '  material_cost = sum over bom_lines of (materials.cost_per_unit * bom_lines.qty)\n' +
  '  labor_cost    = sum over the routing of (labor_ops.std_minutes / 60 * labor_ops.rate_per_hr)\n' +
  '  unit_price    = (material_cost + labor_cost + overhead) * (1 + margin)\n\n' +
  'No other surface computes a price. Write an audit row on every price change.\n' +
  'See db/schema.sql for the tables.\n' +
  '"""\n' +
  'from ..db import get_conn\n\n\n' +
  'def cost(product_ref: int, options: dict | None = None) -> dict:\n' +
  '    options = options or {}\n' +
  '    # TODO: material join  -> sum(materials.cost_per_unit * bom_lines.qty) for this product_ref\n' +
  '    # TODO: labor join     -> sum(labor_ops.std_minutes / 60 * labor_ops.rate_per_hr) for its routing\n' +
  '    # TODO: add overhead + margin, persist an audit row, return the breakdown\n' +
  '    # NOTE: apply overhead once (a loaded rate OR a separate line, never both)\n' +
  '    # NOTE: if a line cannot be priced (no cost, unknown op), surface it, do not drop it\n' +
  '    raise NotImplementedError("Implement the cost engine first; see AGENTS.md and db/schema.sql")\n';

const quotesPy = (dealers: boolean): string =>
  '"""Quote builder. Quotes are versioned; every line is priced by the one engine."""\n' +
  'from fastapi import APIRouter\n\n' +
  'from ..engine.cost import cost\n\n' +
  'router = APIRouter(prefix="/quotes", tags=["quotes"])\n\n\n' +
  '@router.post("")\n' +
  'def create_quote(payload: dict) -> dict:\n' +
  '    """\n' +
  '    For each line: price it with cost(product_ref, options).\n' +
  (dealers
    ? '    Apply the dealer tier discount when the client maps to a price_tier.\n'
    : '') +
  '    Persist quotes + quote_lines as a new version, total it, and return the quote.\n' +
  '    Internal and customer-facing quoting both go through here, so they cannot disagree.\n' +
  '    """\n' +
  '    # TODO: implement\n' +
  '    raise NotImplementedError\n\n\n' +
  '@router.get("/{quote_id}")\n' +
  'def get_quote(quote_id: int) -> dict:\n' +
  '    # TODO: load quote + quote_lines\n' +
  '    raise NotImplementedError\n';

const featureRoute = (f: Feature): string =>
  `"""${f.doc}"""\n` +
  'from fastapi import APIRouter\n\n' +
  `router = APIRouter(prefix="${f.prefix}", tags=["${f.tag}"])\n\n\n` +
  `# TODO: ${f.todo}\n`;

const REQUIREMENTS = 'fastapi\nuvicorn[standard]\npsycopg[binary]\n';

const DOCKERFILE =
  'FROM python:3.12-slim\n' +
  'WORKDIR /app\n' +
  'COPY api/requirements.txt api/requirements.txt\n' +
  'RUN pip install --no-cache-dir -r api/requirements.txt\n' +
  'COPY api api\n' +
  'CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]\n';

const CTX_API =
  '# api\n\n' +
  'This service is the only writer to the database. Every surface (internal tools, customer views,\n' +
  'reports) goes through it, so logic lives here, never in clients. Keep routes thin: validate, call\n' +
  'the engine or a service, persist, return. Pricing belongs in engine/cost.py and nowhere else.\n';

const CTX_ENGINE =
  '# api/engine\n\n' +
  'The keystone. cost() is the ONE place a price is computed. Build it first. Every quote, catalog\n' +
  'price, and report calls it; nothing prices on its own. If you need a price somewhere, import cost().\n';

const CTX_ROUTES =
  '# api/routes\n\n' +
  'HTTP surfaces, one module per domain. Thin by design: parse input, call engine.cost() or a service,\n' +
  'persist through the API, return. No pricing or business rules inline here.\n';

const CTX_DB =
  '# db\n\n' +
  'schema.sql is the single source of truth. The spine runs:\n' +
  'materials -> bom_lines -> products -> quote_lines -> quotes -> projects -> clients.\n' +
  'Cost rolls up the left; sales roll down the right; production_actuals close the loop onto estimates.\n' +
  'Migrations are forward-only: never edit a shipped migration; add a new one.\n';

export function skeletonFiles(i: BlueprintInput): ExportFile[] {
  const feats = features(i);
  const files: ExportFile[] = [
    { path: 'api/__init__.py', content: '' },
    { path: 'api/main.py', content: MAIN(feats) },
    { path: 'api/db.py', content: DB_PY },
    { path: 'api/requirements.txt', content: REQUIREMENTS },
    { path: 'api/Dockerfile', content: DOCKERFILE },
    { path: 'api/engine/__init__.py', content: '' },
    { path: 'api/engine/cost.py', content: COST_PY },
    { path: 'api/routes/__init__.py', content: '' },
    { path: 'api/routes/quotes.py', content: quotesPy(i.salesChannel === 'dealers') },
    { path: 'api/CONTEXT.md', content: CTX_API },
    { path: 'api/engine/CONTEXT.md', content: CTX_ENGINE },
    { path: 'api/routes/CONTEXT.md', content: CTX_ROUTES },
    { path: 'db/CONTEXT.md', content: CTX_DB },
  ];
  for (const f of feats) {
    files.push({ path: `api/routes/${f.module}.py`, content: featureRoute(f) });
  }
  return files;
}
