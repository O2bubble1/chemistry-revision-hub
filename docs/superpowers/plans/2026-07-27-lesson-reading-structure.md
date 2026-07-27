# Lesson Reading Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore consistent lesson-block spacing and turn every existing Chemistry and Physics full note into scanable semantic blocks without losing a source sentence.

**Architecture:** Keep the Zod lesson schema and renderer’s existing block vocabulary. Add a direct-child wrapper contract for non-prose renderer blocks; CSS supplies the standard lesson rhythm. Restructure immutable `lessons.json` in subject-sized batches, validating visible source parity after every batch.

**Tech Stack:** Bun, React 19, TypeScript, Tailwind CSS, shadcn Base UI, Zod, Vitest, Testing Library.

## Global Constraints

- Keep query navigation, local-only study state, existing source galleries, archive viewer, and all academic/source text.
- Never add raw HTML, script, styles, event handlers, arbitrary component names, routes, dependencies, or block types.
- Use only `heading`, `richText`, `table`, `comparison`, and `callout` to restructure notes.
- Keep model-answer content complete; do not deduplicate it.
- Preserve lesson-local source parity; run `src/test/legacy-notes.test.ts` after every JSON batch.
- Add no visual brand changes. Use the standard `--typeset-flow` value for vertical rhythm.

---

### Task 1: Restore renderer-owned block rhythm

**Files:**
- Modify: `src/features/lessons/LessonRenderer.tsx:19-45`
- Modify: `src/typeset.css:14-32`
- Modify: `src/test/lesson-renderer.test.tsx`

**Interfaces:**
- Produces `data-lesson-block` on every rendered lesson block root.
- Non-prose block roots (`callout`, `comparison`, `table`, `figure`, `figureGallery`, and tool links) receive the `typeset-block` class.
- `.typeset-docs > .typeset-block` owns `margin-block: var(--typeset-flow)`.

- [ ] **Step 1: Write a failing renderer contract**

```tsx
test("marks adjacent callout and comparison roots for shared lesson rhythm", () => {
  const { container } = render(<LessonRenderer blocks={[
    { type: "callout", title: "Decide", body: "Choose a method.", tone: "tip" },
    { type: "comparison", items: [{ title: "A", body: "First" }, { title: "B", body: "Second" }] },
  ]} />)

  expect(container.querySelector('[data-lesson-block="callout"]')).toHaveClass("typeset-block")
  expect(container.querySelector('[data-lesson-block="comparison"]')).toHaveClass("typeset-block")
})
```

- [ ] **Step 2: Run the focused test and verify red**

Run: `bunx vitest run src/test/lesson-renderer.test.tsx`

Expected: failure because no renderer-owned block marker exists.

- [ ] **Step 3: Render each block through a direct-child wrapper**

Refactor `LessonRenderer` so each mapped block returns this outer shape, preserving current child components and `key`:

```tsx
<div key={key} data-lesson-block={block.type} className={
  block.type === "richText" || block.type === "heading" ? undefined : "typeset-block"
}>
  {content}
</div>
```

Build `content` from the existing switch cases. Keep `figure`, `figureGallery`, `table`, `comparison`, `callout`, and tool-link content unchanged inside the wrapper. Do not use component-internal alert, card, accordion, or table selectors for spacing.

- [ ] **Step 4: Add shared direct-child CSS**

Add this rule after existing prose margin rules in `src/typeset.css`:

```css
.typeset-docs > .typeset-block { margin-block: var(--typeset-flow); }
```

Do not add margins to `.typeset-block` descendants.

- [ ] **Step 5: Verify green**

Run: `bunx vitest run src/test/lesson-renderer.test.tsx && bun run typecheck`

Expected: renderer tests and TypeScript pass.

- [ ] **Step 6: Commit**

```sh
git add src/features/lessons/LessonRenderer.tsx src/typeset.css src/test/lesson-renderer.test.tsx
git commit -m "fix: restore lesson block rhythm"
```

### Task 2: Restructure Chemistry diagnostic and rule lessons

**Files:**
- Modify: `src/content/lessons.json` lessons `mnemonics`, `cation-tests`, `anion-tests`, `gas-tests`, `qa-strategy`, and `solubility-rules` under Chemistry
- Create: `src/test/lesson-structure.test.ts`
- Test: `src/test/legacy-notes.test.ts`

**Interfaces:**
- Chemistry diagnostic data renders through existing semantic `table`, `comparison`, `heading`, and `richText` blocks.
- New structure test consumes `catalog` and asserts required named blocks without inspecting source text.

- [ ] **Step 1: Write failing Chemistry structure tests**

```tsx
test("gives Chemistry diagnostic data semantic tables", () => {
  expect(lesson("chemistry", "cation-tests").blocks.some((block) => block.type === "table")).toBe(true)
  expect(lesson("chemistry", "anion-tests").blocks.some((block) => block.type === "table")).toBe(true)
  expect(lesson("chemistry", "gas-tests").blocks.some((block) => block.type === "table")).toBe(true)
})

test("gives Chemistry rule notes section anchors", () => {
  expect(lesson("chemistry", "qa-strategy").blocks.some((block) => block.type === "heading" && block.level === 3)).toBe(true)
  expect(lesson("chemistry", "solubility-rules").blocks.some((block) => block.type === "heading" && block.text === "The Always-Soluble Squad")).toBe(true)
})
```

Define `lesson(subjectId, lessonId)` once in the test file by finding the validated catalog subject and lesson; throw if either is absent.

- [ ] **Step 2: Run focused test and verify red**

Run: `bunx vitest run src/test/lesson-structure.test.ts`

Expected: failure for missing semantic tables and heading blocks.

- [ ] **Step 3: Convert Chemistry diagnostic content without loss**

In each named lesson, preserve every existing sentence in order while:

- promoting Cation, Anion, and Gas test rows from flat rich text into `table` blocks with their present column labels and rows;
- retaining ion equations, test instructions, and unique confusion tips in `richText` beneath their own level-3 headings;
- splitting QA Strategy into `Physical observation`, `Cation test`, `Anion test`, and `Gas test` headings; fix `Physical ObservationLook` to `Physical Observation\n\nLook`;
- splitting Mnemonics and Solubility Rules at their existing named mnemonic groups; use `The Always-Soluble Squad` as a level-3 heading;
- retaining all memory phrases and chemical notation exactly.

Never repeat a compact table as a prose table in the same lesson; retain any unique explanatory prose once in its logical section.

- [ ] **Step 4: Verify green and source parity**

Run: `bunx vitest run src/test/lesson-structure.test.ts src/test/legacy-notes.test.ts && bun run validate-content`

Expected: semantic-structure contracts pass; legacy textual landmarks remain visible and validator succeeds.

- [ ] **Step 5: Commit**

```sh
git add src/content/lessons.json src/test/lesson-structure.test.ts
git commit -m "feat: structure Chemistry diagnostic notes"
```

### Task 3: Restructure Chemistry preparation, bonding, and indicator lessons

**Files:**
- Modify: `src/content/lessons.json` lessons `salt-prep`, `oxides`, `bonding`, `model-answers`, `ph-indicators`, and `periodic-table` under Chemistry
- Modify: `src/test/lesson-structure.test.ts`
- Test: `src/test/legacy-notes.test.ts`

**Interfaces:**
- Salt preparation preserves precipitation, excess-solid, titration, reagent-choice, and worked-example content as separate scanable sections.
- Bonding property facts render with `table`/`comparison`; pH indicator values and inequality notation stay exact.

- [ ] **Step 1: Extend the failing structure tests**

```tsx
test("gives Chemistry preparation and bonding notes scanable structure", () => {
  expect(lesson("chemistry", "salt-prep").blocks.filter((block) => block.type === "heading" && block.level === 3).length).toBeGreaterThan(2)
  expect(lesson("chemistry", "bonding").blocks.some((block) => block.type === "table")).toBe(true)
  expect(lesson("chemistry", "bonding").blocks.some((block) => block.type === "comparison")).toBe(true)
})

test("keeps pH inequality notation readable", () => {
  expect(JSON.stringify(lesson("chemistry", "ph-indicators").blocks)).toContain("< 7")
  expect(JSON.stringify(lesson("chemistry", "ph-indicators").blocks)).toContain("> 7")
})
```

- [ ] **Step 2: Run the focused test and verify red**

Run: `bunx vitest run src/test/lesson-structure.test.ts`

Expected: failures for missing semantic blocks or malformed pH notation.

- [ ] **Step 3: Restructure the Chemistry batch**

- Split Salt Prep into level-3 method, reactivity, and worked-example sections. Keep unique procedure detail and examples; retain the existing top comparison as quick reference rather than duplicating it below.
- Give Oxides its existing acidic, basic, amphoteric, and neutral sections level-3 headings.
- Promote Bonding’s property matrix to `table`; represent ionic/covalent or diamond/graphite contrasts with existing `comparison` blocks; retain every definition once in source order.
- Keep all Model Answers. Split its concept-map and salt-preparation answers into named level-3 sections and use `callout` only for existing definitions that need emphasis.
- Preserve the pH table and axis text; repair malformed inequalities to `< 7` and `> 7`.
- Leave concise Periodic Table content unchanged except for heading normalization if needed.

- [ ] **Step 4: Verify green and source parity**

Run: `bunx vitest run src/test/lesson-structure.test.ts src/test/legacy-notes.test.ts src/test/lesson-renderer.test.tsx && bun run validate-content`

Expected: all tests pass and every source landmark remains normal visible content.

- [ ] **Step 5: Commit**

```sh
git add src/content/lessons.json src/test/lesson-structure.test.ts
git commit -m "feat: structure Chemistry full notes"
```

### Task 4: Restructure Physics motion and force lessons

**Files:**
- Modify: `src/content/lessons.json` lessons `mnemonics`, `kinematics`, `motion-graphs`, `equations-of-motion`, `forces-weight`, and `newtons-laws` under Physics
- Modify: `src/test/lesson-structure.test.ts`
- Test: `src/test/legacy-notes.test.ts`

**Interfaces:**
- Physics quantities, graph interpretation, equations, and force data use semantic `table`, `comparison`, and `callout` blocks.
- Existing warnings become `callout` text without wording changes.

- [ ] **Step 1: Extend failing Physics structure tests**

```tsx
test("gives Physics motion and force data semantic structure", () => {
  for (const lessonId of ["kinematics", "motion-graphs", "forces-weight", "newtons-laws"]) {
    expect(lesson("physics", lessonId).blocks.some((block) => block.type === "table")).toBe(true)
  }
  expect(lesson("physics", "equations-of-motion").blocks.some((block) => block.type === "callout" && block.tone === "warning")).toBe(true)
})
```

- [ ] **Step 2: Run focused test and verify red**

Run: `bunx vitest run src/test/lesson-structure.test.ts`

Expected: failure because current Physics notes embed the target structures in `richText`.

- [ ] **Step 3: Restructure motion and force content**

- Kinematics: promote quantity/definition/SI-unit/type/symbol rows and examiner-trap pairs; use headings for scalar/vector and speed/velocity sections; promote existing negative-acceleration warning to `warning` callout.
- Motion Graphs: promote displacement-time and velocity-time interpretation rows into tables with current labels and descriptions.
- Equations of Motion: retain all four equations and selection guidance; promote the existing uniform-acceleration health warning to `warning` callout.
- Forces & Weight: promote mass/weight and gravitational-field definitions into tables or comparisons.
- Newton’s Laws: promote balanced/unbalanced forces, inertia examples, force-finding methods, and free-body rules into existing semantic blocks.
- Keep every equation, unit, graph reading, and source statement in the same lesson.

- [ ] **Step 4: Verify green and source parity**

Run: `bunx vitest run src/test/lesson-structure.test.ts src/test/legacy-notes.test.ts && bun run validate-content`

Expected: Physics semantic contracts, complete source parity, and Zod validation pass.

- [ ] **Step 5: Commit**

```sh
git add src/content/lessons.json src/test/lesson-structure.test.ts
git commit -m "feat: structure Physics motion notes"
```

### Task 5: Restructure Physics energy, terminal velocity, model-answer, and practice lessons

**Files:**
- Modify: `src/content/lessons.json` lessons `friction-terminal-velocity`, `work-energy-power`, `energy-resources`, `model-answers`, and `worked-examples` under Physics
- Modify: `src/test/lesson-structure.test.ts`
- Test: `src/test/legacy-notes.test.ts`

**Interfaces:**
- Energy-resource rows and work/energy data use `table`/`comparison` blocks; current exam advice uses named `callout` blocks.
- Physics Model Answers stays a complete consolidated reference.

- [ ] **Step 1: Extend failing final-batch structure tests**

```tsx
test("gives Physics energy and terminal-velocity notes semantic structure", () => {
  expect(lesson("physics", "work-energy-power").blocks.some((block) => block.type === "table")).toBe(true)
  expect(lesson("physics", "energy-resources").blocks.some((block) => block.type === "table")).toBe(true)
  expect(lesson("physics", "friction-terminal-velocity").blocks.some((block) => block.type === "comparison")).toBe(true)
})
```

- [ ] **Step 2: Run focused test and verify red**

Run: `bunx vitest run src/test/lesson-structure.test.ts`

Expected: failure because current data is still inside monolithic rich-text notes.

- [ ] **Step 3: Restructure final Physics batch**

- Friction/Terminal Velocity: use comparisons for useful/unwanted friction effects and terminal-velocity factors; promote the current wording distinction between constant velocity and maximum speed to a `tip` callout.
- Work/Energy/Power: promote six stores, transfer pathways, and work-done scenarios into tables; promote the existing prohibited-store vocabulary warning without changing its wording.
- Energy Resources: promote renewable/non-renewable resource rows into tables; preserve every advantage, disadvantage, and Singapore trilemma statement once in its lesson.
- Model Answers: split lettered answer sections with level-3 headings; preserve every mark-scheme answer and deliberate consolidation.
- Worked Examples: retain scenarios and methods, separating the short introduction from examples with headings only where that clarifies a named method.

- [ ] **Step 4: Verify green and source parity**

Run: `bunx vitest run src/test/lesson-structure.test.ts src/test/legacy-notes.test.ts src/test/lesson-renderer.test.tsx && bun run validate-content`

Expected: final semantic structure contracts pass; all source text remains in normal lesson flow.

- [ ] **Step 5: Commit**

```sh
git add src/content/lessons.json src/test/lesson-structure.test.ts
git commit -m "feat: structure Physics full notes"
```

### Task 6: Verify reading flow and publish

**Files:**
- Modify only if verification exposes a specific regression.
- Test: all repository checks.

- [ ] **Step 1: Browser-smoke critical reading flows**

At desktop and 390px mobile, verify:

1. Salt Prep: `Decide the method` has visible separation from comparison cards; cards remain two-column desktop and single-column mobile.
2. Chemistry: Cation Tests and Bonding expose semantic table headings and scanable level-3 sections.
3. Physics: Kinematics and Work/Energy/Power expose semantic table headings; Equations of Motion displays its uniform-acceleration warning.
4. Figure galleries remain optional; complete text is visible without expanding them.
5. No full-page horizontal overflow outside intended table/grid scrollers.

- [ ] **Step 2: Run required handoff checks**

Run:

```sh
bun run extract-legacy-study-data
bun run lint
bun run typecheck
bun run test
bun run validate-content
bun run build
```

Expected: every command exits zero; full source parity remains green.

- [ ] **Step 3: Commit and publish**

```sh
git add src/content/lessons.json src/features/lessons/LessonRenderer.tsx src/typeset.css src/test/lesson-renderer.test.tsx src/test/lesson-structure.test.ts
git commit -m "feat: improve lesson reading structure"
env -u GITHUB_TOKEN git push origin main
```

Expected: Pages workflow validates, builds, publishes `docs/`, and the live site serves semantic full notes.
