"""
Reports built by combining the data.

margins:  every quote priced through the engine, with the margin the shop actually recorded and
          any hand-override flagged (this is where Q-2025-031's 750 shows up).
variance: for a job that was built, estimate vs actual by station, using the production log, so an
          overrun (Q-2025-018's welding) shows exactly where the money went and what it did to margin.
"""
import engine


def margins(conn):
    out = []
    for r in conn.execute("SELECT number FROM quotes ORDER BY number"):
        p = engine.price_quote(conn, r["number"])
        recorded = p["recorded_sell"]
        est_cost = p["subtotal"]
        margin = round(recorded - est_cost, 2) if recorded is not None else None
        margin_pct = round(100 * margin / recorded, 1) if (recorded and recorded != 0) else None
        out.append({
            "number": p["number"],
            "description": p["description"],
            "est_cost": est_cost,
            "computed_sell": p["computed_sell"],
            "recorded_sell": recorded,
            "margin": margin,
            "margin_pct": margin_pct,
            "override_delta": p["override_delta"],
        })
    return out


def variance(conn, number):
    est = engine.price_quote(conn, number)
    est_rate = {ll["station"]: ll for ll in est["labor_lines"]}
    rate = {r["station"]: (r["base_rate"], r["oh_rate"]) for r in conn.execute("SELECT station, base_rate, oh_rate FROM labor_ops")}

    stations = []
    actual_labor = actual_oh = 0.0
    for r in conn.execute(
        "SELECT station, est_hours, actual_hours FROM production_actuals WHERE quote_number = ? AND station != 'MATERIAL $'",
        (number,),
    ):
        base, oh = rate.get(r["station"], (0.0, 0.0))
        a_lab = round(r["actual_hours"] * base, 2)
        a_oh = round(r["actual_hours"] * oh, 2)
        actual_labor += a_lab
        actual_oh += a_oh
        est_hours = est_rate.get(r["station"], {}).get("hours", r["est_hours"])
        stations.append({
            "station": r["station"],
            "est_hours": est_hours,
            "actual_hours": r["actual_hours"],
            "hours_delta": round(r["actual_hours"] - (est_hours or 0), 2),
            "actual_labor": a_lab,
            "actual_overhead": a_oh,
        })

    mat_row = conn.execute(
        "SELECT material_actual FROM production_actuals WHERE quote_number = ? AND station = 'MATERIAL $'",
        (number,),
    ).fetchone()
    actual_material = mat_row["material_actual"] if mat_row else est["material"]

    est_cost = est["subtotal"]
    actual_cost = round(actual_material + actual_labor + actual_oh, 2)
    recorded = est["recorded_sell"]
    return {
        "number": number,
        "description": est["description"],
        "recorded_sell": recorded,
        "stations": stations,
        "material_est": est["material"],
        "material_actual": actual_material,
        "est_cost": est_cost,
        "actual_cost": actual_cost,
        "cost_delta": round(actual_cost - est_cost, 2),
        "margin_est": round(recorded - est_cost, 2) if recorded is not None else None,
        "margin_actual": round(recorded - actual_cost, 2) if recorded is not None else None,
    }
