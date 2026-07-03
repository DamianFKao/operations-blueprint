// operations-blueprint: public API.
//
// A deterministic engine that turns ten answers about a small custom manufacturer into a tailored,
// foundation-first operations plan and a runnable starter repo. No LLM, no network, no company data.

export {
  generateBlueprint,
  DEFAULT_INPUT,
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
  type BlueprintInput,
  type Blueprint,
  type Section,
  type Block,
  type Product,
  type Variation,
  type CurrentState,
  type Team,
  type Priority,
  type Install,
  type Inventory,
  type SalesChannel,
  type OrderPattern,
} from './blueprint-model';
export { buildSchema, type SchemaTable, type Column } from './schema-model';
export { renderBlueprintHTML, renderBlueprintMarkdown } from './render';
export { buildExport, type ExportFile } from './export';
export {
  buildMapModel,
  renderBlueprintMap,
  renderBlueprintMermaid,
  type MapModel,
  type MapNode,
  type MapEdge,
  type MapRenderOptions,
} from './map';
