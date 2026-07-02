#!/usr/bin/env node
/**
 * operations-blueprint CLI.
 *
 * Answer ten questions about a small custom manufacturing operation (via flags
 * or an answers.json file) and get a tailored operations plan on stdout, or a
 * full starter repo written with --out. Deterministic, no LLM, no dependencies
 * beyond Node built-ins. Option values and labels come straight from the
 * engine's option Records, so the CLI cannot drift from what the engine accepts.
 */

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

// ── Load the engine ──────────────────────────────────────────────────────────
let engine;
try {
  engine = await import('../dist/index.js');
} catch (err) {
  if (err && (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND')) {
    console.error('dist/ not built. Run npm install (which builds it) or npm run build.');
    process.exit(1);
  }
  throw err;
}

const {
  DEFAULT_INPUT,
  generateBlueprint,
  renderBlueprintMarkdown,
  renderBlueprintHTML,
  buildExport,
  PRODUCTS,
  VARIATIONS,
  CUTS,
  STATES,
  TEAMS,
  PRIORITIES,
  INSTALLS,
  INVENTORIES,
  SALES_CHANNELS,
  ORDER_PATTERNS,
} = engine;

// ── The ten questions ────────────────────────────────────────────────────────
// flag: the CLI flag name. field: the BlueprintInput field it sets.
// options: the engine Record that defines the valid values and their labels.
const QUESTIONS = [
  { flag: 'product',   field: 'product',      question: 'What do you make?',                        options: PRODUCTS },
  { flag: 'variation', field: 'variation',    question: 'How much does each order vary?',           options: VARIATIONS },
  { flag: 'cuts',      field: 'cuts',         question: 'Do you cut or machine material to size?',  options: CUTS },
  { flag: 'state',     field: 'state',        question: 'How do you run things today?',             options: STATES },
  { flag: 'team',      field: 'team',         question: 'How big is the team?',                     options: TEAMS },
  { flag: 'priority',  field: 'priority',     question: 'What hurts most right now?',               options: PRIORITIES },
  { flag: 'install',   field: 'install',      question: 'How do orders reach the customer?',        options: INSTALLS },
  { flag: 'inventory', field: 'inventory',    question: 'How do you handle materials?',             options: INVENTORIES },
  { flag: 'sales',     field: 'salesChannel', question: 'How do you sell?',                         options: SALES_CHANNELS },
  { flag: 'orders',    field: 'orderPattern', question: 'What does the order pattern look like?',   options: ORDER_PATTERNS },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function formatOptions(options, indent = '    ') {
  const keys = Object.keys(options);
  const width = Math.max(...keys.map((k) => k.length));
  return keys.map((k) => `${indent}${k.padEnd(width)}  ${options[k].label}`).join('\n');
}

function listOptions() {
  const parts = [];
  for (const q of QUESTIONS) {
    parts.push(`  --${q.flag}  ${q.question}`);
    parts.push(formatOptions(q.options));
    parts.push('');
  }
  return parts.join('\n').trimEnd();
}

function usage() {
  return `operations-blueprint: turn ten answers about a small custom manufacturing
operation into a tailored operations plan and a runnable starter repo.

Usage:
  node bin/operations-blueprint.mjs [flags]

Answer flags (see --list-options for the valid values):
  --product <value>     What you make
  --variation <value>   How much each order varies
  --cuts <yes|no>       Whether you cut or machine material to size
  --state <value>       How you run things today
  --team <value>        Team size
  --priority <value>    What hurts most right now
  --install <value>     How orders reach the customer
  --inventory <value>   How you handle materials
  --sales <value>       Sales channel
  --orders <value>      Order pattern

Other flags:
  --answers <file>      JSON file of answers (same fields as the flags, with
                        salesChannel/orderPattern field names and cuts as true/false)
  --out <dir>           Write the full starter repo into <dir>
                        (the directory must be new or empty; nothing is overwritten)
  --format <md|html>    Output format when printing to stdout (default: md;
                        ignored with --out, which always writes the repo files)
  --list-options        Print every question with its valid values and exit
  -h, --help            Show this help and exit

Any answer you do not give falls back to a sensible default. Individual flags
override the --answers file, which overrides the defaults.

Examples:
  # Print a plan (markdown) to stdout from a few flags
  node bin/operations-blueprint.mjs --product metalfab --variation configurable --cuts yes

  # Start from an answers file, override one answer
  node bin/operations-blueprint.mjs --answers answers.json --priority production

  # Write the full starter repo to a new directory
  node bin/operations-blueprint.mjs --answers answers.json --out my-operation

  # Print HTML instead of markdown
  node bin/operations-blueprint.mjs --format html > plan.html

  # See all ten questions and their valid values
  node bin/operations-blueprint.mjs --list-options`;
}

// ── Parse flags ──────────────────────────────────────────────────────────────
const flagSpec = {
  product: { type: 'string' },
  variation: { type: 'string' },
  cuts: { type: 'string' },
  state: { type: 'string' },
  team: { type: 'string' },
  priority: { type: 'string' },
  install: { type: 'string' },
  inventory: { type: 'string' },
  sales: { type: 'string' },
  orders: { type: 'string' },
  answers: { type: 'string' },
  out: { type: 'string' },
  format: { type: 'string' },
  'list-options': { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};

let values;
try {
  ({ values } = parseArgs({ options: flagSpec, strict: true, allowPositionals: false }));
} catch (err) {
  fail(`${err.message}\nRun with --help for usage.`);
}

// No arguments at all: print usage plus the full option list, exit 0.
if (process.argv.length <= 2) {
  console.log(usage());
  console.log('\nQuestions and valid values:\n');
  console.log(listOptions());
  process.exit(0);
}

if (values.help) {
  console.log(usage());
  process.exit(0);
}

if (values['list-options']) {
  console.log(listOptions());
  process.exit(0);
}

// ── Build the input: defaults, then answers file, then flags ─────────────────
const input = { ...DEFAULT_INPUT };
const byField = new Map(QUESTIONS.map((q) => [q.field, q]));

if (values.answers !== undefined) {
  let raw;
  try {
    raw = fs.readFileSync(values.answers, 'utf8');
  } catch (err) {
    fail(`Could not read answers file "${values.answers}": ${err.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    fail(`Could not parse "${values.answers}" as JSON: ${err.message}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    fail(`Answers file "${values.answers}" must be a JSON object of answers.`);
  }
  for (const [field, value] of Object.entries(parsed)) {
    const q = byField.get(field);
    if (!q) {
      fail(
        `Unknown field "${field}" in answers file "${values.answers}".\n` +
          `Valid fields: ${QUESTIONS.map((x) => x.field).join(', ')}`
      );
    }
    if (field === 'cuts') {
      if (typeof value !== 'boolean') {
        fail(`Invalid value for "cuts" in answers file "${values.answers}": ${JSON.stringify(value)}\nExpected true or false.`);
      }
      input.cuts = value;
      continue;
    }
    if (typeof value !== 'string' || !Object.keys(q.options).includes(value)) {
      fail(
        `Invalid value for "${field}" in answers file "${values.answers}": ${JSON.stringify(value)}\n` +
          `Valid values:\n${formatOptions(q.options)}`
      );
    }
    input[field] = value;
  }
}

for (const q of QUESTIONS) {
  const v = values[q.flag];
  if (v === undefined) continue;
  if (!Object.keys(q.options).includes(v)) {
    fail(`Invalid value for --${q.flag}: "${v}"\nValid values:\n${formatOptions(q.options)}`);
  }
  input[q.field] = q.field === 'cuts' ? v === 'yes' : v;
}

const format = values.format ?? 'md';
if (format !== 'md' && format !== 'html') {
  fail(`Invalid value for --format: "${format}"\nValid values:\n    md    Markdown\n    html  HTML`);
}

// ── Output: starter repo with --out, otherwise the rendered plan on stdout ───
if (values.out !== undefined) {
  const outDir = path.resolve(values.out);
  if (fs.existsSync(outDir)) {
    if (!fs.statSync(outDir).isDirectory()) {
      fail(`--out target "${outDir}" exists and is not a directory.`);
    }
    if (fs.readdirSync(outDir).length > 0) {
      fail(`--out target "${outDir}" is not empty. Pick a new or empty directory; the CLI does not overwrite existing files.`);
    }
  }
  const files = buildExport(input);
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of files) {
    const dest = path.join(outDir, f.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, f.content);
  }
  console.log(`Wrote ${files.length} files to ${outDir}`);
  for (const f of files) console.log(`  ${f.path}`);
} else {
  const bp = generateBlueprint(input);
  const out = format === 'html' ? renderBlueprintHTML(bp) : renderBlueprintMarkdown(bp);
  process.stdout.write(out.endsWith('\n') ? out : out + '\n');
}
