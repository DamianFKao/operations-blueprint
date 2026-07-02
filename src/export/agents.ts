/**
 * agents: AGENTS.md (the operating manual for the coding agent) and TASKS.md (the build
 * checklist). Both derive from the generated Blueprint so they stay in step with the plan.
 */
import type { Blueprint } from '../blueprint-model';

function buildSteps(bp: Blueprint): string[] {
  const section = bp.sections.find((s) => s.id === 'build');
  const block = section?.blocks.find((b) => b.kind === 'steps');
  return block && block.kind === 'steps' ? block.items : [];
}

export function agentsMd(bp: Blueprint): string {
  const steps = buildSteps(bp)
    .map((s, idx) => `${idx + 1}. ${s}`)
    .join('\n');

  return (
    '# AGENTS.md\n\n' +
    'Operating manual for building this system. You are an AI coding agent. Read this file first,\n' +
    'then `db/schema.sql`, then `TASKS.md`. (This file also serves as CLAUDE.md / .cursorrules.)\n\n' +
    '## What you are building\n\n' +
    bp.intro +
    '\n\n' +
    '## Golden rules (do not break these)\n\n' +
    '- One source of truth: Postgres (`db/schema.sql`). Every fact lives in exactly one table.\n' +
    '- The API is the only writer to the database. Every surface goes through it.\n' +
    '- Everything prices through one function: `api/engine/cost.py`. No surface computes a price on its own.\n' +
    '- Decompose before you automate. If something is not joinable data, it is a file, not data.\n' +
    '- Build one deployable slice at a time, and run it before moving on. Read every change before it lands.\n\n' +
    '## Build order\n\n' +
    steps +
    '\n\n' +
    '## Conventions\n\n' +
    '- One folder per domain; each folder has a `CONTEXT.md` describing what it is and its rules. Keep them current.\n' +
    '- Migrations are forward-only; never edit a shipped migration.\n' +
    '- Generate documents (quotes, contracts, reports) from data at request time; never hand-maintain them.\n\n' +
    '## Guardrails\n\n' +
    '- A human approves anything that goes out the door (quotes, contracts, customer messages).\n' +
    '- Give any analysis or assistant agent read-scoped database access, not write access.\n\n' +
    '## How to run\n\n' +
    '1. Copy `.env.example` to `.env`.\n' +
    '2. `docker compose up` starts Postgres (loading `db/schema.sql`) and the API on :8000.\n' +
    '3. Confirm `http://localhost:8000/health`, then start filling `api/engine/cost.py` (the keystone).\n'
  );
}

export function tasksMd(bp: Blueprint): string {
  const steps = buildSteps(bp)
    .map((s) => `- [ ] ${s}`)
    .join('\n');

  return (
    '# TASKS\n\n' +
    'Work top to bottom. Each build task names the tables and logic it needs and assumes the ones above it exist.\n\n' +
    '## Setup\n\n' +
    '- [ ] Copy `.env.example` to `.env`\n' +
    '- [ ] `docker compose up` and confirm Postgres + the API are healthy\n' +
    '- [ ] Verify the tables from `db/schema.sql` exist\n\n' +
    '## Build\n\n' +
    steps +
    '\n'
  );
}
