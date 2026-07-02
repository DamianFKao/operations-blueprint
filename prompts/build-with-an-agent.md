# Build with an agent

Open Claude Code or Cursor in the folder of an exported starter repo (the `operations-system` folder the blueprint tool produces), then paste the prompt below as your first message.

```text
You are building a small manufacturing operations system from this starter repo.

Read AGENTS.md first, then db/schema.sql, then TASKS.md. AGENTS.md is the
operating manual: its golden rules are hard constraints and its build order is
the plan. Work inside this scaffold; do not rescaffold or restructure it.

Work through TASKS.md top to bottom, one slice at a time. Build a slice, run
it, show me the output, and wait for my go-ahead before starting the next one.
Keep each change small enough that I can read all of it.

The first slice is the product-and-cost engine. Every price in the system must
come from that one function. If any surface starts computing a price on its
own, stop and route it through the engine.

When you reach the backfill step (importing my existing spreadsheets), ask me
for the real files then; do not invent placeholder data for them. Map each
sheet to its target table before writing any import code, and show me every
row that does not map cleanly instead of dropping it.

Before we trust the engine, verify the first quote by hand: pick one quote,
walk me through computing it manually from the source data, and compare. The
engine and the hand calculation must match to the cent; if they do not, find
the modeling error before building anything else.

If an answer from me would change what you build, ask before building it.
```
