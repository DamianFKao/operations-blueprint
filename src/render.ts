/**
 * render: turns a structured Blueprint into an HTML string.
 *
 * Used by BOTH the component's server render (via set:html, the static fallback) and the
 * client <script> (innerHTML on input change). One render path = no drift. Output uses
 * GLOBAL `.bp-*` classes (styled with <style is:global> in the component), so the client
 * can rebuild innerHTML without losing Astro's scoped-style attributes.
 */
import type { Blueprint, Block } from './blueprint-model';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderBlock(b: Block): string {
  switch (b.kind) {
    case 'prose':
      return `<p class="bp-p">${esc(b.text)}</p>`;
    case 'subhead':
      return `<p class="bp-subhead">${esc(b.text)}</p>`;
    case 'list':
      return `<ul class="bp-list">${b.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>`;
    case 'steps':
      return `<ol class="bp-steps">${b.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ol>`;
    case 'callout':
      return `<p class="bp-callout">${esc(b.text)}</p>`;
    case 'links':
      return (
        `<ul class="bp-links">` +
        b.items
          .map((it) => {
            const attrs = it.external === false ? '' : ' target="_blank" rel="noopener"';
            return `<li><a href="${esc(it.href)}"${attrs}>${esc(it.label)}</a></li>`;
          })
          .join('') +
        `</ul>`
      );
    case 'table':
      return (
        `<div class="bp-tablewrap"><table class="bp-table"><thead><tr>` +
        b.headers.map((h) => `<th>${esc(h)}</th>`).join('') +
        `</tr></thead><tbody>` +
        b.rows
          .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
          .join('') +
        `</tbody></table></div>`
      );
  }
}

export function renderBlueprintHTML(bp: Blueprint): string {
  return (
    `<p class="bp-intro">${esc(bp.intro)}</p>` +
    bp.sections
      .map(
        // id="bp-<section id>" lets the map (and anything else) deep-link a section.
        (s) =>
          `<section class="bp-section" id="bp-${s.id}"><h3 class="bp-h">${esc(s.title)}</h3>${s.blocks
            .map(renderBlock)
            .join('')}</section>`
      )
      .join('')
  );
}

// Pipe characters would break a markdown table cell, so escape them.
const cell = (s: string) => s.replace(/\|/g, '\\|');

function blockToMarkdown(b: Block): string[] {
  switch (b.kind) {
    case 'prose':
      return [b.text, ''];
    case 'subhead':
      return [`### ${b.text}`, ''];
    case 'callout':
      return [`> ${b.text}`, ''];
    case 'list':
      return [...b.items.map((it) => `- ${it}`), ''];
    case 'steps':
      return [...b.items.map((it, idx) => `${idx + 1}. ${it}`), ''];
    case 'links':
      return [...b.items.map((it) => `- [${it.label}](${it.href})`), ''];
    case 'table':
      return [
        `| ${b.headers.map(cell).join(' | ')} |`,
        `| ${b.headers.map(() => '---').join(' | ')} |`,
        ...b.rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
        '',
      ];
  }
}

/**
 * Same structured Blueprint, rendered as a portable markdown document (for copy/paste or an agent).
 * Pass opts.map (a fenced Mermaid block from renderBlueprintMermaid) to include the Blueprint Map
 * right after the intro; GitHub and most markdown viewers render it as a diagram.
 */
export function renderBlueprintMarkdown(bp: Blueprint, opts: { map?: string } = {}): string {
  const lines: string[] = ['# Operations Blueprint', '', bp.intro, ''];
  if (opts.map) lines.push(opts.map, '');
  for (const s of bp.sections) {
    lines.push(`## ${s.title}`, '');
    for (const b of s.blocks) lines.push(...blockToMarkdown(b));
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
