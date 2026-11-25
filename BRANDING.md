# Anh Sơn Movement — design system (2026 rebrand)

Everything visual is driven by tokens in `css/style.css` (section 1).
Change a token, and every component follows.

## Colour
| Token | Value | Use |
|---|---|---|
| `--navy` | `#0D1F3D` | primary brand, headings, primary buttons, footer |
| `--gold` | `#C8922E` | accent: icons, rules, bars, hover states, gift button |
| `--gold-ink` | `#8A5D1B` | gold **that carries text** — passes WCAG AA on white and cream |
| `--cream` | `#F5E7D2` | alternating section background, medallions |
| `--cream-lite` | `#FBF5EA` | large soft areas, input fields |
| `--white` | `#FFFFFF` | base page background |
| `--muted` | `#635E55` | secondary body text (AA on white *and* cream) |

**Rule:** never set text in `--gold` on a light background — it measures 2.76:1.
Use `--gold-ink` (5.73:1). `--gold` on `--navy` is 5.94:1 and is fine.

## Type
- **Montserrat** — all headings, buttons, labels, numbers, and *all* Vietnamese text.
- **Lato** — English body copy.

Lato has no Vietnamese subset on any distribution, and per-glyph fallback would mix
two typefaces inside a single word. So `body.lang-vn` sets Montserrat throughout —
which the brand guidelines explicitly sanction ("Body: Lato Regular, alternative:
Montserrat Regular"). Both are self-hosted in `fonts/`; no external requests.

## Spacing, radius, elevation
`--s1`…`--s10` (4→128px), `--r-xs`…`--r-2xl` (8→44px), `--sh-1`…`--sh-4`.
Use the tokens — no one-off pixel values.

## Icons
One outlined set, 24×24, 1.7 stroke, defined once as an SVG sprite at the top of
`index.html`. Use it as:

```html
<svg class="ic" aria-hidden="true"><use href="#i-heart"></use></svg>
```

Available: `ear heart eye people mountain hands bamboo path sunrise share gift
lock shield message quote mail arrow instagram facebook whatsapp mark`.

The first eight are the icon row from the brand guidelines
(horen · waarderen · zien · samen · groei · zorg · kracht · toekomst).

## Logo
- `.logo` in the header — inline SVG **AS monogram** (navy chevron / mountain peak,
  gold S, gold inner ridge) plus a Montserrat wordmark.
- Below 640px the wordmark hides and the monogram carries navigation, per the
  brand guidelines.
- `assets/brand/emblem.png` — the full emblem, used large in the footer.
- `assets/brand/favicon.svg` — the monogram on navy.

## Buttons
`.btn.primary` navy → gold on hover · `.btn.gold` gold → navy on hover ·
`.btn.ghost` gold outline, navy text · `.btn.white` / `.btn.outline-light` for
dark and photographic surfaces. Add `.big` or `.sm` for size.

## Motion
All transitions use `--t` / `--ease`. Everything is disabled under
`prefers-reduced-motion`.
