# Lesson Reading Structure Design

## Goal
Make all Chemistry and Physics lesson notes scanable in the React reading experience while preserving every source sentence and existing source-parity contract.

## Scope

- Add one shared vertical rhythm at the lesson renderer’s direct-child level for callouts, comparison grids, scrollable tables, optional figure galleries, and tool links.
- Preserve all existing lesson text, facts, figures, source galleries, query navigation, validation, and local-only study data.
- Restructure `src/content/lessons.json` using existing `heading`, `richText`, `table`, `comparison`, and `callout` blocks only.
- Correct demonstrable extraction defects without changing meaning: flat pseudo-tables, lost heading boundaries, the QA-strategy line break, and malformed pH inequality symbols.

## Reading Model

Each lesson keeps its quick-reference material, followed by complete notes split into concise semantic sections. A section has one `heading` block and the smallest number of blocks that represent its material:

- `richText` for explanatory prose and ordered procedures.
- `table` for row-and-column facts, definitions, tests, quantities, equations, resources, and worked comparisons.
- `comparison` for paired alternatives or contrasting outcomes.
- `callout` for exam-critical warnings, definitions, and technique tips.

No text is removed, rewritten for a different syllabus, hidden in disclosure UI, or moved into source galleries. Model-answer coverage remains complete. Existing study-tool links and original scans remain in place.

## Priorities

### Shared layout

1. Mark non-prose block roots at the renderer’s direct-child level, then give those roots the standard `1.5em` lesson rhythm without relying on nested component markup.
2. Add a renderer regression test for an alert directly followed by a comparison grid.
3. Browser-check the Salt Prep method selector at desktop and mobile widths.

### Chemistry

1. Convert flat test/property data in Cation Tests, Anion Tests, Gas Tests, Bonding, and pH Indicators into `table` or `comparison` blocks.
2. Split dense notes with `h3` anchors, beginning with Salt Prep, Bonding, Model Answers, and QA Strategy.
3. Preserve unique worked examples and model answers; never remove intentionally consolidated answer content.
4. Fix pH inequality notation and the QA Strategy missing line break.

### Physics

1. Convert flat data in Kinematics, Motion Graphs, Newton’s Laws, Forces & Weight, Work/Energy/Power, and Energy Resources into `table` or `comparison` blocks.
2. Add `callout` blocks for existing exam-critical warnings, especially SUVAT’s uniform-acceleration constraint and common misconception traps.
3. Split monolithic notes with `h3` anchors while keeping every source statement in its matching lesson.
4. Treat Model Answers as a deliberately consolidated mark-scheme reference; do not deduplicate it.

## Safety and Verification

- Schema and renderer stay unchanged unless a structural defect makes that necessary; existing block types are sufficient.
- Source parity remains lesson-local: every legacy textual landmark must still appear in normal React document flow.
- Content validation must pass after every content batch.
- Add or update only behavior-focused tests for layout and valid block rendering.
- Browser-smoke representative long Chemistry and Physics lessons, Salt Prep desktop/mobile, and relevant mobile tables.
- Before handoff, run extraction, lint, typecheck, full tests, content validation, and production build.

## Non-Goals

- Rewriting curriculum for a different exam scope.
- Removing source material, model answers, figures, or archive access.
- New block types, dependencies, routes, accounts, persistence, or design system work.
