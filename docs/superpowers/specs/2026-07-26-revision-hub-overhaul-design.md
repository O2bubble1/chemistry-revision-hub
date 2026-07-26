# Chemistry & Physics Revision Hub Redesign

## Goal

Replace the opaque single-file legacy page with a maintainable, mobile-first React study app. Preserve its Chemistry and Physics topic hierarchy, approximate lesson material, and existing study tools while rebuilding presentation with shadcn/ui.

## Product Scope

The first release delivers full Chemistry and Physics parity:

- Subject and topic navigation
- Lessons, concept tables, comparisons, figures, source-material viewers, and revealable model answers
- Periodic table explorer
- Built-in and user-created quizzes
- Built-in and user-created flashcards
- Theme selection and hidden-topic state

Do not copy legacy visual design, bundled runtime, or source layout. Do preserve learning sequence, content intent, and tool behaviour.

## Stack

- Bun: package manager, scripts, test runner
- Vite + React + TypeScript
- Tailwind CSS and shadcn/ui `base-nova` with Base UI primitives
- Lucide icons
- Zod for local JSON content validation
- shadcn/typeset for article typography
- GitHub Actions and GitHub Pages

No server, accounts, CMS, database, or third-party runtime API.

## App Architecture

```text
src/
  app/                  app shell, query-state navigation, responsive layout
  components/           app-specific composed UI
  components/ui/        shadcn-generated source components
  content/              JSON lessons, quizzes, flashcard decks, elements
  features/
    lessons/            schema, loader, block registry, lesson renderer
    periodic-table/     explorer and element detail UI
    quizzes/            built-in quiz and local editable quiz flows
    flashcards/         built-in deck and local editable deck flows
  lib/                  local storage adapter, utilities
```

`LessonRenderer` is the deep module seam. It receives a validated `Lesson` and renders every supported block. Callers do not need block-specific rendering knowledge.

## Content Contract

All source content is versioned JSON inside `src/content/`. The build validates every file with Zod before rendering.

Permitted lesson blocks:

- `heading`
- `richText` — Markdown only
- `callout`
- `comparison`
- `table`
- `figure`
- `details`
- `quizLink`
- `flashcardLink`
- `periodicTableLink`

Content cannot include raw HTML, scripts, event handlers, arbitrary component names, executable code, styles, or URLs outside approved figure/source fields. Unknown blocks and invalid references fail validation.

Use semantic HTML from block renderers. Wrap lesson output in `typeset typeset-docs`; this styles headings, prose, lists, tables, figures, and static code consistently from theme tokens. Do not use Typeset for navigation, cards, dialogs, controls, or tool-specific interfaces.

## User Experience

Desktop presents a persistent subject/topic sidebar and compact header. Mobile presents the same hierarchy through a labeled Sheet navigator with touch targets at least 44px. Main reading area includes a breadcrumb, title, topic tags, typeset lesson content, and contextual tool links.

Use shadcn components rather than custom substitutes: `Sidebar` or navigation composition, `Sheet`, `Card`, `Tabs`, `Dialog`, `Alert`, `Accordion`, `Table`, `Badge`, `Button`, `Tooltip`, and `sonner` as appropriate. Use semantic theme tokens only. Respect system theme initially; persist explicit user selection.

Every interactive control must work by keyboard, retain visible focus, expose an accessible name, and avoid hover-only actions. Images require meaningful alternative text. Tables need headers and remain usable on narrow screens.

## Navigation and GitHub Pages

The app uses stateful navigation through URL search parameters, for example:

```text
?subject=chemistry&topic=cation-tests
```

This gives linkable, refresh-safe study locations without React BrowserRouter path handling, hash routes, or a Pages `404.html` fallback. Invalid or absent parameters resolve to a default subject and its first lesson.

Vite must build with `/` locally and repository-aware `base` in GitHub Actions so asset URLs work at `https://<owner>.github.io/<repository>/`.

## Local Study State

Persist only on the current browser through a small versioned localStorage adapter:

- Theme preference
- Hidden topics
- User-created and edited quizzes
- User-created and edited flashcard decks

Built-in data remains immutable JSON. Corrupt or unsupported local state is discarded and recreated from defaults. No user data leaves the device.

## Validation and CI/CD

Use one GitHub Actions workflow so deploy always consumes the build that passed quality checks for the same commit:

1. `quality` runs on pull requests and pushes: Bun install with frozen lockfile, lint, typecheck, tests, production build.
2. `deploy` has `needs: quality`, runs only for default-branch pushes, uploads that job's `dist` artifact with the official Pages artifact action, then deploys through the official Pages deploy action.

Deploy permissions are least privilege: `pages: write` and `id-token: write` only in deployment context. Configure Pages source as GitHub Actions.

## Documentation

- `README.md`: app purpose, Bun commands, content location, local development, test/build checks, GitHub Pages deployment.
- `AGENTS.md`: repository map, architecture constraints, validation commands, contributor rules.
- `skills/SKILL.md`: lesson authoring guidance for agents: JSON schema, permitted blocks, Markdown limits, accessibility rules for figures/tables, and validation command.

## Migration and Completion

Extract and normalize legacy Chemistry and Physics learning material into JSON before deleting `Revision_Hub__Chemistry_and_Physics.html`. Check every legacy topic and tool against a parity inventory. Delete legacy artifact only when React app renders validated content and all listed tools work.

## Non-Goals

- User accounts and cross-device sync
- Headless CMS and browser content authoring
- Arbitrary HTML or executable interactive lesson content
- React path routing or Pages rewrite workarounds
- Pixel replication of legacy design
