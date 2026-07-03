# Changelog

All notable changes to the Operations Blueprint are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions before 0.5.0 shipped through the browser tool at [damiankao.com/blueprint](https://damiankao.com/blueprint), which runs this same engine; they are recorded here so the history stays in one place.

## [0.6.0] - 2026-07-02

### Added

- The Blueprint Map: a hand-drawn overview of the generated plan, drawn from the same model as the text so the two cannot disagree. It appears above the plan on the site, ships as `docs/map.svg` in every export, is committed as `map.svg` for each gallery shop in `blueprints/`, and markdown plans embed the same map as a Mermaid diagram.
- Section ids on the rendered HTML sections (`id="bp-<section id>"`), so the map and anything else can deep-link into the plan.

The map is deterministic like everything else here: every stroke is seeded from its own shape key (no randomness, no clock), so the same answers always draw the same wobble, and toggling one answer never redraws the parts that did not change.

## [0.5.0] - 2026-07-02

### Added

- A command-line tool (`bin/operations-blueprint.mjs`): answer the ten questions with flags or an answers file, print the plan as markdown or HTML, or write the full starter repo to a directory.
- A test suite on the built-in Node test runner (determinism, schema tailoring, foreign-key integrity across all 104,976 input combinations, export completeness, build ordering, rendering, docs freshness, gallery freshness) and a CI workflow that runs it on Node 20 and 22.
- Docs: how the engine works, the ten answers reference, and a guide to building from an export with a coding agent, plus CONTEXT.md files in the source folders stating the invariants a change must preserve.
- Two Claude Code skills (v0.1), distilled from the Northline example: spreadsheet ingestion into the generated schema, and building the first vertical slice from an export. A ready-to-paste agent kickoff prompt ships alongside them in `prompts/`.
- A gallery of pre-generated blueprints for four invented shops in `blueprints/`, so you can read full plans and schemas without running anything.
- Contributing guide, code of conduct, and issue and pull request templates.

### Changed

- Links inside generated plans are now absolute, so they work on GitHub and on your own disk, not just on the website.

### Fixed

- The Northline example script now points at this repo's paths.

## [0.4.0] - 2026-06-30

### Changed

- Refined from a full test run on a sample shop: added a step for importing the spreadsheets you already have, so real data comes in first.
- Clarified that configurable and custom shops quote by building up an assembly, not by picking a finished product off a catalog.
- Tightened the cost engine guidance: apply overhead once, and surface any line it cannot price rather than dropping it silently.

The write-up behind this release: [running the blueprint on a made-up shop](https://damiankao.com/writing/running-the-blueprint-on-a-made-up-shop).

## [0.3.0] - 2026-06-30

### Added

- A downloadable starter repo. The plan now exports as a tailored project you can hand straight to a coding agent: a real database schema, a backend skeleton with the cost engine and quote endpoint stubbed out, build notes, and a compose file, all zipped in your browser.

### Changed

- Reworked the data model so the schema you see on the page and the schema in the export come from one source and cannot drift.

## [0.2.0] - 2026-06-29

### Added

- An "AI integrator" section (the role, configuring agents, and the documents and reports to generate) and a "Copy as Markdown" button.

### Changed

- Grew from six questions to ten (materials and stock, delivery and install, how you sell, and order pattern), so the plan fits more of how a shop actually runs.
- Went deeper and more technical: a relational schema with fields and relationships, dependency-ordered build steps, and a self-hostable tooling section.

## [0.1.0] - 2026-06-29

### Added

- First release. Answer a few questions about a small custom-manufacturing operation and get a tailored, foundation-first plan: the data model, the process and SOPs, and an ordered list of what to build.
