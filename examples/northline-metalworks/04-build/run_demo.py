"""
End-to-end demo: build the database, ingest Northline's six workbooks, and show what the system
produces. This is the "after" the sandbox exists to show. Run:  python3 run_demo.py
"""
import db
import engine
import ingest
import reports


def money(x):
    return "n/a" if x is None else f"${x:,.2f}"


def rule(t=""):
    print("\n" + t)
    print("-" * 72)


def main():
    db.reset()
    conn = db.connect()
    db.init_schema(conn)
    counts = ingest.ingest(conn)

    rule("INGESTED (six spreadsheets -> one relational source of truth)")
    print("  " + ",  ".join(f"{k}: {v}" for k, v in counts.items()))

    # 1. One quote, priced through the engine.
    p = engine.price_quote(conn, "Q-2025-018")
    rule(f"QUOTE {p['number']}  ·  {p['description']}")
    print(f"  {'Material':<12}{money(p['material'])}")
    print(f"  {'Labor':<12}{money(p['labor'])}")
    print(f"  {'Overhead':<12}{money(p['overhead'])}")
    print(f"  {'Subtotal':<12}{money(p['subtotal'])}")
    print(f"  {'Markup':<12}{int(p['markup']*100)}%")
    print(f"  {'Sell':<12}{money(p['computed_sell'])}   (recorded: {money(p['recorded_sell'])})")

    # 2. Margins across all quotes, with the hand-override surfaced.
    rule("MARGINS  (every quote priced through the one engine)")
    print(f"  {'Quote':<12}{'Est cost':>11}{'Sell':>11}{'Margin':>11}{'Margin %':>10}   flag")
    for m in reports.margins(conn):
        flag = ""
        if m["override_delta"] is not None and abs(m["override_delta"]) >= 1:
            flag = f"hand-set sell, {m['override_delta']:+.2f} vs engine"
        print(f"  {m['number']:<12}{money(m['est_cost']):>11}{money(m['recorded_sell']):>11}"
              f"{money(m['margin']):>11}{(str(m['margin_pct'])+'%' if m['margin_pct'] is not None else 'n/a'):>10}   {flag}")

    # 3. Estimate vs actual for a job that was built.
    v = reports.variance(conn, "Q-2025-018")
    rule(f"VARIANCE  ·  {v['number']} (estimate vs actual, from the production log)")
    print(f"  {'Station':<16}{'Est hrs':>9}{'Act hrs':>9}{'Delta':>9}")
    for s in v["stations"]:
        mark = "  <-- overrun" if s["hours_delta"] >= 1 else ""
        print(f"  {s['station']:<16}{s['est_hours']:>9}{s['actual_hours']:>9}{s['hours_delta']:>9}{mark}")
    print(f"\n  material   est {money(v['material_est'])}   actual {money(v['material_actual'])}")
    print(f"  cost       est {money(v['est_cost'])}   actual {money(v['actual_cost'])}   (delta {money(v['cost_delta'])})")
    print(f"  margin     est {money(v['margin_est'])}   actual {money(v['margin_actual'])}")
    print(f"\n  Read: the quote looked fine; welding ran over, so the real margin was")
    print(f"  {money(v['margin_actual'])}, not {money(v['margin_est'])}. Nobody could see that before.")

    if p["flags"]:
        rule("ENGINE FLAGS (surfaced, not silently dropped)")
        for f in p["flags"]:
            print("  - " + f)

    conn.close()


if __name__ == "__main__":
    main()
