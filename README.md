# Chemistry & Physics Revision Hub

Mobile-first Chemistry and Physics revision hub. Lessons, quizzes, flashcards, and periodic-table study material are local, versioned data; no account or server is required.

## Stack

Bun, Vite, React, TypeScript, Tailwind CSS, shadcn/ui Base UI, Zod, and GitHub Pages.

## Start

```sh
bun install
bun run dev
```

## Quality checks

```sh
bun run lint
bun run typecheck
bun run test
bun run validate-content
bun run build
```

## Refresh migrated study data

The current quiz pools and starter decks were extracted from the legacy artifact. Regenerate them after intentional legacy-data changes:

```sh
bun run extract-legacy-study-data
```

The extractor converts legacy HTML snippets to plain text before writing JSON.

## Content

- Lessons: `src/content/lessons.json`
- Built-in quizzes: `src/content/quizzes.json`
- Built-in flashcards: `src/content/flashcards.json`
- Elements: `src/content/elements.json`

Lesson blocks are validated with Zod. Content supports only named blocks and Markdown text; raw HTML, scripts, styles, and arbitrary components are rejected. Read [`skills/SKILL.md`](skills/SKILL.md) before authoring.

Study state stays in browser localStorage. Query links such as `?subject=chemistry&topic=cation-tests` are refresh-safe on GitHub Pages.

## Deploy

Enable **Settings → Pages → Build and deployment → GitHub Actions**. `.github/workflows/pages.yml` runs checks, builds once, then deploys that validated `dist` artifact on pushes to `main`.

## Original materials

All 18 legacy posters, handouts, and concept-map sheets are extracted under `public/source-materials/` and presented as lazy-loaded, captioned, accessible figures in their relevant lessons. Every migrated lesson also retains the remaining legacy prose in a collapsed **Preserved source notes** section; model-answer notes render completed answers rather than legacy blank prompts. `/original-materials.html` remains available as the complete legacy viewer for source reference.
