import { expect, test } from "vitest"

import { catalog } from "@/features/lessons/load-content"

function lesson(subjectId: string, lessonId: string) {
  const subject = catalog.subjects.find((candidate) => candidate.id === subjectId)
  if (!subject) throw new Error(`Missing subject: ${subjectId}`)

  const lesson = subject.lessons.find((candidate) => candidate.id === lessonId)
  if (!lesson) throw new Error(`Missing lesson: ${subjectId}/${lessonId}`)

  return lesson
}

test("gives Chemistry diagnostic data semantic tables", () => {
  expect(lesson("chemistry", "cation-tests").blocks.some((block) => block.type === "table")).toBe(true)
  expect(lesson("chemistry", "anion-tests").blocks.some((block) => block.type === "table")).toBe(true)
  expect(lesson("chemistry", "gas-tests").blocks.some((block) => block.type === "table")).toBe(true)
})

test("preserves Chemistry QA source headings", () => {
  const headings = lesson("chemistry", "qa-strategy").blocks
    .filter((block) => block.type === "heading" && block.level === 3)
    .map((block) => block.text)

  expect(headings).toEqual([
    "Step 1 — Physical Observation",
    "Step 2 — Add NaOH dropwise, then in excess",
    "Step 3 — Add NH₃ dropwise, then in excess (to confirm)",
    "Step 4 — Test for Anions",
    "Step 5 — Test any evolved gases",
    "Distinguishing Similar Ions",
  ])

  expect(lesson("chemistry", "solubility-rules").blocks.some((block) => block.type === "heading" && block.text === "The Always-Soluble Squad")).toBe(true)
})

test("gives Chemistry preparation and bonding notes scanable structure", () => {
  expect(lesson("chemistry", "salt-prep").blocks.filter((block) => block.type === "heading" && block.level === 3).length).toBeGreaterThan(2)
  expect(lesson("chemistry", "bonding").blocks.some((block) => block.type === "table")).toBe(true)
  expect(lesson("chemistry", "bonding").blocks.some((block) => block.type === "comparison")).toBe(true)
})

test("keeps pH inequality notation readable", () => {
  expect(JSON.stringify(lesson("chemistry", "ph-indicators").blocks)).toContain("< 7")
  expect(JSON.stringify(lesson("chemistry", "ph-indicators").blocks)).toContain("> 7")
})
