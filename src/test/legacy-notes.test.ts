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

type LegacyInventory = Record<string, Record<string, { text: string[]; rawText: string }>>

const controlSelector = "button, script, style, svg, path, input, select, option, textarea"
const semanticSelector = "h3, h4, h5, h6, p, th, td, li, figcaption"
const sourceBlockSelector = "article, br, div, figcaption, figure, h1, h2, h3, h4, h5, h6, li, ol, p, section, table, tbody, td, tfoot, th, thead, tr, ul"
const interactionInstruction = /Tap any orange blank(?: to reveal the answer)?\s*;?\s*Tap again to hide it\.?(?:\s*(?:Quiz yourself before revealing|Try saying the sentence out loud before you reveal)\.?)?|Reveal all answers|Hide all answers|your own quizzes/gi

function normalizedText(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/\|/g, " ")
    .replace(/([\p{Ll}\p{N}])([\p{Lu}])/gu, "$1 $2")
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

function sourceFragment(section: string): DocumentFragment {
  const template = document.createElement("template")
  template.innerHTML = section
  template.content.querySelectorAll(controlSelector).forEach((element) => element.remove())
  return template.content
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

function isAnswerControl(node: Node): node is Element {
  return isElementNode(node) && node.tagName === "SPAN" && (node.classList.contains("blank") || node.classList.contains("answer"))
}


function fragmentText(element: Element): string[] {
  const chunks: string[] = [""]
  const append = (text: string) => { chunks[chunks.length - 1] += text }
  const visit = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      append(node.textContent ?? "")
      return
    }
    if (!isElementNode(node)) return
    if (isAnswerControl(node)) {
      chunks.push("")
      return
    }
    node.childNodes.forEach(visit)
  }

  element.childNodes.forEach(visit)
  return chunks.flatMap((chunk) => chunk.split(interactionInstruction)).map(normalizedText).filter((text) => text.length > 1)
}

export function substantiveText(section: string): string[] {
  const fragment = sourceFragment(section)
  return [...fragment.querySelectorAll<Element>(semanticSelector)].flatMap(fragmentText)
}

function sourceText(section: string): string {
  const fragment = sourceFragment(section)
  fragment.querySelectorAll("span.blank, span.answer").forEach((element) => element.replaceWith(document.createTextNode(" ")))
  fragment.querySelectorAll(sourceBlockSelector).forEach((element) => element.after(document.createTextNode(" ")))
  return normalizedText((fragment.textContent ?? "").replace(interactionInstruction, " "))
}

test("keeps curriculum text surrounding legacy answer controls", () => {
  expect(substantiveText('<p>Explain <span class="blank">?</span> with ions.</p>')).toEqual(["Explain", "with ions."])
})

test("keeps complete words around inline source tags", () => {
  expect(sourceText('<p><strong>P</strong>ure and <strong>CO</strong> and</p>')).toBe("Pure and CO and")
})
test("keeps a raw-text word boundary around legacy answer controls", () => {
  expect(sourceText('<p>before<span class="blank">?</span>after</p>')).toBe("before after")
})


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
    const section = template.slice(panel.index, end)
    const headingMatch = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    if (!headingMatch) throw new Error(`Missing heading for ${subjectId}/${sourceId}`)
    const afterHeading = section.slice((headingMatch.index ?? 0) + headingMatch[0].length)
    inventory[subjectId]![lessonId] = { text: substantiveText(afterHeading), rawText: sourceText(afterHeading) }
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
    case "figureGallery": return `${block.summary} ${block.figures.map((figure) => `${figure.alt} ${figure.caption ?? ""}`).join(" ")}`
    case "quizLink":
    case "flashcardLink":
    case "periodicTableLink": return block.label
  }
}

export function visibleLessonInventory(content: ContentCatalog): Record<string, Record<string, { text: string }>> {
  return Object.fromEntries(content.subjects.map((subject) => [subject.id, Object.fromEntries(subject.lessons.map((lesson) => [lesson.id, { text: normalizedText(lesson.blocks.map(blockText).join(" ")) }]))]))
}

function tokenMultiset(text: string): Map<string, number> {
  const tokens = normalizedText(text).normalize("NFKC").toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  return tokens.reduce((counts, token) => counts.set(token, (counts.get(token) ?? 0) + 1), new Map<string, number>())
}

test("preserves every Chemistry legacy token occurrence", async () => {
  const expected = await extractLegacyLessonInventory("Revision_Hub__Chemistry_and_Physics.html")
  const visible = visibleLessonInventory(catalog)

  for (const [lessonId, { rawText }] of Object.entries(expected.chemistry)) {
    const sourceTokens = tokenMultiset(rawText)
    const visibleTokens = tokenMultiset(visible.chemistry?.[lessonId]?.text ?? "")

    for (const [token, count] of sourceTokens) {
      expect(visibleTokens.get(token) ?? 0, `${lessonId}: ${token}`).toBeGreaterThanOrEqual(count)
    }
  }
})

test("surfaces every legacy textual lesson section", async () => {
  const expected = await extractLegacyLessonInventory("Revision_Hub__Chemistry_and_Physics.html")
  const visible = visibleLessonInventory(catalog)

  for (const [subjectId, lessons] of Object.entries(expected)) {
    for (const [lessonId, { text }] of Object.entries(lessons)) {
      for (const sourceText of text) expect((visible[subjectId]?.[lessonId]?.text ?? "").replace(/\s+/g, "").toLowerCase()).toContain(sourceText.replace(/\s+/g, "").toLowerCase())
    }
  }
})

test("renders completed model answers instead of inert blanks", () => {
  for (const subjectId of ["chemistry", "physics"]) {
    const lesson = catalog.subjects.find((subject) => subject.id === subjectId)?.lessons.find((entry) => entry.id === "model-answers")
    const text = lesson?.blocks.map(blockText).join(" ")

    expect(text).not.toMatch(/[?]|Tap any orange blank|Reveal all answers|Hide all answers/)
  }
})
