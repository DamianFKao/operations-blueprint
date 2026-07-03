/**
 * map: the Blueprint Map, a hand-drawn overview of the generated plan.
 *
 * One model, two renderers. buildMapModel() derives nodes and edges from the same
 * answers that drive buildSchema() and the written plan, so the map can never
 * disagree with the text: the always-present data spine (materials through clients),
 * the modules a shop's answers switch on, and the estimate-versus-actual feedback
 * loop, which is the one accent element on the canvas.
 *
 * renderBlueprintMap() emits a complete SVG (hand-drawn via sketch-lite, seeded per
 * shape so the spine's wobble never changes when an answer toggles a branch).
 * renderBlueprintMermaid() emits a fenced Mermaid flowchart for markdown surfaces.
 *
 * Sanitization contract: labels and notes describe generic manufacturing structure.
 * No company, client, vendor, SKU, or real cost is referenced.
 */
import type { BlueprintInput } from './blueprint-model';
import { seedFrom, createRng, lineD, rectD, arrowD, curveD, hachureD } from './sketch-lite';

export interface MapNode {
  id: string;
  /** Display label; '\n' marks an explicit line break (max two lines). */
  label: string;
  /** Display hint for the underlying tables, shown small in mono (may abbreviate). */
  sub: string;
  /** The REAL table names this node stands for (tests pin these to buildSchema). */
  tables: string[];
  /** One-line plain-language explanation, surfaced on hover/focus on the site. */
  note: string;
  kind: 'spine' | 'module' | 'loop';
  /** Plan section this node jumps to (the rendered HTML carries id="bp-<sectionId>"). */
  sectionId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapEdge {
  from: string;
  to: string;
  kind: 'flow' | 'branch' | 'loop';
  label?: string;
}

export interface MapModel {
  nodes: MapNode[];
  edges: MapEdge[];
}

export interface MapRenderOptions {
  /**
   * 'site': colors come from the page (currentColor + .bp-map-* classes; the site
   * styles them with its theme tokens). 'self-contained': an embedded <style> with
   * a light palette and a prefers-color-scheme dark override, for committed files
   * and exports viewed anywhere.
   */
  palette?: 'site' | 'self-contained';
  /** Adds the first-paint self-drawing hooks (root class + pathLength). SSR only. */
  animate?: boolean;
}

/* ------------------------------------------------------------------ layout -- */

const VIEW_W = 920;
const VIEW_H = 430;
const SPINE_Y = 204;
const SPINE_H = 50;
const NODE_W = 118;
const MODULE_Y = 64;
const MODULE_H = 46;
/** Fixed spine slot centers; the spine never moves, whatever the answers. */
const CX = [88, 237, 386, 535, 684, 833];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ------------------------------------------------------------------- model -- */

const PRODUCT_NODE: Record<
  BlueprintInput['variation'],
  { label: string; sub: string; tables: string[]; note: string }
> = {
  catalog: {
    label: 'Product\ncatalog',
    sub: 'products',
    tables: ['products'],
    note: 'Your finished products. Each has many bom_lines and appears in quote_lines.',
  },
  configurable: {
    label: 'Templates\n& variants',
    sub: 'templates · variants',
    tables: ['product_templates', 'product_variants'],
    note: 'A template (product_templates) holds the parameters; a variant (product_variants) is a resolved configuration that can be costed and quoted.',
  },
  custom: {
    label: 'Per-job\nspecs',
    sub: 'project_specs',
    tables: ['project_specs'],
    note: 'The per-order definition of a custom product; resolves to bom_lines.',
  },
};

export function buildMapModel(i: BlueprintInput): MapModel {
  const spine = (id: string, slot: number, label: string, sub: string, tables: string[], note: string): MapNode => ({
    id,
    label,
    sub,
    tables,
    note,
    kind: 'spine',
    sectionId: 'foundation',
    x: CX[slot] - NODE_W / 2,
    y: SPINE_Y,
    w: NODE_W,
    h: SPINE_H,
  });
  const module = (id: string, slot: number, label: string, sub: string, tables: string[], note: string): MapNode => ({
    id,
    label,
    sub,
    tables,
    note,
    kind: 'module',
    sectionId: 'foundation',
    x: CX[slot] - NODE_W / 2,
    y: MODULE_Y,
    w: NODE_W,
    h: MODULE_H,
  });

  const product = PRODUCT_NODE[i.variation];
  const nodes: MapNode[] = [
    spine(
      'materials',
      0,
      'Materials\n& labor',
      'materials · labor_ops',
      ['materials', 'labor_ops'],
      'Your priced inputs: every material (unit cost, vendor) and every labor operation (station, standard minutes, rate).',
    ),
    spine(
      'recipes',
      1,
      'Recipes',
      'bom_lines',
      ['bom_lines'],
      'The bill of materials: binds a product to the materials it consumes.',
    ),
    spine('product', 2, product.label, product.sub, product.tables, product.note),
    spine(
      'quotes',
      3,
      'Quotes',
      'quotes · quote_lines',
      ['quotes', 'quote_lines'],
      'Priced output of the engine, versioned; every line item is priced by the same engine.',
    ),
    spine('jobs', 4, 'Jobs', 'projects', ['projects'], 'A job from quote through delivery.'),
    spine('clients', 5, 'Clients', 'clients', ['clients'], 'Owns projects and quotes.'),
    {
      id: 'actuals',
      label: 'Shop-floor actuals',
      sub: 'production_actuals',
      tables: ['production_actuals'],
      note: 'What the floor actually consumed, compared back to the estimate. The most valuable data you produce.',
      kind: 'loop',
      sectionId: 'process',
      x: CX[4] - 75,
      y: 336,
      w: 150,
      h: SPINE_H,
    },
  ];

  const edges: MapEdge[] = [
    { from: 'materials', to: 'recipes', kind: 'flow' },
    { from: 'recipes', to: 'product', kind: 'flow' },
    { from: 'product', to: 'quotes', kind: 'flow' },
    { from: 'quotes', to: 'jobs', kind: 'flow' },
    { from: 'jobs', to: 'clients', kind: 'flow' },
    { from: 'jobs', to: 'actuals', kind: 'flow' },
    { from: 'actuals', to: 'materials', kind: 'loop', label: 'estimate vs actual, fed back into rates and the next quote' },
  ];

  if (i.cuts) {
    nodes.push(
      module(
        'cutting',
        0,
        'Sheets &\ncutting',
        'stock_items · cut_parts',
        ['stock_items', 'cut_parts'],
        'The raw stock you cut from, and the parts nested onto it to compute yield.',
      ),
    );
    edges.push({ from: 'cutting', to: 'materials', kind: 'branch' });
  }
  if (i.inventory !== 'perjob') {
    nodes.push(
      module(
        'inventory',
        1,
        'Inventory',
        i.inventory === 'managed' ? 'inventory · reorders' : 'inventory',
        i.inventory === 'managed' ? ['inventory', 'reorder_rules'] : ['inventory'],
        i.inventory === 'managed'
          ? 'Current stock levels, decremented on consumption; reorder_rules raise a purchase suggestion when stock crosses the minimum.'
          : 'Current stock levels, decremented on consumption.',
      ),
    );
    edges.push({ from: 'inventory', to: 'materials', kind: 'branch' });
  }
  if (i.salesChannel === 'online') {
    nodes.push(
      module(
        'catalog',
        2,
        'Public\ncatalog',
        'catalog_items',
        ['catalog_items'],
        'The read-only public surface, priced by the same engine.',
      ),
    );
    edges.push({ from: 'catalog', to: 'product', kind: 'branch' });
  }
  if (i.salesChannel === 'dealers') {
    nodes.push(
      module(
        'dealers',
        3,
        'Dealer\npricing',
        'accounts · price_tiers',
        ['accounts', 'price_tiers'],
        'Dealer accounts mapped to pricing tiers, applied by the engine.',
      ),
    );
    edges.push({ from: 'dealers', to: 'quotes', kind: 'branch' });
  }
  if (i.install !== 'none') {
    nodes.push(
      module(
        'delivery',
        4,
        i.install === 'install' ? 'Deliveries\n& installs' : 'Deliveries',
        i.install === 'install' ? 'deliveries · installs' : 'deliveries',
        i.install === 'install' ? ['deliveries', 'installs'] : ['deliveries'],
        i.install === 'install'
          ? 'Shipping and delivery scheduling, plus on-site installation jobs.'
          : 'Shipping and delivery scheduling.',
      ),
    );
    edges.push({ from: 'delivery', to: 'jobs', kind: 'branch' });
  }
  if (i.orderPattern === 'runs') {
    nodes.push(
      module(
        'runs',
        5,
        'Production\nruns',
        'work_orders',
        ['work_orders'],
        'Releases production runs to stations and tracks work in progress.',
      ),
    );
    edges.push({ from: 'runs', to: 'jobs', kind: 'branch' });
  }

  return { nodes, edges };
}

/* ------------------------------------------------------------- SVG renderer -- */

const SELF_CONTAINED_STYLE =
  '<style>' +
  'a.bp-map-node{text-decoration:none}' +
  '.bp-map-ink{color:#1c1a17}.bp-map-soft{color:#56504a}.bp-map-muted{color:#8a8278}.bp-map-accent{color:#b4470f}' +
  "text{font-family:'Architects Daughter','Segoe Print','Comic Sans MS',ui-rounded,cursive;fill:currentColor}" +
  "text.bp-map-sub{font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;fill-opacity:.72}" +
  '@media (prefers-color-scheme:dark){.bp-map-ink{color:#ece7dd}.bp-map-soft{color:#b1a99c}' +
  '.bp-map-muted{color:#847c6f}.bp-map-accent{color:#e8843d}}' +
  '</style>';

function pathEl(d: string, animate: boolean, cls?: string, width = 1.6): string {
  const c = cls ? ` class="${cls}"` : '';
  const pl = animate ? ' pathLength="1"' : '';
  return `<path${c} d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${pl}/>`;
}

function nodeText(n: MapNode): string {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const lines = n.label.split('\n');
  const labelSize = n.kind === 'module' ? 13.5 : 15;
  const subSize = n.sub.length > 22 ? 7.4 : 8;
  let t = '';
  if (lines.length === 1) {
    t += `<text class="bp-map-label" x="${cx}" y="${cy - 2}" font-size="${labelSize}" text-anchor="middle">${esc(lines[0])}</text>`;
  } else {
    t += `<text class="bp-map-label" x="${cx}" y="${cy - 8}" font-size="${labelSize}" text-anchor="middle">${esc(lines[0])}</text>`;
    t += `<text class="bp-map-label" x="${cx}" y="${cy + 7}" font-size="${labelSize}" text-anchor="middle">${esc(lines[1])}</text>`;
  }
  t += `<text class="bp-map-sub" x="${cx}" y="${n.y + n.h - 7}" font-size="${subSize}" text-anchor="middle">${esc(n.sub)}</text>`;
  return t;
}

function edgePath(e: MapEdge, byId: Map<string, MapNode>, animate: boolean): string {
  const a = byId.get(e.from)!;
  const b = byId.get(e.to)!;
  const rng = createRng(seedFrom(`edge:${e.from}->${e.to}`));
  if (e.kind === 'flow') {
    if (e.from === 'jobs' && e.to === 'actuals') {
      const x = a.x + a.w / 2;
      return pathEl(arrowD(x, a.y + a.h + 2, x, b.y - 3, rng), animate);
    }
    const y = a.y + a.h / 2;
    return pathEl(arrowD(a.x + a.w + 2, y, b.x - 3, y, rng), animate);
  }
  // branch: module down to its spine anchor
  if (e.from === 'runs') {
    // side-anchor into Jobs so it cannot collide with the delivery module's drop edge
    return pathEl(lineD(a.x + 18, a.y + a.h + 2, b.x + b.w + 1, b.y + 12, rng), animate, undefined, 1.4);
  }
  if (e.from === 'inventory' && e.to === 'materials') {
    // sits above Recipes, feeds Materials: slant to the anchor's top-right corner
    return pathEl(lineD(a.x + a.w / 2 - 20, a.y + a.h + 2, b.x + b.w - 16, b.y - 2, rng), animate, undefined, 1.4);
  }
  const x = a.x + a.w / 2;
  return pathEl(lineD(x, a.y + a.h + 2, x, b.y - 2, rng), animate, undefined, 1.4);
}

function loopMarkup(byId: Map<string, MapNode>, label: string, animate: boolean): string {
  const from = byId.get('actuals')!;
  const to = byId.get('materials')!;
  const rng = createRng(seedFrom('edge:loop'));
  const x1 = from.x - 2;
  const y1 = from.y + from.h / 2 + 6;
  const x2 = to.x + to.w / 2;
  const y2 = to.y + to.h + 6;
  const d = curveD(x1, y1, 430, 412, 130, 408, x2, y2 + 8, rng);
  // hand-drawn arrowhead pointing up into the materials node
  const head = arrowD(x2 + 1, y2 + 20, x2, y2 + 4, rng);
  return (
    pathEl(d, animate, 'bp-map-looppath', 1.8) +
    pathEl(head, animate, undefined, 1.8) +
    `<text class="bp-map-label bp-map-looplabel" x="380" y="422" font-size="13" text-anchor="middle">${esc(label)}</text>`
  );
}

export function renderBlueprintMap(i: BlueprintInput, opts: MapRenderOptions = {}): string {
  const palette = opts.palette ?? 'site';
  const animate = opts.animate ?? false;
  const m = buildMapModel(i);
  const byId = new Map(m.nodes.map((n) => [n.id, n]));

  const edges = m.edges
    .filter((e) => e.kind !== 'loop')
    .map((e) => edgePath(e, byId, animate))
    .join('');
  const loop = m.edges.find((e) => e.kind === 'loop')!;

  const nodes = m.nodes
    .map((n) => {
      const rng = createRng(seedFrom(`node:${n.id}`));
      let inner = pathEl(rectD(n.x, n.y, n.w, n.h, rng), animate, 'bp-map-box');
      if (n.id === 'product') {
        const h = createRng(seedFrom('hachure:product'));
        inner += `<g class="bp-map-muted" opacity="0.5">${pathEl(hachureD(n.x, n.y, n.w, n.h, h, 9, 5), animate, undefined, 0.8)}</g>`;
      }
      inner += nodeText(n);
      const kindClass = n.kind === 'module' ? ' bp-map-soft' : '';
      return `<a href="#bp-${n.sectionId}" class="bp-map-node${kindClass}" data-node="${n.id}" data-note="${esc(n.note)}" aria-label="${esc(
        `${n.label.replace('\n', ' ')} (${n.tables.join(', ')}). ${n.note}`,
      )}">${inner}</a>`;
    })
    .join('');

  const rootClass = `bp-map-svg${animate ? ' bp-map--draw' : ''}`;
  // Site palette keeps the full canvas so toggling answers never resizes the map.
  // Self-contained files are static, so a moduleless map crops its empty top band.
  const hasModules = m.nodes.some((n) => n.kind === 'module');
  const minY = palette === 'self-contained' && !hasModules ? SPINE_Y - 40 : 0;
  const aria =
    'Map of the operations system: the data spine from materials to clients, the modules your answers switched on, and the estimate versus actual feedback loop.';
  return (
    // xmlns is required for the standalone/committed files (an SVG document without
    // it is treated as generic XML and never renders in an <img> or on GitHub).
    `<svg xmlns="http://www.w3.org/2000/svg" class="${rootClass}" viewBox="0 ${minY} ${VIEW_W} ${VIEW_H - minY}" role="img" aria-label="${aria}">` +
    (palette === 'self-contained' ? SELF_CONTAINED_STYLE : '') +
    `<g class="bp-map-soft bp-map-edges">${edges}</g>` +
    `<g class="bp-map-accent bp-map-loop">${loopMarkup(byId, loop.label ?? '', animate)}</g>` +
    `<g class="bp-map-ink bp-map-nodes">${nodes}</g>` +
    `</svg>`
  );
}

/* --------------------------------------------------------- Mermaid renderer -- */

/**
 * A fenced Mermaid flowchart of the same model, for markdown surfaces (GitHub
 * renders these natively). Plain flowchart syntax only; labels drop characters
 * Mermaid treats specially.
 */
export function renderBlueprintMermaid(i: BlueprintInput): string {
  const m = buildMapModel(i);
  const label = (n: MapNode): string => n.label.replace(/\n/g, ' ').replace(/&/g, 'and');
  const byId = new Map(m.nodes.map((n) => [n.id, n]));
  const lines: string[] = ['```mermaid', 'flowchart LR'];
  for (const n of m.nodes) lines.push(`  ${n.id}["${label(n)}"]`);
  for (const e of m.edges) {
    if (e.kind === 'flow') lines.push(`  ${e.from} --> ${e.to}`);
    else if (e.kind === 'branch') lines.push(`  ${e.from} --- ${e.to}`);
    else lines.push(`  ${e.from} -. estimate vs actual .-> ${byId.has(e.to) ? e.to : 'materials'}`);
  }
  lines.push('```');
  return lines.join('\n');
}
