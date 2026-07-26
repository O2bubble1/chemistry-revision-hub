# Lesson Authoring Skill

Use this when changing `src/content/`.

## Workflow

1. Edit JSON only. Do not embed HTML, JSX, CSS, JavaScript, handlers, or arbitrary component names.
2. Use a unique lowercase kebab-case subject and lesson `id`.
3. Add semantic blocks in reading order.
4. Run `bun run validate-content` before handoff.
5. Do not hand-edit generated quiz/deck data. Use `bun run extract-legacy-study-data` to refresh it from legacy source.

## Allowed lesson blocks

```json
{ "type": "heading", "text": "Section", "level": 2 }
{ "type": "richText", "markdown": "## Markdown only" }
{ "type": "callout", "title": "Exam tip", "body": "Explain why.", "tone": "tip" }
{ "type": "comparison", "items": [{ "title": "A", "body": "Meaning" }, { "title": "B", "body": "Meaning" }] }
{ "type": "table", "headers": ["Column"], "rows": [["Cell"]] }
{ "type": "figure", "src": "/asset.svg", "alt": "Meaningful description", "caption": "Optional" }
{ "type": "details", "summary": "Reveal answer", "markdown": "Answer" }
{ "type": "quizLink", "label": "Open quiz", "targetId": "chemistry-easy" }
{ "type": "flashcardLink", "label": "Open cards", "targetId": "chemistry-cations" }
{ "type": "periodicTableLink", "label": "Open periodic table" }
```

## Markdown

Use headings, paragraphs, emphasis, lists, links, and code examples. Raw HTML is rejected. Do not write executable code or inline styles.

## Accessibility

- Figures require concise, useful `alt` text. Decorative figures do not belong in lesson data.
- Tables require short, unique headers. Every row must have exactly one cell per header.
- Write link/button labels that describe the destination or action.
- Use `details` for answers that should be revealed deliberately, not for essential reading sequence.

## Validation

```sh
bun run extract-legacy-study-data  # only when refreshing legacy study data
bun run validate-content
bun run test
```
