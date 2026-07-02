/**
 * blueprint-model: the deterministic engine behind the Operations Blueprint generator.
 *
 * A small custom manufacturer answers ten questions and gets a tailored, foundation-first
 * implementation plan, technical enough to brief a person OR an AI coding agent who is
 * actually building the system. Pure functions, no side effects, no LLM. Shared by BOTH
 * the component's server render (the static/no-JS default) and the client <script> (live
 * regenerate) so there is one source of truth and no drift.
 *
 * Everything here is GENERIC methodology, codified. No company, client, vendor, SKU, or
 * real cost is referenced. This module is intended to become an open (MIT) package.
 */
import { buildSchema } from './schema-model';

export type Product = 'general' | 'furniture' | 'metalfab' | 'cabinets' | 'signage' | 'other';
export type Variation = 'catalog' | 'configurable' | 'custom';
export type CurrentState = 'paper' | 'spreadsheets' | 'software';
export type Team = 'solo' | 'small' | 'larger';
export type Priority = 'quoting' | 'production' | 'catalog' | 'cost';
export type Install = 'none' | 'delivery' | 'install';
export type Inventory = 'perjob' | 'stock' | 'managed';
export type SalesChannel = 'direct' | 'dealers' | 'online';
export type OrderPattern = 'oneoffs' | 'repeat' | 'runs';

export interface BlueprintInput {
  product: Product;
  variation: Variation;
  cuts: boolean;
  state: CurrentState;
  team: Team;
  priority: Priority;
  install: Install;
  inventory: Inventory;
  salesChannel: SalesChannel;
  orderPattern: OrderPattern;
}

export const DEFAULT_INPUT: BlueprintInput = {
  product: 'general',
  variation: 'configurable',
  cuts: true,
  state: 'spreadsheets',
  team: 'small',
  priority: 'quoting',
  install: 'delivery',
  inventory: 'stock',
  salesChannel: 'direct',
  orderPattern: 'repeat',
};

// ── Option labels (drive the form selects + the read/parse on the client) ──
// Generic option leads; cabinets stays in the list but is not the default.
export const PRODUCTS: Record<Product, { label: string; noun: string }> = {
  general: { label: 'Custom / made-to-order products', noun: 'product' },
  furniture: { label: 'Furniture / millwork', noun: 'piece' },
  metalfab: { label: 'Metal fabrication', noun: 'part' },
  cabinets: { label: 'Cabinets / casework', noun: 'cabinet' },
  signage: { label: 'Signage / displays', noun: 'sign' },
  other: { label: 'Other custom product', noun: 'product' },
};
export const VARIATIONS: Record<Variation, { label: string }> = {
  catalog: { label: 'Mostly standard catalog items' },
  configurable: { label: 'Configurable / parametric' },
  custom: { label: 'Fully custom per order' },
};
export const CUTS: Record<'yes' | 'no', { label: string }> = {
  yes: { label: 'Yes, we cut/machine material to size' },
  no: { label: 'No, we assemble bought-to-size parts' },
};
export const STATES: Record<CurrentState, { label: string }> = {
  paper: { label: 'Paper, or nothing yet' },
  spreadsheets: { label: 'Spreadsheets' },
  software: { label: 'Some software already' },
};
export const TEAMS: Record<Team, { label: string }> = {
  solo: { label: 'Just me' },
  small: { label: '2 to 10 people' },
  larger: { label: '10+ people' },
};
export const PRIORITIES: Record<Priority, { label: string }> = {
  quoting: { label: 'Accurate quoting' },
  production: { label: 'Production and scheduling' },
  catalog: { label: 'Keeping catalog and pricing current' },
  cost: { label: 'Knowing true cost' },
};
export const INSTALLS: Record<Install, { label: string }> = {
  none: { label: 'Customer collects, or we ship' },
  delivery: { label: 'We deliver' },
  install: { label: 'We deliver and install on site' },
};
export const INVENTORIES: Record<Inventory, { label: string }> = {
  perjob: { label: 'Buy materials per job' },
  stock: { label: 'Keep and track stock' },
  managed: { label: 'Stock with reorder points' },
};
export const SALES_CHANNELS: Record<SalesChannel, { label: string }> = {
  direct: { label: 'Direct (B2B / retail)' },
  dealers: { label: 'Through dealers / distributors' },
  online: { label: 'Online / direct to customer' },
};
export const ORDER_PATTERNS: Record<OrderPattern, { label: string }> = {
  oneoffs: { label: 'Mostly one-offs' },
  repeat: { label: 'Repeat batches' },
  runs: { label: 'Production runs' },
};

// ── Output shape ──
export type Block =
  | { kind: 'prose'; text: string }
  | { kind: 'subhead'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'links'; items: { label: string; href: string; external?: boolean }[] }
  | { kind: 'callout'; text: string };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Blueprint {
  intro: string;
  sections: Section[];
}

// ── Section 1: Foundation + relational data model ──
function foundation(i: BlueprintInput, noun: string): Section {
  const startNote: Record<CurrentState, string> = {
    paper: 'You are starting clean, which is an advantage: you can model the data correctly the first time, with no bad structure to unwind.',
    spreadsheets: 'Your data already lives in spreadsheets. The job is to turn those columns into a related model, with one canonical row per thing referenced by id, so nothing is duplicated and everything can be joined.',
    software: 'You already run some software. The job is to make one relational source of truth and let every surface derive from it, rather than syncing tools that each hold a partial copy.',
  };

  // The schema is built once, typed, in schema-model.ts; the display rows derive from it so
  // the on-page table and the exported db/schema.sql can never disagree.
  const rows: string[][] = buildSchema(i, noun).map((t) => [
    t.name,
    t.columns.map((c) => c.name).join(', '),
    t.note,
  ]);

  return {
    id: 'foundation',
    title: '1. Foundation: the relational data model',
    blocks: [
      { kind: 'prose', text: `Start here, because nothing above this layer holds if this layer is shaky. ${startNote[i.state]}` },
      {
        kind: 'prose',
        text: `Decompose your ${noun} to its atoms (every material, labor step, unit of time and overhead) and model it as related tables, not a pile of documents. Once the product is honest, joinable data, pricing, quoting, scheduling, and the customer-facing side all become functions of that data.`,
      },
      { kind: 'subhead', text: 'A schema to start from' },
      { kind: 'table', headers: ['Table', 'Key fields', 'Relationships'], rows },
      {
        kind: 'prose',
        text: 'The spine runs materials → bom_lines → products → quote_lines → quotes → projects → clients. Cost rolls up the left side; sales roll down the right; production_actuals close the loop back onto your estimates so the system corrects itself over time.',
      },
      ...(i.variation !== 'catalog'
        ? [
            {
              kind: 'prose' as const,
              text: `Because your ${noun}s are configured or custom, a quote line is not always a catalog item: it can be an assembly built for that job from its own materials and operations. Let a quote line reference either a defined product or a per-quote assembly, and price both the same way through the engine.`,
            },
          ]
        : []),
      {
        kind: 'callout',
        text: 'Decompose before you automate. Every table above earns its place by being referenced. If something is just a document nobody joins to, it is a file, not data, and it will quietly drift out of date.',
      },
    ],
  };
}

// ── Section 2: Process, SOPs, production intelligence ──
function process(i: BlueprintInput, noun: string): Section {
  const sop =
    i.team === 'solo'
      ? 'Write each procedure as a short doc kept beside the work (and beside your AI agent), so a cold start is never actually cold.'
      : 'Write one SOP per role and name the owner of each table. The rule: every record has exactly one source of truth and one person accountable for it.';
  const blocks: Block[] = [
    {
      kind: 'prose',
      text: 'Map what actually happens on the floor, workarounds included, not the idealized version. You cannot optimize a process you have not honestly described.',
    },
    { kind: 'subhead', text: 'Operations and routing' },
    {
      kind: 'prose',
      text: `Model each operation (cut, machine, assemble, finish, pack) as a labor_ops row with a station, a std_minutes, and a rate. A ${noun}'s routing is its ordered list of operations, and labor cost is simply the sum of std_minutes times rate across that routing. Measure those times once, honestly; they are where estimates usually go wrong.`,
    },
    { kind: 'subhead', text: 'The feedback loop (what makes it intelligent)' },
    {
      kind: 'prose',
      text: 'For every job, capture production_actuals: material actually consumed and time actually taken. Compare to the estimate. That variance is the most valuable data you produce, because it tells you whether the gap was a pricing error, a process problem, or a stale standard time, and which one. Feed it back into labor_ops and the next quote.',
    },
    { kind: 'list', items: [sop] },
  ];
  if (i.install !== 'none') {
    blocks.push({
      kind: 'prose',
      text: 'Because you handle delivery or install, add a site SOP: a pre-site checklist, what gets verified on arrival, and a path for site changes to flow back into the project record instead of living in someone’s memory.',
    });
  }
  blocks.push({
    kind: 'prose',
    text: 'Watch the seams between phases, which is where most failures happen (a spec changes after a quote is sent). For each handoff, decide what data moves forward, how you verify it arrived, and what happens when an upstream value changes after the fact.',
  });
  return { id: 'process', title: '2. Process, SOPs, and the feedback loop', blocks };
}

// ── Section 3: Files, data, stack ──
function files(i: BlueprintInput): Section {
  const store: Record<Team, string> = {
    solo: 'Run Postgres locally or on one small server, a single API service in front of it, and a backup you have actually tested by restoring it.',
    small: 'One shared Postgres instance, the API in front of it, and a shared document area (a file server or a Google Drive) referenced by id from the database so nothing important lives in two places. Access by role.',
    larger: 'A managed or replicated Postgres, the API with real auth and roles, and a proper object store. Define who can write each table and keep exactly one canonical copy. Sync is where multi-user systems quietly rot, so design it deliberately.',
  };
  return {
    id: 'files',
    title: '3. Files, data, and the shape of the system',
    blocks: [
      {
        kind: 'prose',
        text: 'Everything resolves to one source of truth. A relational database (Postgres) is the core. A small backend service (an API) is the only thing that writes to it, so every surface (internal tools, a customer view, reports) goes through the same logic and cannot drift. Documents (drawings, PDFs) live in a file or object store, referenced by id from the database, never treated as the source of truth themselves.',
      },
      { kind: 'list', items: [store[i.team]] },
      {
        kind: 'prose',
        text: 'Keep a predictable repository layout, one area per domain (products, materials, projects, quotes, docs), and give each folder a short context file describing what it is and its conventions, so any teammate or AI coding agent is immediately productive there instead of starting cold.',
      },
    ],
  };
}

// ── Section 4: Build action items (technical, dependency-ordered) ──
function build(i: BlueprintInput): Section {
  const engine =
    'Product-and-cost engine (build this first; everything depends on it). Tables: the product/template/spec, bom_lines, materials, labor_ops. Build a cost(product_ref, options) service that joins the product to its bom_lines (sum of material.cost_per_unit times qty) and to its routing (sum of labor_ops.std_minutes / 60 times rate_per_hr), then adds overhead and margin and writes an audit row on every price change. Every other surface calls this one function; nothing prices on its own. Decide once where overhead lives (inside a loaded labor rate or as its own line, never both) so it cannot be double-counted, and when a line cannot be priced (a material with no cost, an operation the model does not know) surface it rather than dropping it silently.';

  const C: Record<'quote' | 'cost' | 'production' | 'catalog', string> = {
    quote:
      'Quote builder. Tables: quotes, quote_lines (versioned). Endpoint POST /quotes that calls the engine per line for unit_price (applying a dealer tier discount where relevant), persists the lines, totals the quote, and returns it; GET /quotes/:id/pdf renders it. Internal and customer-facing quoting both go through the one engine, so they cannot disagree.',
    cost:
      'True-cost model. Derive each station rate_per_hr from (labor + overhead + machine cost) over available hours instead of typing it, and snapshot the computed cost onto the project when work completes, so historical cost does not move when current rates change. The engine reads the derived rate.',
    production:
      'Production capture and variance. Table: production_actuals. Capture material_used and time_used per job (import from the floor or enter), then a variance view that joins actuals to the estimate by operation and station (time_used vs std_minutes, material_used vs bom qty) and feeds corrections back into labor_ops.',
    catalog:
      'Catalog and document generation. A generator that reads products and materials at request time and renders the catalog and spec docs (GET /catalog, plus per-product spec sheets). Keep curated fields (descriptions) in their own columns so regeneration never overwrites them, and stamp provenance (source, as_of) on each derived field.',
  };
  const restOrder: Record<Priority, (keyof typeof C)[]> = {
    quoting: ['quote', 'cost', 'production', 'catalog'],
    production: ['production', 'cost', 'quote', 'catalog'],
    catalog: ['catalog', 'cost', 'quote', 'production'],
    cost: ['cost', 'production', 'quote', 'catalog'],
  };

  const steps: string[] = [engine];
  if (i.state !== 'paper') {
    steps.push(
      'Backfill from what you already have. Import your current spreadsheets into the schema in one pass: map each sheet to its table, normalize units and keys (ft vs foot, ea vs each) and dedupe, and keep anything that does not map cleanly in a notes column so nothing is lost. This is usually where the real mess surfaces; fix it in the data once, here.'
    );
  }
  if (i.cuts) {
    steps.push(
      'Cut and nesting optimizer. Input: cut_parts and stock_items. Logic: a bin-packing pass (for example MaxRects) that nests parts onto stock and returns yield, fed back into material cost so batch pricing reflects real offcut waste.'
    );
  }
  steps.push(...restOrder[i.priority].map((k) => C[k]));

  // Input-specific build items.
  if (i.inventory !== 'perjob') {
    steps.push(
      i.inventory === 'managed'
        ? 'Inventory and purchasing. Tables: inventory, reorder_rules, vendors. Decrement stock on consumption, and raise purchase suggestions automatically when on_hand crosses min_qty.'
        : 'Inventory tracking. Tables: inventory, vendors. Decrement stock on consumption so quoting and purchasing read real on-hand levels, not a guess.'
    );
  }
  if (i.install !== 'none') {
    steps.push(
      i.install === 'install'
        ? 'Delivery and install scheduling. Tables: deliveries, installs. A calendar/route view, capacity by crew, and a status flow from scheduled to done, tied back to the project.'
        : 'Delivery scheduling. Table: deliveries. A simple calendar and status flow tied to the project record.'
    );
  }
  if (i.salesChannel === 'dealers') {
    steps.push(
      'Dealer pricing and accounts. Tables: accounts, price_tiers. Apply tier discounts inside the engine, and add a dealer-facing view that shows price but hides cost.'
    );
  }
  if (i.salesChannel === 'online') {
    steps.push(
      'Public catalog and order intake. Table: catalog_items. A read-only public surface on the same engine, plus an order or quote-request flow that lands in projects.'
    );
  }
  if (i.orderPattern === 'runs') {
    steps.push(
      'Work orders and scheduling. Table: work_orders. Release runs to stations, track WIP, and derive basic capacity and a forecast from the pipeline.'
    );
  }

  return {
    id: 'build',
    title: `4. Build action items, ordered for your priority (${PRIORITIES[i.priority].label.toLowerCase()})`,
    blocks: [
      {
        kind: 'prose',
        text: 'Build incrementally, one deployable piece at a time, so the system keeps working for the people who use it while you are still changing it. Each item below names the tables and logic it needs and assumes the ones above it exist.',
      },
      { kind: 'steps', items: steps },
      { kind: 'subhead', text: 'What to log, at field level' },
      {
        kind: 'prose',
        text: 'In order: materials (cost_per_unit, unit), labor_ops (std_minutes, rate_per_hr), the bom_lines that bind them to products, then quote_lines and quotes, then production_actuals (material_used, time_used). Each layer is only as trustworthy as the one beneath it.',
      },
    ],
  };
}

// ── Section 5: Tooling ──
function tooling(): Section {
  return {
    id: 'tooling',
    title: '5. Tooling: a self-hostable stack',
    blocks: [
      {
        kind: 'prose',
        text: 'A stack a small shop can actually run, open and free to start. You do not need all of it on day one; add pieces as the layers above demand them.',
      },
      {
        kind: 'list',
        items: [
          'Postgres: the relational core and single source of truth.',
          'A backend service (Python/FastAPI or Node) as the only writer to the database, so every surface shares one set of logic.',
          'Docker: run every piece the same way on any machine, dev or production.',
          'A queue and cache (Redis) once you have background work like document generation or imports.',
          'A vector store (Qdrant) when you add the knowledge layer: semantic search over SOPs and specs.',
          'n8n: low-code automation for the glue (scheduled jobs, notifications, syncs).',
          'nginx: a reverse proxy in front of the API and any UI.',
        ],
      },
      { kind: 'subhead', text: 'Hosting and access' },
      {
        kind: 'prose',
        text: 'For internal-only use, one small server is enough. When people need it off-site (a quote at a client, a status check on a phone), put the API behind Cloudflare (a tunnel plus access control) and a domain, so you expose it safely without opening your network.',
      },
      { kind: 'subhead', text: 'Build it with an agent' },
      {
        kind: 'prose',
        text: 'This plan is written to double as context for an AI coding agent. Hand it the blueprint plus a per-folder context file, and build one deployable piece at a time, reading every change before it lands. The hard part is not writing the code; it is keeping the system correct while real people depend on it.',
      },
      {
        kind: 'links',
        items: [
          { label: 'PostgreSQL docs', href: 'https://www.postgresql.org/docs/' },
          { label: 'Docker docs', href: 'https://docs.docker.com/' },
          { label: 'FastAPI', href: 'https://fastapi.tiangolo.com/' },
          { label: 'Qdrant', href: 'https://qdrant.tech/documentation/' },
          { label: 'n8n', href: 'https://docs.n8n.io/' },
          { label: 'Cloudflare Tunnel', href: 'https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/' },
        ],
      },
    ],
  };
}

// ── Section 6: The AI integrator ──
function integrator(i: BlueprintInput): Section {
  const whoTeam: Record<Team, string> = {
    solo: 'On a one-person shop this role is you: the same person who knows the product structures the data and directs the agents that build the system.',
    small: 'On a small team, one person should own this end to end. It need not be a career developer; it needs someone who can think in data and direct AI agents.',
    larger: 'On a larger team, name a single owner for this. It is a real role, not a side task, and split ownership is how the source of truth goes fuzzy.',
  };

  const analyses: string[] = [
    'Pricing is a join, and that join is your quote engine: product to bom_lines to materials for material cost, product to routing to labor_ops for labor, plus overhead and margin. Build it once; everything prices through it.',
    'A contract is not a new document, it is a locked, versioned snapshot of priced quote_lines plus terms, generated from the same engine, so the contract can never disagree with the quote it came from.',
    'Time efficiency: group production_actuals by operation and station and compare time_used to std_minutes. The variance tells you which standard times are wrong and where the floor actually loses time.',
    'Material and vendor allocation: aggregate bom_lines across materials and vendors to see spend by material and by vendor, lead-time exposure, and where consolidating purchasing pays off.',
    'Margin and mix: roll cost and price up to product, client, and channel to see what actually makes money, not just what sells.',
  ];
  if (i.cuts) {
    analyses.push('Material yield: from the nesting pass, track utilization per job and per material, so batch pricing reflects real offcut waste and you can see which products nest badly.');
  }

  const docs: string[][] = [
    ['Quotation / estimate', 'On request, per project', 'quotes + quote_lines (engine)'],
    ['Contract', 'On win', 'locked quote snapshot + terms'],
    ['Spec sheet', 'Per product / order', 'product/spec + materials'],
    ['Work order', 'On release to the floor', i.orderPattern === 'runs' ? 'work_orders + routing' : 'projects + routing'],
    ['Invoice', 'On delivery / milestone', 'project + quote totals'],
  ];
  if (i.salesChannel === 'online') docs.push(['Public catalog', 'Continuously', 'catalog_items (engine-priced)']);
  if (i.salesChannel === 'dealers') docs.push(['Dealer price sheet', 'On price change', 'products + price_tiers']);
  if (i.cuts) docs.push(['Cut / nesting report', 'Per batch', 'cut_parts nested on stock_items']);
  docs.push(['Efficiency / time-study report', 'Weekly or per job', 'production_actuals vs labor_ops']);
  docs.push(['Material and vendor report', 'Monthly', 'bom_lines, materials, vendors']);
  if (i.install !== 'none') {
    docs.push(['Delivery / install sheet + site checklist', 'Per job', i.install === 'install' ? 'deliveries + installs' : 'deliveries']);
  }
  docs.push(['As-built / end-product record', 'On completion', 'project + actuals + final spec']);
  docs.push(['Customer requirements and conversation log', 'Ongoing', 'client + project notes']);
  docs.push(['Reviews and feedback', 'After delivery', 'client + project']);
  docs.push(['Change orders', 'On scope change', 'project + new quote version']);

  return {
    id: 'integrator',
    title: '6. The AI integrator: building and operating it',
    blocks: [
      {
        kind: 'prose',
        text: `Someone has to turn this data into running systems, and increasingly that someone is an "AI integrator": not necessarily a career developer, but a person who can structure data, build the systems and endpoints on top of it, and direct AI agents to do most of the building and the routine work. ${whoTeam[i.team]}`,
      },
      {
        kind: 'prose',
        text: 'The job is three moves: structure the data (sections 1 to 3), build the systems on it (section 4), then put an agent on every repetitive step so the laborious parts run themselves while you keep the judgment.',
      },
      { kind: 'subhead', text: 'Configure your agents' },
      {
        kind: 'prose',
        text: 'Work folder by folder. Give each part of the system (the engine, the quote service, the document generator, the knowledge base) its own directory with a short context file, its own memory of decisions made, and the skills it repeats, so a fresh agent dropped in is immediately useful. You can run several agents at once across folders; you are the orchestrator, and the work is only ever as coordinated as you make it.',
      },
      {
        kind: 'links',
        items: [
          { label: 'Build the Expertise Into Each Folder', href: '/writing/build-the-expertise-into-each-folder', external: false },
          { label: 'Agentic Practice', href: '/practice', external: false },
        ],
      },
      { kind: 'subhead', text: 'Read and combine the data into answers' },
      {
        kind: 'prose',
        text: 'The tables are only worth building because of what you join them into. The patterns worth building first:',
      },
      { kind: 'list', items: analyses },
      { kind: 'subhead', text: 'The documents and reports to generate (from data, not by hand)' },
      { kind: 'table', headers: ['Document', 'When', 'Generated from'], rows: docs },
      { kind: 'subhead', text: 'Put AI on each step (with guardrails)' },
      {
        kind: 'prose',
        text: 'Give an agent read-scoped access to the database and a retrieval layer (vector search over your SOPs, specs, and past projects) so it answers in your context, not generically. Then hand it the repetitive steps: drafting a quote from a stated requirement, generating the documents above, summarizing a customer conversation into structured requirements on the project, producing the reports, and recommending a material or process from what worked before. A human approves anything that goes out the door.',
      },
      {
        kind: 'callout',
        text: 'Automate the laborious, keep the judgment. The goal is not to replace people; it is to let a small team run an operation that used to need a big one, by handing every repetitive document, report, and lookup to an agent that works from your real data.',
      },
    ],
  };
}

export function generateBlueprint(i: BlueprintInput): Blueprint {
  const p = PRODUCTS[i.product];
  const noun = p.noun;
  const intro = `A foundation-first plan for a ${p.label.toLowerCase()} operation. It rests on one idea: once you decompose your ${noun} into honest, relational data, the things above it (pricing, quoting, scheduling, sales) become outputs of that data rather than work you do by hand. The foundation and data sections are for you, the owner; the build, tooling, and integrator sections are for whoever implements it, whether that is you, a team member, or an AI agent you direct. Build it in the order below; each layer assumes the one before it is solid.`;
  return {
    intro,
    sections: [foundation(i, noun), process(i, noun), files(i), build(i), tooling(), integrator(i)],
  };
}
