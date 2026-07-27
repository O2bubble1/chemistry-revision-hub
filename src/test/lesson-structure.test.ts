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

test("keeps Bonding study-note material in source order", () => {
  const blocks = lesson("chemistry", "bonding").blocks
  const completeNotesIndex = blocks.findIndex((block) => block.type === "heading" && block.text === "Complete study notes")
  const typesIndex = blocks.findIndex((block) => block.type === "heading" && block.text === "Types of Chemical Bonding and Structure")
  const propertyMatrixIndex = blocks.findIndex((block) => block.type === "table" && block.headers[0] === "Property")
  const giantCovalentComparisonIndex = blocks.findIndex((block) => block.type === "comparison" && block.items.some((item) => item.title === "Diamond") && block.items.some((item) => item.title === "Graphite"))

  expect(completeNotesIndex).toBeGreaterThanOrEqual(0)
  expect(typesIndex).toBeGreaterThan(completeNotesIndex)
  expect(propertyMatrixIndex).toBeGreaterThan(typesIndex)
  expect(giantCovalentComparisonIndex).toBeGreaterThan(propertyMatrixIndex)
})

test("keeps pH inequality notation readable", () => {
  expect(JSON.stringify(lesson("chemistry", "ph-indicators").blocks)).toContain("< 7")
  expect(JSON.stringify(lesson("chemistry", "ph-indicators").blocks)).toContain("> 7")
})

test("gives Physics motion and force data semantic structure", () => {
  for (const lessonId of ["kinematics", "motion-graphs", "forces-weight", "newtons-laws"]) {
    expect(lesson("physics", lessonId).blocks.some((block) => block.type === "table")).toBe(true)
  }
  expect(lesson("physics", "equations-of-motion").blocks.some((block) => block.type === "callout" && block.tone === "warning")).toBe(true)
})

test("keeps Equation of Motion warning and free-fall guide semantic", () => {
  const blocks = lesson("physics", "equations-of-motion").blocks
  const warningCallouts = blocks.filter(
    (block) => block.type === "callout" && block.tone === "warning" && block.body.includes("only valid when the acceleration is uniform (constant)"),
  )
  const warningWording = "these four equations are only valid when the acceleration is uniform (constant). If a question mentions terminal velocity, a parachute or \"changing acceleration\", the equations do not apply for that stage — use a graph instead."
  const blockText = blocks.map((block) => block.type === "callout" ? block.body : block.type === "richText" ? block.markdown : "").join("\n")
  const freeFallTables = blocks.filter(
    (block) => block.type === "table" && block.headers.join("|") === "Situation|What to use" && block.rows.some(([situation]) => situation === "Released from rest"),
  )
  const duplicatedFreeFallGuide = blocks.some(
    (block) =>
      block.type === "richText" &&
      block.markdown.includes("Health warning: these four equations are only valid when the acceleration is uniform (constant). If a question mentions terminal velocity, a parachute or \"changing acceleration\", the equations do not apply for that stage — use a graph instead.\n\nFree fall\n\nSituationWhat to use\n\nReleased from rest"),
  )

  expect(warningCallouts).toHaveLength(1)
  expect(blockText.split(warningWording)).toHaveLength(2)
  expect(freeFallTables).toHaveLength(1)
  expect(duplicatedFreeFallGuide).toBe(false)
})

test("represents Motion Graph table interpretations only in semantic tables", () => {
  const blocks = lesson("physics", "motion-graphs").blocks
  const tables = blocks.filter((block) => block.type === "table" && block.headers.join("|") === "Shape|What it means|How to read it")
  const richText = blocks.filter((block) => block.type === "richText").map((block) => block.markdown).join("\n")

  expect(tables).toHaveLength(2)
  expect(richText).not.toContain("Horizontal lineAt restGradient = 0")
  expect(richText).not.toContain("Horizontal line above the axisConstant velocityGradient = 0")
  expect(richText.match(/Two rules run this whole tab/g)).toHaveLength(1)
})
