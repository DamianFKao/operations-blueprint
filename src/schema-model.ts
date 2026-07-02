/**
 * schema-model: the typed relational schema behind the Operations Blueprint.
 *
 * This is the single source of truth for the data model. The on-page "schema to start from"
 * table (foundation() in blueprint-model.ts) and the exported db/schema.sql both render from
 * buildSchema(), so what you see in the browser and what an agent gets cannot drift.
 *
 * Generic methodology, codified. No company, client, vendor, SKU, or real cost is referenced.
 */
import type { BlueprintInput } from './blueprint-model';

export interface Column {
  name: string;
  /** SQL type, e.g. 'text', 'numeric(12,2)', 'bigserial'. */
  type: string;
  pk?: boolean;
  /** Table this column foreign-keys to (assumes its id). Omit for plain or polymorphic refs. */
  references?: string;
  /** Short human note, surfaced as an inline comment in the SQL. */
  notes?: string;
}

export interface SchemaTable {
  name: string;
  columns: Column[];
  /** Human relationship note, shown in the on-page schema table. */
  note: string;
}

const id: Column = { name: 'id', type: 'bigserial', pk: true };

/** The tailored relational schema for a given operation. Mirrors foundation()'s conditions. */
export function buildSchema(i: BlueprintInput, noun: string): SchemaTable[] {
  // The product entity differs by variation. bom binds to the base entity; quoting/catalog
  // price the costable entity (a resolved variant when configurable).
  const bomTarget =
    i.variation === 'catalog' ? 'products' : i.variation === 'configurable' ? 'product_templates' : 'project_specs';
  const costableTarget =
    i.variation === 'catalog' ? 'products' : i.variation === 'configurable' ? 'product_variants' : 'project_specs';

  const tables: SchemaTable[] = [];

  // ── The product / template / spec entity ──
  if (i.variation === 'catalog') {
    tables.push({
      name: 'products',
      columns: [id, { name: 'name', type: 'text' }, { name: 'sku', type: 'text' }, { name: 'base_price', type: 'numeric(12,2)' }],
      note: 'has many bom_lines; appears in quote_lines',
    });
  } else if (i.variation === 'configurable') {
    tables.push({
      name: 'product_templates',
      columns: [id, { name: 'name', type: 'text' }, { name: 'params', type: 'jsonb', notes: 'configurable option definitions' }, { name: 'base_price', type: 'numeric(12,2)' }],
      note: 'has many bom_lines; configured into product_variants',
    });
    tables.push({
      name: 'product_variants',
      columns: [id, { name: 'template_id', type: 'bigint', references: 'product_templates' }, { name: 'option_values', type: 'jsonb' }],
      note: 'a resolved configuration that can be costed and quoted',
    });
  } else {
    tables.push({
      name: 'project_specs',
      columns: [id, { name: 'project_id', type: 'bigint', references: 'projects' }, { name: 'spec', type: 'jsonb' }, { name: 'notes', type: 'text' }],
      note: `the per-order definition of a custom ${noun}; resolves to bom_lines`,
    });
  }

  // ── Cost atoms ──
  tables.push({
    name: 'materials',
    columns: [
      id,
      { name: 'name', type: 'text' },
      { name: 'type', type: 'text' },
      { name: 'unit', type: 'text', notes: 'unit of measure (sheet, board-foot, each)' },
      { name: 'cost_per_unit', type: 'numeric(12,4)' },
      { name: 'vendor_id', type: 'bigint', references: 'vendors' },
    ],
    note: 'referenced by bom_lines; belongs to a vendor',
  });
  tables.push({
    name: 'bom_lines',
    columns: [
      id,
      { name: 'product_ref', type: 'bigint', references: bomTarget },
      { name: 'material_id', type: 'bigint', references: 'materials' },
      { name: 'qty', type: 'numeric(12,3)' },
      { name: 'unit', type: 'text' },
    ],
    note: 'binds a product to the materials it consumes (the bill of materials)',
  });
  tables.push({
    name: 'labor_ops',
    columns: [
      id,
      { name: 'name', type: 'text' },
      { name: 'station', type: 'text' },
      { name: 'std_minutes', type: 'numeric(8,2)' },
      { name: 'rate_per_hr', type: 'numeric(10,2)' },
    ],
    note: "a product's routing references these to compute labor",
  });

  if (i.cuts) {
    tables.push({
      name: 'stock_items',
      columns: [
        id,
        { name: 'material_id', type: 'bigint', references: 'materials' },
        { name: 'sheet_w', type: 'numeric(10,2)', notes: 'for sheet stock' },
        { name: 'sheet_h', type: 'numeric(10,2)', notes: 'for sheet stock' },
        { name: 'length', type: 'numeric(10,2)', notes: 'for linear stock' },
        { name: 'cost', type: 'numeric(12,2)' },
      ],
      note: 'the raw stock you cut parts from',
    });
    tables.push({
      name: 'cut_parts',
      columns: [
        id,
        { name: 'product_ref', type: 'bigint', references: bomTarget },
        { name: 'part_name', type: 'text' },
        { name: 'w', type: 'numeric(10,2)' },
        { name: 'h', type: 'numeric(10,2)' },
        { name: 'qty', type: 'integer' },
      ],
      note: 'parts nested onto stock_items to compute yield',
    });
  }

  tables.push({
    name: 'vendors',
    columns: [id, { name: 'name', type: 'text' }, { name: 'lead_time_days', type: 'integer' }, { name: 'terms', type: 'text' }],
    note: 'supplies materials; drives purchasing',
  });

  if (i.inventory !== 'perjob') {
    tables.push({
      name: 'inventory',
      columns: [
        id,
        { name: 'item_ref', type: 'bigint', notes: 'a material or stock_item (polymorphic; resolve in the API)' },
        { name: 'on_hand', type: 'numeric(12,3)' },
        { name: 'location', type: 'text' },
      ],
      note: 'current stock levels, decremented on consumption',
    });
    if (i.inventory === 'managed') {
      tables.push({
        name: 'reorder_rules',
        columns: [
          id,
          { name: 'item_ref', type: 'bigint', notes: 'a material or stock_item' },
          { name: 'min_qty', type: 'numeric(12,3)' },
          { name: 'reorder_qty', type: 'numeric(12,3)' },
        ],
        note: 'raises a purchase suggestion when on_hand crosses min_qty',
      });
    }
  }

  tables.push({
    name: 'clients',
    columns: [id, { name: 'name', type: 'text' }, { name: 'contact', type: 'text' }, { name: 'terms', type: 'text' }],
    note: 'owns projects and quotes',
  });

  if (i.salesChannel === 'dealers') {
    tables.push({
      name: 'accounts',
      columns: [id, { name: 'client_id', type: 'bigint', references: 'clients' }, { name: 'tier', type: 'text' }],
      note: 'dealer accounts, mapped to a pricing tier',
    });
    tables.push({
      name: 'price_tiers',
      columns: [id, { name: 'tier', type: 'text' }, { name: 'discount_pct', type: 'numeric(5,2)' }],
      note: 'applied by the engine for dealer pricing',
    });
  }
  if (i.salesChannel === 'online') {
    tables.push({
      name: 'catalog_items',
      columns: [
        id,
        { name: 'product_ref', type: 'bigint', references: costableTarget },
        { name: 'public_price', type: 'numeric(12,2)' },
        { name: 'published', type: 'boolean' },
      ],
      note: 'the read-only public surface, priced by the same engine',
    });
  }

  tables.push({
    name: 'projects',
    columns: [
      id,
      { name: 'client_id', type: 'bigint', references: 'clients' },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'timestamptz' },
      { name: 'due_date', type: 'date' },
    ],
    note: 'a job from quote through delivery',
  });
  tables.push({
    name: 'quotes',
    columns: [
      id,
      { name: 'project_id', type: 'bigint', references: 'projects' },
      { name: 'version', type: 'integer' },
      { name: 'total', type: 'numeric(12,2)' },
      { name: 'status', type: 'text' },
    ],
    note: 'priced output of the engine; versioned',
  });
  tables.push({
    name: 'quote_lines',
    columns: [
      id,
      { name: 'quote_id', type: 'bigint', references: 'quotes' },
      { name: 'product_ref', type: 'bigint', references: costableTarget },
      { name: 'qty', type: 'numeric(12,2)' },
      { name: 'unit_price', type: 'numeric(12,2)' },
    ],
    note: 'the line items, each priced by the engine',
  });

  if (i.install !== 'none') {
    tables.push({
      name: 'deliveries',
      columns: [
        id,
        { name: 'project_id', type: 'bigint', references: 'projects' },
        { name: 'scheduled_date', type: 'date' },
        { name: 'address', type: 'text' },
        { name: 'status', type: 'text' },
      ],
      note: 'shipping / delivery scheduling',
    });
    if (i.install === 'install') {
      tables.push({
        name: 'installs',
        columns: [
          id,
          { name: 'project_id', type: 'bigint', references: 'projects' },
          { name: 'crew', type: 'text' },
          { name: 'scheduled_date', type: 'date' },
          { name: 'site_notes', type: 'text' },
        ],
        note: 'on-site installation jobs',
      });
    }
  }

  if (i.orderPattern === 'runs') {
    tables.push({
      name: 'work_orders',
      columns: [
        id,
        { name: 'product_ref', type: 'bigint', references: costableTarget },
        { name: 'qty', type: 'integer' },
        { name: 'due_date', type: 'date' },
        { name: 'station_schedule', type: 'jsonb' },
      ],
      note: 'releases production runs to stations; tracks WIP',
    });
  }

  tables.push({
    name: 'production_actuals',
    columns: [
      id,
      { name: 'project_id', type: 'bigint', references: 'projects' },
      { name: 'material_used', type: 'numeric(12,3)' },
      { name: 'time_used', type: 'numeric(10,2)' },
    ],
    note: 'what the floor actually consumed, compared back to the estimate',
  });

  return tables;
}
