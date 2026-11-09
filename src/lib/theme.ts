import { brand } from './brand';

type Palette = typeof brand.palette.light;
const vars = (c: Palette) =>
  `--bg:${c.bg};--surface:${c.surface};--surface-2:${c.surface2};--fg:${c.fg};--muted:${c.muted};--line:${c.line};--accent:${c.accent};--accent-fg:${c.accentFg};`;

/** Token colore e font da brand.json: tema chiaro di base, scuro da sistema o da scelta esplicita. */
export function themeCss() {
  const p = brand.palette;
  return `:root{${vars(p.light)}--font-display:${brand.fonts.display};--font-body:${brand.fonts.body};--error:#b3261e;--ok:#1b7a43;}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${vars(p.dark)}--error:#ffb4ab;--ok:#7ad9a0;color-scheme:dark}}
:root[data-theme="dark"]{${vars(p.dark)}--error:#ffb4ab;--ok:#7ad9a0;color-scheme:dark}`;
}
