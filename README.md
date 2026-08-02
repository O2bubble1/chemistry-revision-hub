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

Pick an unknown salt, run reagents on the bench, and write up what you observe in a
replica of the real practical paper. `Check my work` marks your observations against the
model answers. Practice mode randomises the unknown; replay mode reproduces practicals
E3.5, E3.7 and E3.9.

## Development

```bash
node test.js   # zero-dependency checks over index.html
```

Edit `index.html` directly. `test.js` extracts marker-delimited script blocks
(`/* == QA-ENGINE-START == */` and friends) and asserts against them, so keep those
comments intact.
