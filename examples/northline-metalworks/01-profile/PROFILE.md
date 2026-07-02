# Northline Metalworks (sample shop #1)

Fictional. Invented for demonstration; not any real company.

## The shop
Northline Metalworks is a seven-person job shop in a Midwest metro that builds steel storage products to order:
boltless and welded shelving, light pallet racking, mezzanine parts, and a steady stream of one-off fabrication
(railings, brackets, carts, weldments). Most work is configurable to a customer's size, gauge, and load rating;
some is fully custom off a sketch or a drawing.

People: an owner who also does the estimating and most of the customer contact, a shop lead, four
fabricators/welders, and one person in the office who runs the books and scheduling. Steel is cut, formed on a
press brake, welded, ground and finished, powder-coated in a small in-house booth, assembled, and delivered on
the shop's own truck within a few hours' drive.

They quote a lot and win maybe a third of it. The owner is the bottleneck: nothing gets priced without him.

## How they run today
QuickBooks for invoicing and the books, and a stack of Excel workbooks for everything the books cannot do: a
materials price list, a labor and overhead rate calc, a quote template that gets copied for every job, cut lists,
and a customer list. The shop floor runs on paper travelers and a whiteboard. See `before-state.md`.

## The ten blueprint answers (a realistic "average")
| Question | Answer | Why |
| --- | --- | --- |
| What you make | Metal fabrication | steel shelving, racking, misc fab |
| Product variation | Configurable / parametric | sized to load and space; some fully custom |
| Cut material to size | Yes | steel cut and formed from stock |
| Where you are now | Spreadsheets | Excel + QuickBooks, paper on the floor |
| Team size | 2 to 10 | seven people |
| Biggest priority | Accurate quoting | the owner is the estimating bottleneck |
| Delivery and install | We deliver | own truck, local radius |
| Materials and stock | Keep and track stock | common steel kept on hand |
| How you sell | Direct (B2B) | contractors, warehouses, local businesses |
| Order pattern | Repeat batches | re-runs of shelving and racking plus one-offs |

These are recorded as JSON in `../03-blueprint/answers.json` for Phase 2.

## What hurts (why this shop is worth modeling)
- Quoting is slow and inconsistent. Every quote is a fresh copy of a template; prices drift; only the owner can
  do it.
- Everything is entered three times: materials in the price sheet, again in each quote, again in QuickBooks.
- No line from a quote to what the job actually cost. They can feel that some jobs lose money; they cannot point
  to which, or why.
- When steel prices jump, updating the template and the open quotes is all manual.
- The cut list lives apart from the quote, so real scrap and yield never make it into the price.

These are the exact gaps the blueprint's spine closes: one price engine, one source of truth, and a feedback loop
from actuals back onto estimates.
