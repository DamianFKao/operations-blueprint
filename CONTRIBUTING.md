# Contributing

Thanks for looking at this. It is a small, deliberate codebase, and the rules below exist to keep it that way.

## Dev setup

```
npm install        # installs devDependencies and builds dist/ (via the prepare script)
npm test           # runs the test suite (Node's built-in test runner)
npm run example    # writes a sample starter repo to examples/output/ and prints the plan
```

There are no runtime dependencies, and that is intentional: the engine must run in the browser as-is. Node built-ins are fine in tests and scripts; nothing under `src/` may import them. If your change needs a new runtime dependency, open an issue first, because the answer is probably a different design.

Before you change anything under `src/` or `src/export/`, read the `CONTEXT.md` file in that folder. It lists the invariants your change must preserve, and [docs/how-it-works.md](docs/how-it-works.md) explains the design.

## The derived-outputs rule

Several files in this repository are outputs of the engine, not sources. Never hand-edit them:

- `db/schema.sql` in any export or example: it renders from `buildSchema` in `src/schema-model.ts`.
- The generated blueprint and starter repo under `examples/*/03-blueprint/`: regenerate them with the `regenerate.mjs` script beside them.
- Gallery files under `blueprints/`: regenerated from the engine.

If a derived file is wrong, the engine is wrong. Fix the engine (or the recorded answers) and regenerate, so the fix applies everywhere and the outputs stay reproducible.

## The synthetic-data rule

Every example in this repository is an invented shop. Northline Metalworks does not exist. Keep it that way: never contribute data, names, numbers, documents, or stories from a real company, client, or vendor, even anonymized ones. If you want to add a worked example, invent it from scratch and say so in its README. Contributions that appear to contain real operational data will be declined.

## Scope

In scope: custom and made-to-order manufacturing. Shops that quote, build, and deliver physical products, from one person to a few dozen. New answer options, better tailoring, better exports, more worked examples, and better docs all fit.

Out of scope, at least for now: paid features, LLM calls or any network dependency inside the engine, and service businesses (the model assumes a bill of materials and a routing; a business without those needs a different foundation). If you are unsure, open an issue before writing code.

## House style

- Plain prose. Write to the reader, in the second person where it is natural. Educational, not promotional.
- No em-dashes. Use periods, commas, colons, or parentheses.
- Generated output and docs stay generic: methodology, never anyone's actual data.

## Sending a change

1. Fork, branch, make the change.
2. Run `npm test` and make sure it passes. If you changed the engine, regenerate any derived outputs your change affects.
3. Open a pull request. The template asks what changed, why, and for confirmation that tests pass and no real company data is included.

Small, focused pull requests get reviewed quickly. Large ones get reviewed slowly, and sometimes not at all, so split them where you can.
