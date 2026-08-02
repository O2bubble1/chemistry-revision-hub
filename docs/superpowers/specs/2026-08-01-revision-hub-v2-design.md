# Revision Hub v2 — Design

Date: 2026-08-01
Repo: https://github.com/O2bubble1/chemistry-revision-hub (owner: Xin Yang, push access confirmed)
Source today: `Revision_Hub/THE-HUB(Font).html`

Three features: a font control panel, a qualitative-analysis practical simulator, and a
GitHub Pages deployment that replaces the existing React app.

---

## 0. Starting point

`THE-HUB(Font).html` is a bundler artifact, not hand-written HTML. It contains:

- `<script type="__bundler/manifest">` — JSON map of 4 woff2 assets (Caprasimo ×2, Figtree ×4)
  keyed by UUID, base64-encoded.
- `<script type="__bundler/template">` — the entire 3.9 MB page, JSON-string-encoded, with the
  4 UUIDs appearing as placeholders inside `@font-face` rules.
- ~250 lines of unpack-on-load JS plus an "Unpacking…" splash screen.

The page itself is already well-structured and v2 builds on it rather than rewriting:

| Existing thing | Where | v2 relies on it |
|---|---|---|
| `--font-heading`, `--font-heading-weight`, `--font-body` | `:root` | Font panel writes these |
| Theme toggle + `localStorage['hciRevisionHub.theme']` | hero tools | Font panel copies the pattern, sits beside it |
| `HUB_GROUPS` + `.tab[data-subject][data-group][data-target]` | tab registry | Sim registers as one new tab |
| Cation / anion / gas tables | `#cations`, `#anions`, `#gases` | Sim's truth table is transcribed from this exact wording |
| Solubility rules (SPAN, "Pure Art Courses", "Sciences") | `#solubility` | Decides which salts are soluble in the sim pool |

### Decision: unwrap the bundler

v2 ships as a plain `index.html`. Decode the template once, inline the 4 fonts as `data:` URIs
directly in their `@font-face` rules, delete the manifest/template/unpacker scripts and the
splash markup.

Rationale: the file becomes editable and diffable, GitHub Pages serves it with no build step,
and the unpack flash on every load disappears. Nothing is lost — the bundler only ever
re-assembled what we are now writing literally.

---

## 1. Font control

### Scope

Split heading and body pickers, a size scale, and a reading-comfort toggle.
No separate weight control, no per-section overrides, no curated pairing presets — the two
pickers already express any pairing.

### Mechanism

The whole feature is three CSS variables plus a persisted object. No font-loading library.

```
:root {
  --font-heading: <chosen>;
  --font-body:    <chosen>;
  --font-scale:   1;         /* 0.9 – 1.3 */
  --line-height-body:  1.55; /* comfort → 1.75  */
  --letter-spacing-body: 0;  /* comfort → 0.01em */
}
```

`body` already consumes `--font-body`; `h1–h4` and ~40 component rules already consume
`--font-heading`. Nothing else needs touching for the family pickers.

**Size scaling.** Line 234 of the current stylesheet reads
`body { margin: 0; font-size: 15px; line-height: 1.55; font-weight: 400; }`. Because body pins a
fixed pixel size, scaling `html { font-size }` would do nothing. The edit is that one declaration:

```css
body { font-size: calc(15px * var(--font-scale));
       line-height: var(--line-height-body);
       letter-spacing: var(--letter-spacing-body); }
```

Known ceiling: roughly 30 component rules set their own fixed `px` sizes (14px, 17px, 13px…) and
will not scale — everything `em`-derived, which is the bulk of the reading text, will. Mark this
with a `ponytail:` comment. If the result looks uneven in practice, the upgrade path is a targeted
px→em pass on those declarations, not a second scaling mechanism.

Rejected: `body { zoom: var(--font-scale) }` scales every fixed px in one line, but the page has
several `position: fixed` overlays (periodic-table modal, source viewer, tooltip) that `zoom`
displaces.

### Family list

One list, offered in both pickers.

| Family | Source | Note |
|---|---|---|
| Caprasimo | bundled (data: URI) | current heading, default |
| Figtree | bundled (data: URI) | current body, default |
| System UI | none | `system-ui, -apple-system, sans-serif` |
| Inter | Google | neutral workhorse |
| Poppins | Google | geometric, popular |
| Nunito | Google | rounded, friendly |
| Work Sans | Google | |
| Space Grotesk | Google | display-ish, good headings |
| Lora | Google | serif |
| Merriweather | Google | serif, screen-optimised |
| Source Serif 4 | Google | serif |
| IBM Plex Sans | Google | |
| Atkinson Hyperlegible | Google | designed for low vision — reading comfort |
| Lexend | Google | designed to improve reading speed — reading comfort |
| JetBrains Mono | Google | monospace |

Every stack ends `…, system-ui, sans-serif`.

### Loading

Google families load lazily: on first selection of family *X*, inject
`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X:wght@400;700&display=swap">`
and record *X* in a `Set` so it is never injected twice. Bundled and system families inject
nothing.

Offline consequence: the two bundled defaults always work. A Google family chosen while offline
falls through to `system-ui` — acceptable, and it self-heals on the next online load.

### UI

An `Aa` button in the hero tool row beside `#themeToggle`, opening a small popover:

```
┌─ Typography ──────────────┐
│ Headings  [ Caprasimo ▾ ] │
│ Body      [ Figtree   ▾ ] │
│ Size      90 ──●── 130    │
│ ☐ Reading comfort         │
│              [ Reset ]    │
└───────────────────────────┘
```

Two `<select>`s (native — no custom dropdown), one `<input type="range">`, one checkbox, one
reset button. Closes on outside click and on `Escape`. Each `<option>` is styled with its own
`font-family` so the list previews itself.

### Persistence

`localStorage['hciRevisionHub.font']` = `{heading, body, scale, comfort}`, applied at the same
point in startup as the existing theme restore, so there is no flash of the default font.

---

## 2. QA Practical Simulator

### Placement

New section `#qalab`, new tab:

```html
<button class="tab" data-subject="chem" data-group="qa" data-target="qalab">Practical Sim</button>
```

Inserted after the existing `QA Strategy` tab, inside the `qa` group. No `HUB_GROUPS` change —
the group already exists.

### Coverage

Cations and anions in solution, plus the gas tests they evolve. **Out of scope:** thermal action
on solids (E3.6) and salt preparation (E3.8).

### Truth table

Transcribed verbatim from the wording already on `#cations`, `#anions` and `#gases` so the sim's
model answers and the revision notes cannot drift apart.

**Cations** — `ppt: null` means no precipitate.

| Cation | Solution | + NaOH(aq) dropwise → excess | + NH₃(aq) dropwise → excess |
|---|---|---|---|
| NH₄⁺ | colourless | No ppt. On warming, colourless pungent gas turns moist red litmus blue | No ppt |
| Ca²⁺ | colourless | White ppt, insoluble in excess | No ppt |
| Al³⁺ | colourless | White ppt, **dissolves** in excess → colourless solution | White ppt, insoluble in excess |
| Zn²⁺ | colourless | White ppt, **dissolves** in excess → colourless solution | White ppt, **dissolves** in excess → colourless solution |
| Fe²⁺ | green | Green ppt, insoluble in excess | Green ppt, insoluble in excess |
| Fe³⁺ | yellow-brown | Red-brown ppt, insoluble in excess | Red-brown ppt, insoluble in excess |
| Cu²⁺ | blue | Light blue ppt, insoluble in excess | Light blue ppt, **dissolves** in excess → **dark blue** solution |

**Anions**

| Anion | Reagent | Observation |
|---|---|---|
| CO₃²⁻ | dilute acid | Effervescence, colourless odourless gas → white ppt in limewater |
| Cl⁻ | dilute HNO₃, then AgNO₃(aq) | White ppt |
| I⁻ | dilute HNO₃, then AgNO₃(aq) | Yellow ppt |
| SO₄²⁻ | dilute HNO₃, then Ba(NO₃)₂(aq) | White ppt |
| NO₃⁻ | excess NaOH(aq) + Al foil, warm | Colourless pungent gas turns moist red litmus blue |

**Gases**

| Gas | Test | Observation |
|---|---|---|
| H₂ | lighted splint | extinguished with a "pop" |
| O₂ | glowing splint | relights |
| CO₂ | limewater | white precipitate |
| NH₃ | moist red litmus | turns blue |
| Cl₂ | moist blue litmus | turns red, then bleached |
| SO₂ | acidified KMnO₄ | purple → colourless |

### Salt pool

7 cations × 5 anions, minus combinations that do not exist or that redox interferes with:

- Excluded — do not exist: Al³⁺/CO₃²⁻, Fe³⁺/CO₃²⁻
- Excluded — redox with iodide: Fe³⁺/I⁻, Cu²⁺/I⁻

Solubility from `#solubility`: carbonates insoluble except NH₄⁺; CaSO₄ insoluble; everything else
soluble. Insoluble members of the pool: CaCO₃, ZnCO₃, FeCO₃, CuCO₃, CaSO₄.

That gives 31 unknowns — 26 soluble and 5 insoluble.

### Engine

One reducer, everything else is rendering:

```js
runTest(state, reagentId, mode) -> {
  solutionColour, ppt: {colour, dissolvesInExcess, resultingSolution} | null,
  gas: 'CO2' | 'NH3' | null,
  modelText: '…'
}
```

State per portion: `{ acidified: false, contents: <salt>, dissolved: bool }`.

Two mechanics that carry real teaching weight and are cheap to model:

1. **Insoluble unknown path** (E3.9 FA2 = zinc carbonate). If the salt is insoluble, Test 1 gives a
   suspension, not a solution. The student must dissolve it in a minimum volume of dilute nitric
   acid first — which for a carbonate *is* the anion test (effervescence → limewater).
2. **False positive when unacidified.** Adding AgNO₃ or Ba(NO₃)₂ to a carbonate solution that has
   not been acidified yields a white precipitate of Ag₂CO₃ / BaCO₃. The engine returns exactly
   that, and marking flags the missing acidification step. This is the whole reason the syllabus
   says to acidify, and the sim should let the student get it wrong.

### Bench

Reagent buttons: deionised water · dilute nitric acid · NaOH(aq) `[dropwise] [to excess]` ·
NH₃(aq) `[dropwise] [to excess]` · AgNO₃(aq) · Ba(NO₃)₂(aq) · Na₂CO₃(aq) ·
excess NaOH + Al foil (warm) · warm the tube.

Gas-test tools (lighted splint, glowing splint, limewater, moist red litmus, moist blue litmus,
acidified KMnO₄) are disabled unless the current result carries a gas.

Rendering is pure CSS — no canvas, no per-state SVG. A tube element takes two custom properties:

```css
.tube { --liquid: transparent; --ppt: none; }
.tube .liquid { background: var(--liquid); }
.tube .ppt    { background: var(--ppt); filter: blur(1px); }   /* cloudiness */
.tube .bubble { animation: rise 1.2s infinite; }               /* only when gas */
```

### Paper

Left pane. The real format: `Test | Procedure | Observations | Inference / Conclusion`, procedures
pre-written, Observations a `<textarea>`, Inference an `<input>`.

Practice-mode script:

| Test | Procedure |
|---|---|
| 1 | Add 1 spatula to a boiling tube, add deionised water till one-third filled, stir. Divide into at least six portions. |
| 2(a) | To a fresh portion, add aqueous sodium hydroxide gradually until no further change. |
| 2(b) | To a fresh portion, add aqueous ammonia gradually until no further change. |
| 3(a) | To a fresh portion, add dilute nitric acid. |
| 3(b) | To a fresh portion, add aqueous barium nitrate. |
| 3(c) | To a fresh portion, add aqueous silver nitrate. |
| + | "Add a test" — student adds rows for the nitrate test, limewater, etc. |

Footer: `FA1 is ________` free text, plus cation and anion `<select>`s.
Buttons: `Check my work` · `Reset` · `New unknown`.

The bench never writes on the paper. Transcribing what you observe is the skill being trained.

### Modes

- **Practice** — random salt from the pool.
- **Replay** — the three real papers, procedures and question wording taken from the PDFs:
  - E3.5, FA1 = calcium chloride (+ question: why 3(b)/3(c) need no acidification)
  - E3.7, FA2 = copper(II) nitrate (+ nitrate test with Al foil; question: why excess NaOH)
  - E3.9, FA1 = calcium chloride and FA2 = zinc carbonate (insoluble path)

### Marking

Generic, derived from the result object — no per-salt marking data to author or keep in sync:

```js
markFor(result) -> [ /white|green|blue|red-brown|yellow/i,
                     /precipitat|ppt/i,
                     /insolubl|does ?not dissolv|dissolv/i, … ]
```

A row passes when every required pattern is present in the student's text. The model answer is
then shown inline beside their answer either way. Final identification is marked on the cation and
anion selects, not on free-text spelling.

Score = observation marks + inference marks + 2 for the identification.

### Persistence

`localStorage['hciRevisionHub.qalab']` = `{mode, saltId, rows, final}`. A refresh must not lose an
in-progress attempt.

### Layout

Split panes, both sticky, on wide screens. Below 900px the panes stack into one column with the
bench above the paper, and the result card is `position: sticky; top: 0` so it stays visible while
writing. One media query.

### Self-check

A dependency-free `test.js` at the repo root, run with `node test.js`. It extracts
marker-delimited script blocks from `index.html` and evaluates them, so the engine is testable
without a browser and the checks can drive development rather than trail it. Roughly 50 cases,
including:

- `Cu²⁺ + NH₃ to excess` → text contains "dark blue"
- `Al³⁺ + NaOH to excess` → dissolves; `Al³⁺ + NH₃ to excess` → does not
- `Zn²⁺` dissolves in excess of both
- `Ca²⁺ + NH₃` → no precipitate
- `CaCl₂ + AgNO₃` unacidified vs acidified → white ppt both times, but unacidified flags the
  missing step
- `CaCO₃ + AgNO₃` unacidified → false-positive white ppt
- `ZnCO₃` in water → suspension; in dilute HNO₃ → effervescence, CO₂
- `NH₄NO₃` → NH₃ from both the cation test and the nitrate test (the trap)
- Every salt in the pool has a defined solution colour and solubility flag
- Every salt survives every reagent without throwing

Plain `assert`, no framework, no npm install.

---

## 3. GitHub Pages

Current state: `main` holds a Vite + React + TypeScript + Tailwind + shadcn app, deployed by a
workflow in `.github/workflows`, live at `https://o2bubble1.github.io/chemistry-revision-hub/`.

Target: a single static `index.html` at repo root, served by branch deploy. No build, no Node,
no workflow.

Chosen approach: replace on `main`. The React app stays fully recoverable in `git log`.

Steps:

1. Clone the repo.
2. `git rm -r` the React scaffolding: `src/`, `public/`, `scripts/`, `.github/workflows/`,
   `package.json`, `bun.lock`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`,
   `vitest.config.ts`, `components.json`, `.prettierrc`, `.prettierignore`, their `index.html`,
   and `Revision_Hub__Chemistry_and_Physics.html`. Keep `README.md`, `LICENSE`, `.gitignore`.
   Also remove `docs/`, `skills/` and `AGENTS.md` — all three document the React app and describe
   a codebase that will no longer exist. `docs/superpowers/specs/` is then re-added carrying this
   spec only.
3. Add the new `index.html` at root.
4. Update `README.md` to describe the static page.
5. Commit and push to `main`.
6. **Settings ▸ Pages ▸ Source: change "GitHub Actions" to "Deploy from a branch" → `main` /
   `/ (root)`.** Mandatory. Removing the workflow without changing this setting leaves the site
   serving a stale build until it 404s.

No `.nojekyll` needed — no files or directories begin with an underscore.

Verification: load `https://o2bubble1.github.io/chemistry-revision-hub/` and confirm the fonts
render (data: URIs, not a network fetch), the font panel persists across reload, and the sim runs
`?selftest` clean.

---

## Risks

| Risk | Handling |
|---|---|
| `--font-scale` defeated by a fixed-`px` `font-size` | Check `body`/`.section` first; fix the one declaration to `rem` |
| Google Fonts unreachable offline | Bundled defaults unaffected; all stacks fall back to `system-ui` |
| Sim answers drifting from the revision tables | Truth table transcribed from those tables; self-test asserts pool completeness |
| Pages source left on "GitHub Actions" | Called out as a mandatory, separately-verified step |
| 3.9 MB file grows | Additions are ~40 KB of markup/CSS/JS; fonts load from CDN, not bundled |

## Explicitly not building

Thermal action on solids (E3.6) · salt preparation (E3.8) · drag-and-drop glassware ·
chip-based observation entry · curated font pairings · a build pipeline · offline bundling of
Google families.
