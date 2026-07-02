# Before state: how Northline runs on spreadsheets

Northline is a textbook version of where most small manufacturers actually are. Around 54% of plants still run on
paper and spreadsheets, and roughly 83% of small and mid-size manufacturers use Excel for core functions.
QuickBooks keeps the books, but it does not understand turning materials into products: when you "build"
something it just adjusts inventory counts, with no link between the steel that went in and the shelf that came
out, and no labor or overhead tied to a job. So shops keep a second life in Excel and re-enter everything by hand.

Here is Northline's second life, workbook by workbook. These are the files generated in `../02-source-data`.

### materials-price-list.xlsx
The owner's running list of steel, hardware, and finish, with a cost per unit and a vendor. He updates a cell
when a supplier invoice comes in higher, which means the number is right the day he touches it and slowly wrong
after. Units are inconsistent (`ft` vs `foot`, `ea` vs `each`), and there is a "misc / shop supplies" line that
absorbs everything nobody wants to itemize.

### labor-rates.xlsx
A small calc where each station (saw, brake, weld, grind, powder coat, assembly, delivery) has a labor rate plus
a fixed and a variable overhead adder, summing to a shop rate per hour. It was set "sometime last year" and has
not moved since, even though wages and power have.

### job-quotes-2025.xlsx
The quote template, copied per job. A summary log plus a couple of detailed sheets with line items: parts,
material cost, hours by station times the shop rate, an overhead line, and a markup to a sell price. One quote
has a sell price typed straight over the formula because the owner "knew the number," which is exactly how
pricing logic quietly rots.

### cut-lists.xlsx
The parts and lengths for a couple of jobs, written for the saw. It lives entirely apart from the quote, so the
offcut and scrap it implies never reach the price.

### customers.xlsx
Names, contacts, terms, and notes. The CRM is a spreadsheet and the owner's memory.

### production-log.xlsx
Hand-logged hours and material actually used on a few jobs. This is the most valuable and least used file in the
shop: it is the only place estimate meets reality, and nobody compares the two. On at least one job welding ran
well over the estimate, which is why that job felt tight and no one could say why.

The thread through all of it: the same facts live in several files and again in QuickBooks, nothing joins, and
the one comparison that would make the shop smarter (estimate vs actual) never happens. That is what the
blueprint's system fixes.
