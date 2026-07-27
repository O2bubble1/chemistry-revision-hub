import { readFile } from "node:fs/promises"

import { expect, test } from "vitest"

import { catalog } from "@/features/lessons/load-content"
import type { ContentCatalog, LessonBlock } from "@/features/lessons/schema"

const legacyLessonIds = {
  chemistry: {
    mnemonics: "mnemonics", cations: "cation-tests", anions: "anion-tests", gases: "gas-tests", flow: "qa-strategy", solubility: "solubility-rules", salts: "salt-prep", oxides: "oxides", bonding: "bonding", answers: "model-answers", ph: "ph-indicators", periodic: "periodic-table",
  },
  physics: {
    "p-mnemonics": "mnemonics", "p-kinematics": "kinematics", "p-graphs": "motion-graphs", "p-eom": "equations-of-motion", "p-forces": "forces-weight", "p-newton": "newtons-laws", "p-friction": "friction-terminal-velocity", "p-wep": "work-energy-power", "p-energy": "energy-resources", "p-answers": "model-answers", "p-worked": "worked-examples",
  },
} as const

type LegacyInventory = Record<string, Record<string, { landmarks: string[] }>>
function normalizedText(html: string): string {
  return html
    .replace(/\*\*/g, "")
    .replace(/([\p{Ll}\p{N}])([\p{Lu}])/gu, "$1 $2")
    .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, value: string) => String.fromCodePoint(Number(value.startsWith("x") ? `0${value}` : value)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (_, value: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[value.toLowerCase()]!)
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}
function sourceLandmarks(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?](?:\s|$)/g) ?? []
  const first = sentences.map((sentence) => sentence.trim()).find((sentence) => sentence.length > 20) ?? text.slice(0, 80)
  return [first.trim()]
}

export async function extractLegacyLessonInventory(path: string): Promise<LegacyInventory> {
  const html = await readFile(path, "utf8")
  const templateMatch = html.match(/<script type="__bundler\/template">\s*(.*?)\s*<\/script>/s)
  if (!templateMatch?.[1]) throw new Error("Missing bundled legacy template")
  const template = JSON.parse(templateMatch[1]) as string
  const panels = [...template.matchAll(/<div\s+id="([^"]+)"[^>]*class="section"[^>]*data-subject="(chem|phys)"[^>]*>/g)]
  const inventory: LegacyInventory = { chemistry: {}, physics: {} }

  for (const [index, panel] of panels.entries()) {
    const [, sourceId, sourceSubject] = panel
    if (!sourceId || !sourceSubject || sourceSubject === "both") continue
    const subjectId = sourceSubject === "chem" ? "chemistry" : "physics"
    const lessonId = legacyLessonIds[subjectId][sourceId as never]
    if (!lessonId) continue
    const end = panels[index + 1]?.index ?? template.length
    const section = template.slice(panel.index, end).replace(/<button\b[^>]*>[\s\S]*?<\/button>/gi, " ")
    const headingMatch = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    if (!headingMatch) throw new Error(`Missing heading for ${subjectId}/${sourceId}`)
    const afterHeading = section.slice((headingMatch.index ?? 0) + headingMatch[0].length)
    inventory[subjectId]![lessonId] = { landmarks: sourceLandmarks(normalizedText(afterHeading)) }
  }

  return inventory
}

function blockText(block: LessonBlock): string {
  switch (block.type) {
    case "heading": return block.text
    case "richText": return block.markdown
    case "callout": return `${block.title} ${block.body}`
    case "comparison": return block.items.map((item) => `${item.title} ${item.body}`).join(" ")
    case "table": return `${block.headers.join(" ")} ${block.rows.flat().join(" ")}`
    case "figure": return `${block.alt} ${block.caption ?? ""}`
    case "quizLink":
    case "flashcardLink":
    case "periodicTableLink": return block.label
  }
}

export function visibleLessonInventory(content: ContentCatalog): Record<string, Record<string, { text: string }>> {
  return Object.fromEntries(content.subjects.map((subject) => [subject.id, Object.fromEntries(subject.lessons.map((lesson) => [lesson.id, { text: normalizedText(lesson.blocks.map(blockText).join(" ")) }]))]))
}

function allLessonBlocks(content: ContentCatalog): LessonBlock[] {
  return content.subjects.flatMap((subject) => subject.lessons.flatMap((lesson) => lesson.blocks))
}

test("surfaces every legacy textual lesson section", async () => {
  const expected = await extractLegacyLessonInventory("Revision_Hub__Chemistry_and_Physics.html")
  const visible = visibleLessonInventory(catalog)

  for (const [subjectId, lessons] of Object.entries(expected)) {
    for (const [lessonId, { landmarks }] of Object.entries(lessons)) {
      for (const landmark of landmarks) expect(visible[subjectId]?.[lessonId]?.text).toContain(landmark)
    }
  }
  expect(allLessonBlocks(catalog).some((block) => block.type === "details")).toBe(false)
})

test("renders completed model answers instead of inert blanks", () => {
  for (const subjectId of ["chemistry", "physics"]) {
    const lesson = catalog.subjects.find((subject) => subject.id === subjectId)?.lessons.find((entry) => entry.id === "model-answers")
    const text = lesson?.blocks.map(blockText).join(" ")

    expect(text).not.toMatch(/[?]|Tap any orange blank|Reveal all answers|Hide all answers/)
  }
})
