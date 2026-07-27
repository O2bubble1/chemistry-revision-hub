import { readFile, writeFile } from "node:fs/promises"

import { validateContent, type ContentCatalog, type Lesson, type LessonBlock } from "../src/features/lessons/schema"

const contentPath = "src/content/lessons.json"

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

type DetailsBlock = { type: "details"; summary: string; markdown: string }

function surfaceNote(lesson: Lesson, block: DetailsBlock): LessonBlock[] {
  const markdown = block.markdown.replace(new RegExp(`^${escapeRegExp(lesson.title)}\\n+`), "")
  return [
    { type: "heading", text: block.summary === "Preserved source notes" ? "Complete study notes" : block.summary, level: 2 },
    { type: "richText", markdown },
  ]
}

const raw = JSON.parse(await readFile(contentPath, "utf8")) as { subjects: Array<{ lessons: Array<Omit<Lesson, "blocks"> & { blocks: Array<LessonBlock | DetailsBlock> }> }> }
const surfaced = {
  ...raw,
  subjects: raw.subjects.map((subject) => ({
    ...subject,
    lessons: subject.lessons.map((lesson) => ({
      ...lesson,
      blocks: lesson.blocks.flatMap((block) => block.type === "details" ? surfaceNote(lesson as Lesson, block) : [block]),
    })),
  })),
}

const content: ContentCatalog = validateContent(surfaced)

if (surfaced.subjects.some((subject) => subject.lessons.some((lesson) => lesson.blocks.some((block) => block.type === "details")))) {
  throw new Error("Text-bearing details block remains")
}

await writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`)
