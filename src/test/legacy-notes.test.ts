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

type LegacyInventory = Record<string, Record<string, { text: string[] }>>
function normalizedText(html: string): string {
  return html
    .replace(/\*\*/g, "")
    .replace(/\|/g, " ")
    .replace(/([\p{Ll}\p{N}])([\p{Lu}])/gu, "$1 $2")
    .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, value: string) => String.fromCodePoint(Number(value.startsWith("x") ? `0${value}` : value)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp|ndash|mdash);/gi, (_, value: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—" })[value.toLowerCase()]!)
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s*([+–—/])\s*/g, " $1 ")
    .replace(/\bNa\s+OH\b/g, "NaOH")
    .replace(/\bAg\s+(NO₃|Cl|I)\b/g, "Ag$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim()
}

function substantiveText(section: string): string[] {
  return [...section.matchAll(/<(?:h[3-6]|p|th|td|li|figcaption)[^>]*>([\s\S]*?)<\/(?:h[3-6]|p|th|td|li|figcaption)>/gi)]
    .filter(([, text]) => !/<(?:button|span)\b[^>]*class="[^"]*(?:blank|answer)[^"]*"/i.test(text))
    .map(([, text]) => normalizedText(text))
    .filter((text) => text.length > 1 && !/Tap any orange blank|Reveal all answers|Hide all answers|You are given a scenario|your own quizzes/i.test(text))
}

export async function extractLegacyLessonInventory(path: string): Promise<LegacyInventory> {
  const html = await readFile(path, "utf8")
  const templateMatch = html.match(/<script type="__bundler\/template">\s*(.*?)\s*<\/script>/s)
  if (!templateMatch?.[1]) throw new Error("Missing bundled legacy template")
  const template = JSON.parse(templateMatch[1]) as string
  const panels = [...template.matchAll(/<div\s+id="([^"]+)"[^>]*class="section"[^>]*data-subject="(chem|phys|both)"[^>]*>/g)]
  const inventory: LegacyInventory = { chemistry: {}, physics: {} }

  for (const [index, panel] of panels.entries()) {
    const [, sourceId, sourceSubject] = panel
    if (!sourceId || !sourceSubject || sourceSubject === "both") continue
    const subjectId = sourceSubject === "chem" ? "chemistry" : "physics"
    const lessonId = legacyLessonIds[subjectId][sourceId as never]
    if (!lessonId) throw new Error(`Unmapped legacy panel: ${subjectId}/${sourceId}`)
    const end = panels[index + 1]?.index ?? template.length
    const section = template.slice(panel.index, end).replace(/<button\b[^>]*>[\s\S]*?<\/button>/gi, " ")
    const headingMatch = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    if (!headingMatch) throw new Error(`Missing heading for ${subjectId}/${sourceId}`)
    const afterHeading = section.slice((headingMatch.index ?? 0) + headingMatch[0].length)
    inventory[subjectId]![lessonId] = { text: substantiveText(afterHeading) }
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
    for (const [lessonId, { text }] of Object.entries(lessons)) {
      for (const sourceText of text) expect((visible[subjectId]?.[lessonId]?.text ?? "").replace(/\s+/g, "").toLowerCase()).toContain(sourceText.replace(/\s+/g, "").toLowerCase())
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
