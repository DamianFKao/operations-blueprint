# Building an export with a coding agent

The export is designed to be handed to an AI coding agent (Claude Code, Cursor, or similar). The plan, the schema, and the stubs are the agent's briefing. This page is the workflow. A ready-to-paste kickoff prompt lives at [prompts/build-with-an-agent.md](../prompts/build-with-an-agent.md).

## What you are holding

An export is a small starter repo: `db/schema.sql` (the relational source of truth), a FastAPI skeleton with the two keystone pieces stubbed (`api/engine/cost.py` and `api/routes/quotes.py`), `AGENTS.md` (the agent's operating manual), `TASKS.md` (the build checklist), and `docs/blueprint.md` (the full plan). The stubs are deliberate: their docstrings describe exactly what to build, and the agent fills them in against the schema.

## The workflow

### 1. Generate the export

Use the tool in the browser at [damiankao.com/blueprint](https://damiankao.com/blueprint) and download the starter repo, or use the CLI in this repository:

```
node bin/operations-blueprint.mjs --list-options   # see every question and its valid values
node bin/operations-blueprint.mjs --product metalfab --variation configurable --cuts yes --out my-operation
```

The `--out` directory is your starter repo. (`npm run example` also writes a sample export to `examples/output/` if you just want to look at one.)

### 2. Open the folder with your agent

Open the exported folder as a project in Claude Code, Cursor, or whatever agent you use. `AGENTS.md` sits at the root on purpose: most agents read a root instructions file automatically, and it also serves as `CLAUDE.md` or `.cursorrules` content if your tool wants a specific filename.

### 3. Point the agent at AGENTS.md and TASKS.md

Tell the agent, in roughly these words: read `AGENTS.md` first, then `db/schema.sql`, then `TASKS.md`, and work through the tasks top to bottom. `AGENTS.md` carries the rules that matter (one source of truth, the API is the only writer, everything prices through one function). `TASKS.md` is the ordered checklist, tailored to your answers. The kickoff prompt in [prompts/build-with-an-agent.md](../prompts/build-with-an-agent.md) says this for you.

### 4. Get the shell running before building anything

Copy `.env.example` to `.env`, run `docker compose up`, and confirm `http://localhost:8000/health` responds. Postgres loads `db/schema.sql` on first boot. A running shell means every slice the agent builds can be exercised immediately, not just read.

### 5. Build one vertical slice at a time

Do not ask the agent to "build the system". Ask for one deployable slice, run it, read the changes, then move to the next. The order that works:

1. The cost engine first (`api/engine/cost.py`). Everything else prices through it, so nothing else is worth building until it returns a correct breakdown.
2. Then the quote endpoint (`POST /quotes` in `api/routes/quotes.py`), which calls the engine per line, persists a versioned quote, and totals it.
3. Then one report, such as the variance view that compares `production_actuals` to the estimates. One real report proves the joins work end to end.

After that, follow `TASKS.md` for the rest (inventory, deliveries, catalog, whatever your answers included). Each task names the tables and logic it needs and assumes the ones above it exist.

### 6. Hand-check one quote before you trust it

Before you rely on the engine, take one real product you know well and price it by hand: sum the material lines (cost per unit times quantity), sum the labor (standard minutes over sixty times the hourly rate), add overhead and margin. Then ask the system for the same quote and compare, line by line. If they disagree, one of them is wrong, and finding out which teaches you more about your data than anything else in this process. Do not skip this step. A quote engine that is quietly wrong is worse than a spreadsheet, because you will trust it.

## Guardrails worth keeping

These are in `AGENTS.md` too, but they bear repeating:

- Read every change before it lands. The agent does the typing; you keep the judgment.
- A human approves anything that goes out the door: quotes, contracts, customer messages.
- Any analysis or assistant agent gets read-scoped database access, never write access.
