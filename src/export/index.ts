/**
 * buildExport: turn a BlueprintInput into a tailored starter repo (a flat list of files).
 *
 * Pure and deterministic, shared with the client for the in-browser zip. Reuses the same
 * generateBlueprint() and buildSchema() as the on-page output, so the repo an agent gets and
 * the plan a person reads come from one source.
 */
import { PRODUCTS, generateBlueprint, type BlueprintInput } from '../blueprint-model';
import { buildSchema } from '../schema-model';
import { renderBlueprintMarkdown } from '../render';
import { renderBlueprintMap, renderBlueprintMermaid } from '../map';
import { schemaSql } from './sql';
import { skeletonFiles, type ExportFile } from './skeleton';
import { agentsMd, tasksMd } from './agents';
import { projectFiles } from './project';

export type { ExportFile };

export function buildExport(i: BlueprintInput): ExportFile[] {
  const noun = PRODUCTS[i.product].noun;
  const tables = buildSchema(i, noun);
  const bp = generateBlueprint(i);

  const files: ExportFile[] = [
    { path: 'db/schema.sql', content: schemaSql(tables) },
    { path: 'AGENTS.md', content: agentsMd(bp) },
    { path: 'TASKS.md', content: tasksMd(bp) },
    { path: 'docs/blueprint.md', content: renderBlueprintMarkdown(bp, { map: renderBlueprintMermaid(i) }) },
    { path: 'docs/map.svg', content: renderBlueprintMap(i, { palette: 'self-contained' }) },
    ...skeletonFiles(i),
    ...projectFiles(i, tables, bp),
  ];
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
