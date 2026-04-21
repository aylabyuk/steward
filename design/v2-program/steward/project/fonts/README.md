# Fonts

the-vinci uses three families.

| Role | Family | Source | Weights |
|------|--------|--------|---------|
| Display + editorial serif | **Newsreader** | Google Fonts (CDN) | 400–800 + italic |
| UI sans | **Inter** (variable) | Bundled — `fonts/Inter-VariableFont_opsz_wght.ttf` | 100–900 |
| Mono / meta / eyebrow | **IBM Plex Mono** | Google Fonts (CDN) | 400 · 500 · 600 |

## Self-hosted
`Inter-VariableFont_opsz_wght.ttf` was provided by the user and is wired as a real `@font-face` at the top of `colors_and_type.css`. The file lives alongside this README.

## CDN fallbacks
Newsreader and IBM Plex Mono load from Google Fonts. If Google is blocked, graceful system fallbacks take over via `--font-*` variables. To self-host them, download the `.woff2`s and add `@font-face` blocks pointing at this folder.

## Notes
- **Newsreader** — editorial serif with optical sizing; large cuts are tighter/sharper, body cuts are more open.
- **Inter** — humanist UI sans, variable weight. Used for body copy, buttons, forms, nav.
- **IBM Plex Mono** — paired with Inter for eyebrows, captions, data, timestamps.
