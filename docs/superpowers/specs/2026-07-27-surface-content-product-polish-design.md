# Surface Content & Product Polish Design

## Goal

Make every substantive lesson note from `Revision_Hub__Chemistry_and_Physics.html` readable in the maintained React application without opening a `details`/accordion block, while making lessons, quizzes, flashcards, and the periodic table feel like one finished study product.

## Scope

- Surface every textual lesson section found directly in the original HTML bundle, with source-derived parity inventory and automated coverage checks; no source-note text stays only in `details`.
- Keep all source material safe: lesson JSON remains validated by Zod; no raw HTML, executable content, inline styles, event handlers, or arbitrary component names.
- Preserve existing curated blocks, figures, quiz/deck links, immutable built-in JSON, local-only custom study data, and query navigation (`?subject=<id>&topic=<id>`).
- Retain `original-materials.html` as archive/reference fallback, not as primary route for study content.
- Unify product UI patterns across lesson, quiz, flashcard, and periodic-table views.

## Content Model

Each migrated `details` block becomes visible semantic lesson content:

1. A normal heading naming the complete study-note section.
2. A visible `richText` block containing its validated Markdown in source order.
3. Existing curated blocks remain before it, so quick-reference material comes first and complete lesson detail follows naturally.

No CSS-forced-open accordion and no alternate expansion component for lesson text. The source content is ordinary document flow, searchable by browser and assistive technology, and preserved as immutable JSON. `details` remains only for optional figure galleries.

Content validation and regression checks derive their section/text inventory from `Revision_Hub__Chemistry_and_Physics.html`, then confirm every expected textual section is represented by normal visible blocks in the matching React lesson.

## Shared Product UI

Create small shared presentation pieces rather than duplicating widths, headers, and form styling:

- A page header pattern for eyebrow/breadcrumb, responsive H1, and summary.
- A single page-content width and vertical rhythm scale applied to all feature views.
- One subject-filter and form-control presentation built from existing shadcn Base UI primitives.
- Contextual tool navigation: show study-tool shortcuts where they help lesson reading; avoid repeating them as a banner on the destination tool page.
- Callout tones map to semantic visual treatment for `info`, `tip`, and `warning` without encoding meaning in color alone.
- Periodic table becomes a conventional element grid: atomic number, symbol, name, and mass in every cell; semantic category tint; no dialog. Activating a focusable element cell updates an always-visible, keyboard-accessible detail panel placed in the intentional upper-middle grid gap. The table remains horizontally scrollable at small widths with an explicit mobile reading cue.

No new visual brand, fonts, dependency, account system, router, server, or content-management system.

## Accessibility & Interaction

- Keep visible focus, semantic headings, 44px mobile controls, accessible labels, keyboard navigation, and `color-scheme` theme behavior.
- Surface full lesson text as document flow rather than hidden disclosure content.
- Retain responsive table scrolling and lazy, captioned figures.
- Maintain focus movement after direct lesson-to-tool navigation and avoid stale tool activity after generic navigation.

## Verification

- Content validator confirms no built-in `details` blocks and all original substantive source material remains represented.
- Renderer and navigation tests cover visible complete notes, semantic headings, contextual tool links, and callout tone mapping.
- Browser checks inspect long Chemistry and Physics lessons, mobile periodic-table behavior, and each tool page at desktop/mobile widths.
- Run repository handoff checks: extraction, lint, typecheck, test, content validation, and build.
- Push to `main`; existing Pages workflow regenerates and commits `docs/` output after checks pass.

## Non-Goals

- Rewriting curriculum content, changing exam scope, or inventing new questions.
- Replacing original archive viewer.
- Dynamic routing, remote persistence, or user accounts.
- A separate design system or component-library migration.
