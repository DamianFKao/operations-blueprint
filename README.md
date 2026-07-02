# Operations Blueprint

Turn a small custom manufacturer's answers into a tailored, foundation-first operations plan, and a
runnable starter repo an AI coding agent (or a person) can build from. Deterministic: no LLM, no network,
no company data. The same engine that powers the tool at
[damiankao.com/blueprint](https://damiankao.com/blueprint).

Most operations software assumes you are large: a budget, an IT team, clean data already in a warehouse.
Small manufacturers have none of that. This gives them the opposite: a plan built around what they
actually have, starting from the one thing everything else depends on, honest, relational product data.

## What it produces

From ten answers about a shop (what you make, how it varies, whether you cut material, how you sell,
whether you keep stock, and so on) the engine generates:

- **A plan** (`generateBlueprint`) rendered as HTML or Markdown: the relational data model, the process and
  SOPs, the build order, a self-hostable tooling list, and notes for whoever implements it.
- **A starter repo** (`buildExport`): a tailored project you can hand to a coding agent, a real Postgres
  `schema.sql`, a FastAPI skeleton with the cost engine and quote endpoint stubbed, `AGENTS.md`, `TASKS.md`,
  per-folder context, and a compose file.

Both are tailored to the answers: a configurable metal-fab shop gets a different schema, build order, and
scaffold than a catalog sign shop.

## Use it

```ts
import { generateBlueprint, renderBlueprintMarkdown, buildExport } from 'operations-blueprint';

const answers = {
  product: 'metalfab',
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

// the human-readable plan
console.log(renderBlueprintMarkdown(generateBlueprint(answers)));

// the starter repo, as a flat list of { path, content } files to write to disk
for (const file of buildExport(answers)) {
  // fs.writeFileSync(...)
}
```

See `src/blueprint-model.ts` for the full set of answer options (`PRODUCTS`, `VARIATIONS`, and the rest).

## Try it

```
npm install
npm run example      # writes a sample starter repo to examples/output/ and prints the plan
```

## Examples

`examples/northline-metalworks/` is a full worked example: a fictional seven-person steel fabrication shop,
run end to end. It contains the shop's (synthetic) spreadsheets, the blueprint and starter repo the engine
produced for it, a working vertical slice built from that export, the outputs, and the lessons that fed
back into this tool. Everything there is invented for demonstration; nothing is from any real company.

## Method

This applies the Manufacturing Intelligence Framework, documented at
[damiankao.com/framework](https://damiankao.com/framework). It does not replace established
operations-engineering discipline (Lean, Six Sigma, continuous improvement); it supplies the measurement
foundation those methods assume and a small shop rarely has.

## License

MIT. See `LICENSE`.
