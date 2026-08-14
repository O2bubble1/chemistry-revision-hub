# Chemistry Revision Hub

A single-file revision hub for O-Level / IP Chemistry, Physics and Computing.
Live at <https://o2bubble1.github.io/chemistry-revision-hub/>.

Everything is `index.html` — open it in a browser and it works. No build step, no
dependencies, no server. Fonts are inlined as data URIs so it works offline.

## What's in it

- **Chemistry** — qualitative analysis (cations, anions, gases), a practical simulator,
  salt preparation, solubility rules, pH indicators, oxides, bonding, a clickable periodic table
- **Physics** — kinematics, motion graphs, equations of motion, forces, Newton's laws,
  friction, work/energy/power
- **Computing** — Python data structures (lists, tuples, dictionaries, sets, equality vs
  identity), file operations and CSV handling, sorting and searching algorithms, complexity,
  a built-in function reference, and a code memorisation drill
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

## Useful Functions

A reference for the built-ins and methods that save the most time: conversions, `round` /
`sum` / `min` / `max`, `enumerate` / `zip` / `any` / `all`, the string methods that do the
work in every file-parsing question, and the list, dictionary, set and file methods worth
knowing by heart. It ends with a table of the mistakes these functions cause — `.sort()`
returning `None`, `int()` truncating rather than rounding, `str(4.5)` not giving `4.50` —
and a set of one-liners worth memorising.

It opens with the rule that matters most: these are banned in any task that says *implement
the algorithm yourself*, and free everywhere else.

## Memorise the Code

Computing is examined on writing sort algorithms from memory, so reading them is not
enough. The `Memorise the Code` tab shows each function with its load-bearing tokens
blanked out — loop bounds, comparisons, the swap, the base case, the pivot partition —
and you tap a blank to reveal it. It reuses the same reveal system as the Chemistry and
Physics model-answer pages.

Required: all seven sort functions — bubble sort (plain and the improved version with the
`swapped` flag), insertion, selection, `merge`, merge sort and quick sort. A second tier
covers the four search functions: unordered and ordered linear search, and binary search
both iteratively and recursively.

Each function carries a short note on what the loops actually count and where the
off-by-one lives, and the Complexity page tabulates best, average, worst, space and
in-place for every algorithm on one table.

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
