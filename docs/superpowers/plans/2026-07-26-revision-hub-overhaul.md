# Revision Hub Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace legacy bundled HTML with a responsive, data-driven React study app for full Chemistry and Physics content parity.

**Architecture:** A Vite React SPA uses URL query state rather than path routing. Versioned JSON content is validated by Zod, then rendered through one typed lesson-block registry. Tools consume built-in JSON and persist only user-authored state in localStorage. One GitHub Actions workflow validates every commit and deploys the successful default-branch build to GitHub Pages.

**Tech Stack:** Bun, Vite, React, TypeScript, Tailwind CSS, shadcn/ui Base UI `base-nova`, shadcn/typeset, Zod, Vitest, Testing Library, GitHub Actions.

## Global Constraints

- Use Bun for all installation, scripts, tests, and CI commands.
- Use shadcn/ui `base-nova`, Base UI primitives, semantic tokens, and Lucide icons.
- Keep lesson source as JSON; only named, Zod-validated lesson blocks may render.
- Never render raw lesson HTML, scripts, event handlers, component names, style declarations, or executable code.
- Preserve all Chemistry and Physics topic groups, approximate lesson content, and existing tools; redesign every visual surface.
- Use query state: `?subject=<id>&topic=<id>`; do not introduce BrowserRouter paths or Pages redirects.
- Keep user state local to browser, versioned, and recover from corrupt storage.
- Maintain keyboard operation, visible focus, accessible names, 44px mobile targets, responsive tables, and meaningful figure alt text.
- Do not commit during implementation unless user explicitly asks.

---

## File Structure

```text
.github/workflows/pages.yml              # quality and dependent Pages deployment jobs
AGENTS.md                                # contributor and agent implementation constraints
README.md                                # setup, scripts, authoring, deployment
skills/SKILL.md                          # lesson authoring rules for future agents
index.html                               # Vite document shell
package.json                             # Bun scripts and dependencies
vite.config.ts                           # repository-aware Pages base path
src/
  main.tsx                               # React startup
  app/App.tsx                            # query-state shell and tool/lesson switching
  app/navigation.ts                      # safe URL state parsing and serialization
  app/theme.ts                           # system/default and persisted theme handling
  components/AppHeader.tsx               # subject selection and mobile menu trigger
  components/StudySidebar.tsx            # desktop topic navigation
  components/MobileTopicSheet.tsx        # mobile topic navigation
  content/*.json                         # chemistry, physics, quizzes, decks, elements
  features/lessons/schema.ts             # Zod schemas and exported content types
  features/lessons/load-content.ts       # validated JSON loader
  features/lessons/LessonRenderer.tsx    # typed lesson block registry
  features/lessons/LessonPage.tsx        # lesson reading surface
  features/periodic-table/*              # element grid and dialog/detail view
  features/quizzes/*                     # run, edit, import/export local quiz sets
  features/flashcards/*                  # study, edit, import/export local decks
  lib/local-storage.ts                   # versioned safe browser persistence seam
  styles/globals.css                     # Tailwind, tokens, Typeset import
  test/*.test.ts(x)                      # behavior contracts
```

### Task 1: Establish React, shadcn, and test foundation

**Files:**
- Create: `package.json`, `bun.lock`, `vite.config.ts`, `tsconfig.json`, `components.json`, `index.html`, `src/main.tsx`, `src/styles/globals.css`, `src/vite-env.d.ts`, `vitest.config.ts`
- Create: `src/test/setup.ts`, `src/test/navigation.test.ts`
- Delete after content migration: `Revision_Hub__Chemistry_and_Physics.html`

**Interfaces:**
- Produces `bun run dev`, `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.
- Produces `getBasePath(environment: Record<string, string | undefined>): string` from `vite.config.ts`.

- [ ] **Step 1: Write failing Vite base-path test**

```ts
import { expect, test } from "vitest";
import { getBasePath } from "../../vite.config";

test("uses repository base path in GitHub Actions", () => {
  expect(getBasePath({ GITHUB_ACTIONS: "true", GITHUB_REPOSITORY: "school/revision-hub" })).toBe("/revision-hub/");
});

test("uses root base path outside GitHub Actions", () => {
  expect(getBasePath({})).toBe("/");
});
```

- [ ] **Step 2: Run test to verify expected missing-module failure**

Run: `bun test src/test/navigation.test.ts`
Expected: FAIL because `vite.config.ts` does not exist.

- [ ] **Step 3: Initialize Vite React TypeScript with Bun and add shadcn base-nova/Base UI**

Run the current shadcn CLI with Bun. Create Vite/TypeScript configuration, Tailwind, aliases, `components.json`, and global CSS. Use `base-nova`, neutral tokens, CSS variables, Base UI, and Lucide. Add only initial primitives needed by the shell: Button, Card, Sheet, Select, Sidebar, Tooltip, Skeleton, Badge, Separator, Dialog, Table, Tabs, Accordion, Alert, Sonner.

- [ ] **Step 4: Implement repository-aware Vite base path**

```ts
export function getBasePath(environment: Record<string, string | undefined>) {
  if (environment.GITHUB_ACTIONS !== "true") return "/";
  const repository = environment.GITHUB_REPOSITORY?.split("/")[1];
  return repository ? `/${repository}/` : "/";
}
```

Pass `getBasePath(process.env)` to Vite `base`.

- [ ] **Step 5: Add scripts and test setup**

Add scripts for `dev`, `build`, `lint`, `typecheck`, `test`, and `validate-content`. Configure Vitest browser-like DOM support and Testing Library.

- [ ] **Step 6: Run checks**

Run: `bun test src/test/navigation.test.ts && bun run typecheck && bun run build`
Expected: all PASS.

### Task 2: Create validated content contract and migration inventory

**Files:**
- Create: `src/features/lessons/schema.ts`, `src/features/lessons/load-content.ts`, `src/features/lessons/validate-content.ts`
- Create: `src/content/chemistry.json`, `src/content/physics.json`, `src/content/quizzes.json`, `src/content/flashcards.json`, `src/content/elements.json`
- Create: `src/test/content-validation.test.ts`
- Create: `docs/content-parity.md`

**Interfaces:**
- Produces `validateContent(value: unknown): ContentCatalog`.
- Produces `loadContent(): ContentCatalog`.
- `Lesson` has `id`, `subject`, `title`, `summary`, `tags`, `blocks`.
- `LessonBlock` is discriminated by only `heading`, `richText`, `callout`, `comparison`, `table`, `figure`, `details`, `quizLink`, `flashcardLink`, `periodicTableLink`.

- [ ] **Step 1: Write failing content validation tests**

```ts
import { expect, test } from "vitest";
import { validateContent } from "@/features/lessons/schema";

test("accepts an allowlisted rich-text lesson block", () => {
  expect(validateContent({ subjects: [{ id: "chemistry", title: "Chemistry", lessons: [{ id: "cations", title: "Cations", summary: "", tags: [], blocks: [{ type: "richText", markdown: "# Test" }] }] }] }).subjects[0].lessons[0].blocks[0].type).toBe("richText");
});

test("rejects executable lesson blocks", () => {
  expect(() => validateContent({ subjects: [{ id: "chemistry", title: "Chemistry", lessons: [{ id: "cations", title: "Cations", summary: "", tags: [], blocks: [{ type: "script", code: "alert(1)" }] }] }] })).toThrow();
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `bun test src/test/content-validation.test.ts`
Expected: FAIL because content schema is missing.

- [ ] **Step 3: Implement Zod schemas and loader**

Use a discriminated union. Enforce non-empty unique IDs, figure alt text, table header/row width agreement, known `subject` values, and valid tool references. JSON imports feed `loadContent`; `validate-content` parses all content during CI.

- [ ] **Step 4: Extract legacy learning material into JSON**

Create complete subject/topic inventory from legacy app, including all visible Chemistry and Physics topic navigation entries, every lesson title, source figures/material references, built-in quiz sets, built-in flashcard decks, and periodic table data. Preserve lesson order and approximately equivalent material in named blocks. Record every legacy topic/tool and destination in `docs/content-parity.md`.

- [ ] **Step 5: Verify schema and content**

Run: `bun run validate-content && bun test src/test/content-validation.test.ts`
Expected: all PASS.

### Task 3: Implement URL state and resilient local persistence

**Files:**
- Create: `src/app/navigation.ts`, `src/app/theme.ts`, `src/lib/local-storage.ts`
- Create: `src/test/navigation.test.ts`, `src/test/local-storage.test.ts`

**Interfaces:**
- `readNavigation(search: string, catalog: ContentCatalog): NavigationState`
- `writeNavigation(state: NavigationState): string`
- `createStorage<T>(key: string, version: number, fallback: T): { read(): T; write(value: T): void; clear(): void }`

- [ ] **Step 1: Add failing navigation and persistence tests**

```ts
test("falls back to first topic for an unknown query", () => {
  expect(readNavigation("?subject=unknown&topic=nope", catalog)).toEqual({ subjectId: "chemistry", topicId: "mnemonics" });
});

test("drops corrupt persisted data", () => {
  localStorage.setItem("revision-hub:theme", "not-json");
  expect(themeStore.read()).toEqual("system");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `bun test src/test/navigation.test.ts src/test/local-storage.test.ts`
Expected: FAIL because modules are missing.

- [ ] **Step 3: Implement query parser and storage adapter**

Parse only `subject` and `topic`; validate against loaded catalog. Serialize through `URLSearchParams`. Store `{ version, data }`, catch parse errors, reject incompatible versions, and return immutable defaults. Keep DOM browser access inside storage methods.

- [ ] **Step 4: Implement system-first theme handling**

Use semantic class/token theme behavior. First render follows system preference; explicit choice persists using the adapter.

- [ ] **Step 5: Verify behavior**

Run: `bun test src/test/navigation.test.ts src/test/local-storage.test.ts`
Expected: PASS.

### Task 4: Implement lesson rendering and responsive app shell

**Files:**
- Create: `src/features/lessons/LessonRenderer.tsx`, `src/features/lessons/LessonPage.tsx`
- Create: `src/app/App.tsx`, `src/components/AppHeader.tsx`, `src/components/StudySidebar.tsx`, `src/components/MobileTopicSheet.tsx`
- Modify: `src/main.tsx`, `src/styles/globals.css`
- Create: `src/test/lesson-renderer.test.tsx`, `src/test/app-navigation.test.tsx`

**Interfaces:**
- `LessonRenderer({ blocks }: { blocks: LessonBlock[] }): JSX.Element`
- `App(): JSX.Element`

- [ ] **Step 1: Write failing renderer test**

```tsx
test("renders a semantic table block", () => {
  render(<LessonRenderer blocks={[{ type: "table", headers: ["Ion"], rows: [["Cu²⁺"]] }]} />);
  expect(screen.getByRole("columnheader", { name: "Ion" })).toBeVisible();
  expect(screen.getByRole("cell", { name: "Cu²⁺" })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun test src/test/lesson-renderer.test.tsx`
Expected: FAIL because renderer is missing.

- [ ] **Step 3: Implement only allowlisted block renderers**

Map every block type directly to semantic React markup and composed shadcn components. Render Markdown via an allowlist-only Markdown renderer; never enable raw HTML. `details` uses Accordion; `callout` uses Alert; `comparison` uses Card; tables are inside horizontal scroll container at narrow widths. Wrap document content in `<article className="typeset typeset-docs">`.

- [ ] **Step 4: Write failing app navigation test**

```tsx
test("updates selected topic in query state", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Cation Tests" }));
  expect(window.location.search).toContain("topic=cation-tests");
});
```

- [ ] **Step 5: Implement shell and mobile navigation**

Create compact header with subject selection, theme control, and mobile topic Sheet. Desktop has labeled persistent topic navigation. Topic selection updates query state with History API. Main content has breadcrumb, title, tags, contextual tool links. Add focus states, 44px touch targets, reduced-motion behavior, and token-only styling.

- [ ] **Step 6: Verify unit and responsive smoke checks**

Run: `bun test src/test/lesson-renderer.test.tsx src/test/app-navigation.test.tsx && bun run build`
Expected: PASS.

### Task 5: Rebuild periodic table explorer

**Files:**
- Create: `src/features/periodic-table/PeriodicTablePage.tsx`, `src/features/periodic-table/ElementDetail.tsx`
- Create: `src/test/periodic-table.test.tsx`

**Interfaces:**
- `PeriodicTablePage(): JSX.Element`
- `ElementDetail({ element }: { element: Element }): JSX.Element`

- [ ] **Step 1: Write failing element detail test**

```tsx
test("opens element details from accessible element button", async () => {
  render(<PeriodicTablePage />);
  await userEvent.click(screen.getByRole("button", { name: /Hydrogen/i }));
  expect(screen.getByRole("dialog", { name: /Hydrogen/i })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun test src/test/periodic-table.test.tsx`
Expected: FAIL because explorer is missing.

- [ ] **Step 3: Implement responsive explorer**

Render data-driven element buttons with accessible names and periodic positions. On small viewports use a horizontally scrollable grid without clipping labels. Use shadcn Dialog for details, including atomic number, symbol, category, and legacy-study-history content.

- [ ] **Step 4: Verify**

Run: `bun test src/test/periodic-table.test.tsx`
Expected: PASS.

### Task 6: Rebuild quizzes with local editing

**Files:**
- Create: `src/features/quizzes/QuizLibrary.tsx`, `src/features/quizzes/QuizPlayer.tsx`, `src/features/quizzes/QuizEditor.tsx`, `src/features/quizzes/quiz-storage.ts`
- Create: `src/test/quizzes.test.tsx`

**Interfaces:**
- `QuizLibrary(): JSX.Element`
- `QuizPlayer({ quiz }: { quiz: Quiz }): JSX.Element`
- `quizStore.read(): Quiz[]`, `quizStore.write(quizzes: Quiz[]): void`

- [ ] **Step 1: Write failing quiz behavior test**

```tsx
test("scores selected answer and moves to next question", async () => {
  render(<QuizPlayer quiz={quiz} />);
  await userEvent.click(screen.getByRole("radio", { name: "Zn²⁺" }));
  await userEvent.click(screen.getByRole("button", { name: "Next question" }));
  expect(screen.getByText("Score: 1 / 1")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun test src/test/quizzes.test.tsx`
Expected: FAIL because quiz UI is missing.

- [ ] **Step 3: Implement built-in and editable quiz flows**

Present built-in and local sets. Support 10/random/all question selection when source permits, radio answers, score/result, restart, create, duplicate, delete, and import/export JSON. Editor validates all required fields before storage. Use shadcn `Field` compositions and `AlertDialog` for destructive confirmations.

- [ ] **Step 4: Verify**

Run: `bun test src/test/quizzes.test.tsx`
Expected: PASS.

### Task 7: Rebuild flashcards with local editing

**Files:**
- Create: `src/features/flashcards/DeckLibrary.tsx`, `src/features/flashcards/FlashcardStudy.tsx`, `src/features/flashcards/DeckEditor.tsx`, `src/features/flashcards/deck-storage.ts`
- Create: `src/test/flashcards.test.tsx`

**Interfaces:**
- `DeckLibrary(): JSX.Element`
- `FlashcardStudy({ deck }: { deck: Deck }): JSX.Element`
- `deckStore.read(): Deck[]`, `deckStore.write(decks: Deck[]): void`

- [ ] **Step 1: Write failing flashcard study test**

```tsx
test("reveals answer then advances after Got it", async () => {
  render(<FlashcardStudy deck={deck} />);
  await userEvent.click(screen.getByRole("button", { name: "Reveal answer" }));
  expect(screen.getByText("Blue precipitate")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Got it" }));
  expect(screen.getByText("Card 2 of 2")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun test src/test/flashcards.test.tsx`
Expected: FAIL because deck UI is missing.

- [ ] **Step 3: Implement deck library, study flow, and editing**

Support subject filtering, recommended/local grouping, create, duplicate, delete, import/export, card editing, study reveal, review-again, and got-it actions. Persist custom data using local storage adapter.

- [ ] **Step 4: Verify**

Run: `bun test src/test/flashcards.test.tsx`
Expected: PASS.

### Task 8: Add CI/CD and repository guidance

**Files:**
- Create: `.github/workflows/pages.yml`, `AGENTS.md`, `skills/SKILL.md`
- Replace: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- `pages.yml` has `quality` and `deploy`; `deploy.needs` is `quality`.
- `README.md` documents exact Bun commands and Pages setup.

- [ ] **Step 1: Write workflow contract check**

```ts
test("Pages workflow deploy depends on quality", async () => {
  const workflow = await Bun.file(".github/workflows/pages.yml").text();
  expect(workflow).toContain("needs: quality");
  expect(workflow).toContain("actions/deploy-pages");
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun test src/test/workflow.test.ts`
Expected: FAIL because workflow is missing.

- [ ] **Step 3: Implement same-run Pages workflow**

Use `actions/checkout`, `oven-sh/setup-bun`, `bun install --frozen-lockfile`, quality scripts, Pages configuration, artifact upload, and `actions/deploy-pages`. Deploy only when `github.ref == format('refs/heads/{0}', github.event.repository.default_branch)` and after `quality`. Use `pages: write` and `id-token: write` only in deploy job.

- [ ] **Step 4: Document contributor and agent workflows**

`README.md` must document goals, local setup, scripts, JSON authoring, testing, and setting GitHub Pages source to GitHub Actions.

`AGENTS.md` must document repository map, query navigation, content safety, UI conventions, local storage contract, and mandatory checks.

`skills/SKILL.md` must teach agents exact JSON block rules, Markdown limits, figure/table accessibility, reference validation, and `bun run validate-content`.

- [ ] **Step 5: Verify workflow contract and docs paths**

Run: `bun test src/test/workflow.test.ts && bun run lint && bun run typecheck && bun run test && bun run validate-content && bun run build`
Expected: all PASS.

### Task 9: Perform end-to-end parity and mobile verification, then remove legacy bundle

**Files:**
- Delete: `Revision_Hub__Chemistry_and_Physics.html`
- Modify: `docs/content-parity.md`, `README.md`

- [ ] **Step 1: Compare completed app against parity inventory**

Verify every legacy Chemistry and Physics topic, source-material viewer, model-answer reveal, periodic table action, built-in quiz path, custom quiz path, built-in deck path, and custom deck path has a matching completed destination.

- [ ] **Step 2: Run browser smoke test**

Run development server and exercise desktop and mobile viewport flows: choose subject, open topic sheet, open a lesson, reveal an answer, open Periodic Table element dialog, complete quiz question, reveal flashcard, create then reload a custom quiz/deck. Confirm query URL selection persists on refresh.

- [ ] **Step 3: Remove legacy bundle only after parity passes**

Delete `Revision_Hub__Chemistry_and_Physics.html`, then update `docs/content-parity.md` and `README.md` to name React app as canonical source.

- [ ] **Step 4: Final verification**

Run: `bun run lint && bun run typecheck && bun run test && bun run validate-content && bun run build`
Expected: all PASS.
