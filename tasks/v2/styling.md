# v2 Styling strategy

## Stack
Tailwind v4 only. Custom properties via `@theme` block → auto-generated
utilities (`bg-parchment`, `text-walnut`, `font-display`, `shadow-elev-2`, …).

## `@theme` tokens (preview)
```css
@theme {
  --color-parchment: #FBF6EE;
  --color-parchment-2: #F4ECDC;
  --color-parchment-3: #E9DCC2;
  --color-bordeaux: #8B2E2A;
  --color-bordeaux-deep: #6B1F1C;
  --color-bordeaux-soft: #B65449;
  --color-brass: #C89B5A;
  --color-brass-soft: #E0BE87;
  --color-brass-deep: #8E6A36;
  --color-walnut: #3B2A22;
  --color-walnut-2: #5A4636;
  --color-walnut-3: #8A7460;
  --color-ink: #231815;
  --color-chalk: #FFFDF7;
  --color-border: #D9C9A8;
  --color-border-strong: #B99E6E;
  --color-success: #4E6B3A;
  --color-success-soft: #E2EAD3;
  --color-warning: #B97A19;
  --color-warning-soft: #F6E6C4;
  --color-danger-soft: #F3DAD5;

  --font-display: "Newsreader", Georgia, serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --shadow-elev-1: 0 1px 0 rgba(35,24,21,.06), 0 1px 2px rgba(35,24,21,.06);
  --shadow-elev-2: 0 1px 0 rgba(35,24,21,.06), 0 4px 12px rgba(35,24,21,.08);
  --shadow-elev-3: 0 2px 0 rgba(35,24,21,.04), 0 12px 28px rgba(35,24,21,.12);

  --ease-in-out: cubic-bezier(.4,0,.2,1);
  --ease-out:    cubic-bezier(.2,.7,.2,1);
  --ease-press:  cubic-bezier(.3,0,.6,1);
}
```
Spacing, radii, type-scale to match `design/v2-schedule/steward/project/colors_and_type.css` — ported verbatim into `@theme`.

## Fonts
Self-hosted under `public/fonts/`. `@font-face` in `index.css`.
- **Inter** — variable TTF copied from design bundle (`Inter-VariableFont_opsz_wght.ttf`).
- **Newsreader** — pinned variable font.
- **IBM Plex Mono** — pinned variable.

## Components
Express styles via Tailwind utility classes in React components. State
variants via `clsx` + `data-*` attributes. No `.sun`, `.horizon-sel`,
`.sp-list` component-CSS classes.

## `cn` helper
`src/lib/cn.ts` = `clsx + tailwind-merge`. Add `tailwind-merge` dep if absent.

## Raw CSS kept in `@layer base` (`src/styles/index.css`)
- `@font-face` declarations
- `body` defaults (font + bg)
- `::selection`
- `:where(button, a, input, select, textarea, [role="button"]):focus-visible` warm ring
- keyframes: `menuIn`, `slideIn`, `fadePop` (~4 lines each)

## Custom utility (Tailwind v4 `@utility`)
```css
@utility paper-grain {
  background-image:
    radial-gradient(rgba(139,46,42,.03) 1px, transparent 1px),
    radial-gradient(rgba(59,42,34,.035) 1px, transparent 1px);
  background-size: 3px 3px, 7px 7px;
  background-position: 0 0, 1px 2px;
}
```

## Component-class → utility mapping examples
| Design class soup | Tailwind expression |
|---|---|
| `.sun` | `<SundayCard>` composes `rounded-xl bg-chalk border border-border shadow-elev-1 …` |
| `.sun.is-fast` | prop `kind="fast"` → conditional `bg-gradient-to-b from-brass-soft/15 to-brass-soft/5` |
| `.sp__state.state-confirmed` | `<StatePill status="confirmed">` with typed utility-string record |
| `.paper` texture | `paper-grain` utility |
| `.sun:has(.sun__menu-pop)` z-raise | React state raises z-index on card when menu is open (no `:has()` hack) |
