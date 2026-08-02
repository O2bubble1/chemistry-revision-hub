# Chemistry Revision Hub

A single-file revision hub for O-Level / IP Chemistry and Physics.
Live at <https://o2bubble1.github.io/chemistry-revision-hub/>.

Everything is `index.html` — open it in a browser and it works. No build step, no
dependencies, no server. Fonts are inlined as data URIs so it works offline.

## What's in it

- **Chemistry** — qualitative analysis (cations, anions, gases), a practical simulator,
  salt preparation, solubility rules, pH indicators, oxides, bonding, a clickable periodic table
- **Physics** — kinematics, motion graphs, equations of motion, forces, Newton's laws,
  friction, work/energy/power
- **Tools** — flashcards, quizzes, model answers, a typography panel, and a light/dark theme

## Practical simulator

Apply qualitative analysis instead of just reading it. The tab splits in two: the left
side is a replica of the real practical paper, the right side is a lab bench.

Pick a portion, add a reagent — sodium hydroxide or ammonia dropwise or to excess, dilute
nitric acid, silver nitrate, barium nitrate, sodium carbonate, or the aluminium-foil
nitrate test — and the test tube renders what actually happens: the solution colour, a
settled precipitate, bubbles when a gas comes off. Gas-test tools (splint, limewater,
litmus, acidified KMnO₄) unlock only when there is a gas to test.

The bench never fills the paper in for you. You write what you observed, then `Check my
work` marks each row on the points that earn marks — colour, precipitate, and whether it
dissolves in excess — and shows the model answer beside yours. The final identification
is marked as a cation and an anion.

It lets you get things wrong the way the real practical does. Add silver nitrate to a
carbonate you never acidified and you get a genuine false-positive white precipitate,
with an explanation. Hand it an insoluble unknown and solution tests stay blocked until
you dissolve it in a minimum volume of dilute nitric acid.

- **Practice** — a random salt from 30 syllabus combinations, 4 of them insoluble.
- **Replay** — practicals E3.5 (FA1), E3.7 (FA2) and E3.9 (insoluble FA2), with their
  original procedures and questions.

Your attempt is saved as you type, so a reload does not lose it.

## Typography

The `Aa` button beside the theme toggle opens a panel with separate pickers for heading
and body fonts (15 families — the bundled defaults, system, and Google families including
Atkinson Hyperlegible and Lexend), a 90–130% text size slider, and a reading-comfort
toggle that loosens line height and letter spacing. Google families load only when first
chosen. Your choices persist across reloads.

## Development

```bash
node test.js   # zero-dependency checks over index.html
```

Edit `index.html` directly. `test.js` extracts marker-delimited script blocks
(`/* == QA-ENGINE-START == */` and friends) and asserts against them, so keep those
comments intact.
