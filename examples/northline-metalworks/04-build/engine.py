"""
The product-and-cost engine: the one place a quote is priced, by joining the data.

  material  = sum over the material lines of (qty * materials.cost_per_unit)
  labor     = sum over the labor lines of (hours * labor_ops.base_rate)
  overhead  = sum over the labor lines of (hours * labor_ops.oh_rate)
  sell      = (material + labor + overhead) * (1 + markup)

Every surface prices through here. It also reports what it could not price cleanly (a material with
no cost, a labor station it does not recognise), instead of silently dropping it.
"""


def price_quote(conn, number):
    q = conn.execute("SELECT * FROM quotes WHERE number = ?", (number,)).fetchone()
    if q is None:
        raise ValueError(f"no quote {number}")

    flags = []

    material = 0.0
    material_lines = []
    for r in conn.execute(
        """SELECT m.code, m.description, qm.qty, m.cost_per_unit
           FROM quote_materials qm JOIN materials m ON m.id = qm.material_id
           WHERE qm.quote_id = ?""",
        (q["id"],),
    ):
        cost = r["cost_per_unit"]
        if cost is None:
            flags.append(f"material {r['code']} has no unit cost; priced at 0")
            cost = 0.0
        amount = round(r["qty"] * cost, 2)
        material += amount
        material_lines.append({"code": r["code"], "qty": r["qty"], "cost_per_unit": cost, "amount": amount})

    labor = overhead = 0.0
    labor_lines = []
    for r in conn.execute(
        """SELECT ql.station, ql.hours, lo.base_rate, lo.oh_rate
           FROM quote_labor ql LEFT JOIN labor_ops lo ON lo.station = ql.station
           WHERE ql.quote_id = ?""",
        (q["id"],),
    ):
        if r["base_rate"] is None:
            flags.append(f"labor station '{r['station']}' not in labor_ops; skipped")
            continue
        lab = round(r["hours"] * r["base_rate"], 2)
        ovh = round(r["hours"] * r["oh_rate"], 2)
        labor += lab
        overhead += ovh
        labor_lines.append({"station": r["station"], "hours": r["hours"], "labor": lab, "overhead": ovh})

    material = round(material, 2)
    labor = round(labor, 2)
    overhead = round(overhead, 2)
    subtotal = round(material + labor + overhead, 2)
    computed_sell = round(subtotal * (1 + q["markup"]), 2)
    recorded = q["recorded_sell"]
    override_delta = round(recorded - computed_sell, 2) if recorded is not None else None
    if override_delta is not None and abs(override_delta) >= 1.0:
        flags.append(f"recorded sell {recorded:.2f} differs from engine {computed_sell:.2f} by {override_delta:+.2f}")

    return {
        "number": number,
        "description": q["description"],
        "markup": q["markup"],
        "material": material,
        "labor": labor,
        "overhead": overhead,
        "subtotal": subtotal,
        "computed_sell": computed_sell,
        "recorded_sell": recorded,
        "override_delta": override_delta,
        "material_lines": material_lines,
        "labor_lines": labor_lines,
        "flags": flags,
    }
