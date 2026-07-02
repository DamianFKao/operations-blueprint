"""
The product-and-cost engine. Build this FIRST; everything prices through it.

cost(product_ref, options) returns a priced breakdown by JOINING the data:
  material_cost = sum over bom_lines of (materials.cost_per_unit * bom_lines.qty)
  labor_cost    = sum over the routing of (labor_ops.std_minutes / 60 * labor_ops.rate_per_hr)
  unit_price    = (material_cost + labor_cost + overhead) * (1 + margin)

No other surface computes a price. Write an audit row on every price change.
See db/schema.sql for the tables.
"""
from ..db import get_conn


def cost(product_ref: int, options: dict | None = None) -> dict:
    options = options or {}
    # TODO: material join  -> sum(materials.cost_per_unit * bom_lines.qty) for this product_ref
    # TODO: labor join     -> sum(labor_ops.std_minutes / 60 * labor_ops.rate_per_hr) for its routing
    # TODO: add overhead + margin, persist an audit row, return the breakdown
    # NOTE: apply overhead once (a loaded rate OR a separate line, never both)
    # NOTE: if a line cannot be priced (no cost, unknown op), surface it, do not drop it
    raise NotImplementedError("Implement the cost engine first; see AGENTS.md and db/schema.sql")
