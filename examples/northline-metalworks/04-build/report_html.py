"""
Render a single, self-contained HTML view of what Northline now sees: a priced quote, margins
across every quote (with the hand-override flagged), and estimate-vs-actual for a built job.

Writes ../05-results/report.html. Run after run_demo.py has built the database:
    python3 report_html.py
"""
import html
import pathlib

import db
import engine
import reports

OUT = pathlib.Path(__file__).parent.parent / "05-results" / "report.html"


def money(x):
    return "n/a" if x is None else f"${x:,.2f}"


def main():
    conn = db.connect()
    q = engine.price_quote(conn, "Q-2025-018")
    mgn = reports.margins(conn)
    var = reports.variance(conn, "Q-2025-018")
    conn.close()

    quote_rows = "".join(
        f"<tr><td>{html.escape(l['station'])}</td><td class='n'>{l['hours']}</td>"
        f"<td class='n'>{money(l['labor'])}</td><td class='n'>{money(l['overhead'])}</td></tr>"
        for l in q["labor_lines"]
    )

    margin_rows = ""
    for m in mgn:
        flagged = m["override_delta"] is not None and abs(m["override_delta"]) >= 1
        cls = " class='flag'" if flagged else ""
        note = f"hand-set, {m['override_delta']:+.2f} vs engine" if flagged else ""
        margin_rows += (
            f"<tr{cls}><td>{m['number']}</td><td class='n'>{money(m['est_cost'])}</td>"
            f"<td class='n'>{money(m['recorded_sell'])}</td><td class='n'>{money(m['margin'])}</td>"
            f"<td class='n'>{m['margin_pct']}%</td><td class='muted'>{note}</td></tr>"
        )

    var_rows = ""
    for s in var["stations"]:
        over = s["hours_delta"] >= 1
        cls = " class='flag'" if over else ""
        var_rows += (
            f"<tr{cls}><td>{html.escape(s['station'])}</td><td class='n'>{s['est_hours']}</td>"
            f"<td class='n'>{s['actual_hours']}</td><td class='n'>{s['hours_delta']:+}</td>"
            f"<td class='muted'>{'overrun' if over else ''}</td></tr>"
        )

    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Northline Metalworks · Operations (sandbox)</title>
<style>
  :root {{ --ink:#1d1b16; --soft:#5c574d; --rule:#e3ddd1; --paper:#faf7f0; --accent:#b4470f; --flag:#fbeee6; }}
  * {{ box-sizing:border-box; }}
  body {{ font-family:'Iowan Old Style','Palatino',Georgia,serif; color:var(--ink); background:#f3efe6; margin:0; padding:32px; }}
  .wrap {{ max-width:820px; margin:0 auto; }}
  .card {{ background:var(--paper); border:1px solid var(--rule); border-top:3px solid var(--accent); padding:22px 26px; margin-bottom:22px; }}
  h1 {{ font-size:22px; margin:0; letter-spacing:-.01em; }}
  .sub {{ color:var(--soft); font-size:14px; margin:4px 0 0; }}
  h2 {{ font-size:13px; text-transform:uppercase; letter-spacing:.08em; color:var(--soft);
        font-family:'IBM Plex Mono',ui-monospace,monospace; margin:0 0 12px; }}
  table {{ width:100%; border-collapse:collapse; font-size:15px; }}
  th,td {{ text-align:left; padding:7px 10px; border-bottom:1px solid var(--rule); }}
  th {{ font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:11px; text-transform:uppercase;
        letter-spacing:.05em; color:var(--soft); font-weight:600; }}
  td.n {{ font-variant-numeric:tabular-nums; text-align:right; font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:14px; }}
  td.muted {{ color:var(--soft); font-size:13px; }}
  tr.flag td {{ background:var(--flag); }}
  .totals {{ display:flex; gap:26px; margin-top:14px; flex-wrap:wrap; }}
  .totals div {{ font-size:14px; }} .totals b {{ font-family:'IBM Plex Mono',monospace; }}
  .read {{ background:var(--flag); border-left:3px solid var(--accent); padding:10px 14px; margin-top:14px; font-size:14px; }}
  .tag {{ display:inline-block; background:#ede7db; color:var(--soft); font-size:11px; padding:2px 8px;
          border-radius:3px; font-family:'IBM Plex Mono',monospace; margin-left:8px; }}
</style></head><body><div class="wrap">

  <div class="card">
    <h1>Northline Metalworks <span class="tag">sandbox demo · synthetic data</span></h1>
    <p class="sub">One relational source of truth, built from six spreadsheets. Every price runs through one engine.</p>
  </div>

  <div class="card">
    <h2>Quote {q['number']} · priced by the engine</h2>
    <p class="sub" style="margin-bottom:12px">{html.escape(q['description'])}</p>
    <table><thead><tr><th>Station</th><th style="text-align:right">Hours</th><th style="text-align:right">Labor</th><th style="text-align:right">Overhead</th></tr></thead>
    <tbody>{quote_rows}</tbody></table>
    <div class="totals">
      <div>Material <b>{money(q['material'])}</b></div>
      <div>Labor <b>{money(q['labor'])}</b></div>
      <div>Overhead <b>{money(q['overhead'])}</b></div>
      <div>Subtotal <b>{money(q['subtotal'])}</b></div>
      <div>Markup <b>{int(q['markup']*100)}%</b></div>
      <div>Sell <b>{money(q['computed_sell'])}</b></div>
    </div>
  </div>

  <div class="card">
    <h2>Margins · every quote through the one engine</h2>
    <table><thead><tr><th>Quote</th><th style="text-align:right">Est cost</th><th style="text-align:right">Sell</th>
      <th style="text-align:right">Margin</th><th style="text-align:right">Margin %</th><th>Flag</th></tr></thead>
    <tbody>{margin_rows}</tbody></table>
  </div>

  <div class="card">
    <h2>Estimate vs actual · {var['number']} (from the production log)</h2>
    <table><thead><tr><th>Station</th><th style="text-align:right">Est hrs</th><th style="text-align:right">Act hrs</th>
      <th style="text-align:right">Delta</th><th></th></tr></thead>
    <tbody>{var_rows}</tbody></table>
    <div class="totals">
      <div>Cost est <b>{money(var['est_cost'])}</b></div>
      <div>Cost actual <b>{money(var['actual_cost'])}</b></div>
      <div>Margin est <b>{money(var['margin_est'])}</b></div>
      <div>Margin actual <b>{money(var['margin_actual'])}</b></div>
    </div>
    <div class="read">The quote looked fine. Welding ran over, so the real margin on this job was
      <b>{money(var['margin_actual'])}</b>, not <b>{money(var['margin_est'])}</b>. Before, nobody could see that.</div>
  </div>

</div></body></html>"""

    OUT.write_text(doc)
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
