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

test("gives Chemistry rule notes section anchors", () => {
  expect(lesson("chemistry", "qa-strategy").blocks.some((block) => block.type === "heading" && block.level === 3)).toBe(true)
  expect(lesson("chemistry", "solubility-rules").blocks.some((block) => block.type === "heading" && block.text === "The Always-Soluble Squad")).toBe(true)
})
