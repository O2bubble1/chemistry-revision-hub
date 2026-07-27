# Surface Content & Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface every original textual lesson section in the React reading experience and unify study-tool UI into one coherent, responsive product.

**Architecture:** Built-in JSON remains the curriculum source. A reproducible migration transforms legacy-note `details` blocks into visible `heading` + `richText` blocks, while source scans remain optional figure galleries. The renderer continues to accept only validated named blocks. A small shared page-header/layout layer removes repeated visual rules across feature views.

**Tech Stack:** Bun, TypeScript, React 19, Vite, Tailwind CSS 4, shadcn Base UI, Zod, Vitest.

## Global Constraints

- Lesson URLs remain query-only: `?subject=<id>&topic=<id>`.
- Built-in content remains immutable JSON; no raw HTML, inline JavaScript, inline styles, arbitrary components, server calls, accounts, or route migration.
- Every textual lesson section detected directly from `Revision_Hub__Chemistry_and_Physics.html` must be surface-level reading content; only scans/posters/handouts may be collapsed under a labeled source-material gallery.
- Reuse shadcn Base UI primitives and semantic tokens; keep visible focus and 44px touch controls.
- Preserve `original-materials.html` archive and Pages publishing workflow.

---

### Task 1: Surface archived lesson notes reproducibly

**Files:**
- Create: `scripts/surface-legacy-lesson-notes.ts`
- Modify: `package.json`
- Modify: `src/content/lessons.json`
- Modify: `src/features/lessons/schema.ts`
- Modify: `src/features/lessons/LessonRenderer.tsx`
- Modify: `src/test/legacy-notes.test.ts`
- Modify: `src/test/lesson-renderer.test.tsx`

**Interfaces:**
- Consumes: every non-scan `details` block in `src/content/lessons.json`, including `Preserved source notes` and any short textual definitions.
- Produces: visible `heading` and `richText` blocks in the same position and order; built-in content has no text-bearing `details` block.

- [ ] **Step 1: Add a failing source-derived parity test**

```ts
test("surfaces every legacy textual lesson section", async () => {
  const expected = await extractLegacyLessonInventory("Revision_Hub__Chemistry_and_Physics.html")
  expect(visibleLessonInventory(catalog)).toMatchObject(expected)
  expect(allLessonBlocks(catalog).some((block) => block.type === "details")).toBe(false)
})
```

The inventory extractor must read the bundled HTML template directly, map every legacy lesson section to its React subject/topic, and return normalized textual landmarks. It must not derive expected values from existing React JSON.

- [ ] **Step 2: Run targeted test and confirm failure**

Run: `bunx vitest run src/test/legacy-notes.test.ts`

Expected: failure because the current JSON still contains `Preserved source notes` disclosure blocks.

- [ ] **Step 3: Add deterministic transformation script**

```ts
const noteSummary = "Preserved source notes"

function surfaceNote(lesson: Lesson, block: DetailsBlock): LessonBlock[] {
  const markdown = block.markdown.replace(new RegExp(`^${escapeRegExp(lesson.title)}\\n+`), "")
  return [
    { type: "heading", text: "Complete study notes", level: 2 },
    { type: "richText", markdown },
  ]
}
```

The script reads JSON, converts every non-scan textual `details` block into a visible heading plus rich text, writes formatted JSON with a trailing newline, and fails if a text-bearing disclosure remains. Add script command `surface-legacy-lesson-notes` to `package.json`.

- [ ] **Step 4: Run migration and update schema/renderer**

Run: `bun run surface-legacy-lesson-notes`

Remove `detailsBlock` from `lessonBlockSchema` and the `details` renderer case. Keep safe Markdown rendering. Do not add a generic expansion mode for textual notes.

- [ ] **Step 5: Run targeted regressions**

Run: `bunx vitest run src/test/legacy-notes.test.ts src/test/lesson-renderer.test.tsx && bun run validate-content`

Expected: all pass; validator reports two subjects and complete lesson catalog.

### Task 2: Preserve optional scanned source materials separately

**Files:**
- Modify: `src/features/lessons/schema.ts`
- Modify: `src/features/lessons/LessonRenderer.tsx`
- Modify: `src/content/lessons.json`
- Modify: `src/test/original-materials.test.ts`
- Modify: `src/test/lesson-renderer.test.tsx`

**Interfaces:**
- Adds optional `figureGallery` block: `{ type: "figureGallery", summary: string, figures: Array<{ src: string; alt: string; caption?: string }> }`.
- Gallery contains source scans only; substantive textual content must not depend on it.

- [ ] **Step 1: Add failing renderer contract**

```tsx
test("renders source scans in an optional labelled gallery", () => {
  render(<LessonRenderer blocks={[{ type: "figureGallery", summary: "Original source materials", figures: [{ src: "/source-materials/example.jpg", alt: "Original handout" }] }]} />)
  expect(screen.getByRole("button", { name: "Original source materials" })).toBeVisible()
  expect(screen.queryByRole("img", { name: "Original handout" })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run targeted test and confirm failure**

Run: `bunx vitest run src/test/lesson-renderer.test.tsx`

Expected: failure because `figureGallery` is not a validated/rendered block.

- [ ] **Step 3: Add the narrow schema and renderer**

Use the existing Accordion primitive only for `figureGallery`. Its panel maps `figures` through the existing figure markup, `loading="lazy"`, caption styling, and base-path resolver. Do not create an image viewer or raw HTML pathway.

- [ ] **Step 4: Move source scans into galleries only where already linked to their lesson**

Replace each related top-level `figure` with a same-location gallery block named `Original source materials`. Keep concise alt text and captions. Do not add scans without a lesson relationship.

- [ ] **Step 5: Run source-material regressions**

Run: `bunx vitest run src/test/original-materials.test.ts src/test/lesson-renderer.test.tsx && bun run validate-content`

Expected: all extracted assets resolve, galleries validate, and textual notes stay surface-level.

### Task 3: Unify study-product presentation

**Files:**
- Create: `src/components/PageHeader.tsx`
- Modify: `src/App.tsx`
- Modify: `src/features/quizzes/QuizPage.tsx`
- Modify: `src/features/flashcards/FlashcardsPage.tsx`
- Modify: `src/features/periodic-table/PeriodicTablePage.tsx`
- Modify: `src/features/lessons/LessonRenderer.tsx`
- Modify: `src/components/ui/alert.tsx`
- Modify: `src/index.css`
- Modify: `src/typeset.css`
- Test: `src/test/app-shell.test.tsx`
- Test: `src/test/contextual-tools.test.tsx`

**Interfaces:**
- `PageHeader` accepts `{ eyebrow?: string; title: string; summary?: string; actions?: ReactNode }`.
- All top-level feature pages own one H1 through `PageHeader`.

- [ ] **Step 1: Add failing shared-layout tests**

```tsx
test("keeps tool shortcuts out of their destination pages", async () => {
  render(<App />)
  await user.click(screen.getByRole("button", { name: "Quiz" }))
  expect(screen.queryByRole("button", { name: "Quiz" })).not.toBeInTheDocument()
  expect(screen.getByRole("heading", { name: "Quizzes" })).toBeVisible()
})
```

Add equivalent assertions for a visible lesson breadcrumb/header and a labeled periodic-table mobile cue.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `bunx vitest run src/test/app-shell.test.tsx src/test/contextual-tools.test.tsx`

Expected: failure because tool shortcuts currently remain above destination views and headers are locally inconsistent.

- [ ] **Step 3: Implement shared header and page rhythm**

```tsx
export function PageHeader({ eyebrow, title, summary, actions }: PageHeaderProps) {
  return <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      {eyebrow ? <p className="mb-2 text-sm text-muted-foreground">{eyebrow}</p> : null}
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {summary ? <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{summary}</p> : null}
    </div>
    {actions}
  </header>
}
```

Render shortcuts only in lesson view. Give all feature pages a compatible `mx-auto max-w-5xl` outer reading surface; retain narrower inner cards only when task-focused.

- [ ] **Step 4: Standardize controls and semantic callouts**

Use existing shadcn Select in Flashcards subject filtering. Apply one input class convention to quiz and flashcard editor forms. Map `info`, `tip`, and `warning` callout tone to Alert variants/classes with label text retained. Add `Swipe the table horizontally to explore all elements` before the small-screen periodic table scroller.

- [ ] **Step 5: Run focused UI tests**

Run: `bunx vitest run src/test/app-shell.test.tsx src/test/contextual-tools.test.tsx src/test/flashcards.test.tsx src/test/quizzes.test.tsx`

Expected: all pass with shared header, contextual tools, and control consistency preserved.

### Task 4: Redesign periodic-table exploration

**Files:**
- Modify: `src/features/periodic-table/PeriodicTablePage.tsx`
- Modify: `src/index.css`
- Test: `src/test/periodic-table.test.tsx`

**Interfaces:**
- Element cells remain native focusable buttons with their existing accessible name.
- `selected` element renders into a persistent `aria-live="polite"` detail panel in the upper-middle grid gap; no `Dialog`.

- [ ] **Step 1: Add a failing inline-detail test**

```tsx
test("updates the persistent periodic-table detail panel", async () => {
  const user = userEvent.setup()
  render(<PeriodicTablePage />)
  await user.click(screen.getByRole("button", { name: /hydrogen/i }))
  expect(screen.getByRole("region", { name: "Selected element" })).toHaveTextContent("Hydrogen")
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
})
```

Add assertions that the Hydrogen cell contains atomic number, `H`, name, and relative atomic mass.

- [ ] **Step 2: Run test and confirm failure**

Run: `bunx vitest run src/test/periodic-table.test.tsx`

Expected: failure because details currently open in a dialog and cells omit full conventional element labels.

- [ ] **Step 3: Replace dialog with a persistent grid panel**

Render the selected-element panel as an `aside`/`region` spanning upper-middle empty grid columns and rows. Give it a default instructional state, then update its atomic number, mass, shells, period/group, category, and note from the selected focusable button's `onClick` and `onFocus` handlers. Keep `aria-live="polite"` on the changing facts, not the whole page.

Render each button with a conventional visual hierarchy: atomic number top-left, large symbol center, name and rounded mass beneath. Derive a category class from the existing `category` string using a local `Record<string, string>` of semantic Tailwind token tints; do not add raw color values to JSON.

- [ ] **Step 4: Add responsive table cue**

Keep the real 18-group grid and horizontal small-screen overflow. Place clear `Swipe horizontally to explore all elements` helper text before the scroller and retain the full persistent panel above it at every width.

- [ ] **Step 5: Run periodic-table regressions**

Run: `bunx vitest run src/test/periodic-table.test.tsx && bun run typecheck`

Expected: element selection/focus updates panel without a modal, standard cell labels render, and types pass.

### Task 5: Verify complete content and finished UI

**Files:**
- Modify: `README.md`
- Modify: `docs/content-parity.md`
- Test: existing test suite

- [ ] **Step 1: Update parity documentation after verification**

Replace any claim that source notes are collapsed with explicit surface-level status. Document optional source-material galleries and retained archive link.

- [ ] **Step 2: Browser smoke test long lessons and tools**

Run development server. Check a long Chemistry lesson, a long Physics lesson, all tool pages, and the periodic table at 390px and desktop. Confirm no textual content uses accordion disclosure, headings remain hierarchical, no horizontal overflow outside intentional periodic-table scroller, and gallery scans remain optional.

- [ ] **Step 3: Run full required checks**

```sh
bun run extract-legacy-study-data
bun run lint
bun run typecheck
bun run test
bun run validate-content
bun run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit and publish**

```sh
git add src scripts package.json README.md docs
git commit -m "feat: surface complete study content"
env -u GITHUB_TOKEN git push origin main
```

Expected: Pages workflow validates, builds, publishes `docs/`, and live site serves complete content.
