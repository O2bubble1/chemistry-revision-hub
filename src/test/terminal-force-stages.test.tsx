// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { LessonRenderer } from "@/features/lessons/LessonRenderer"
import { catalog } from "@/features/lessons/load-content"

test("keeps exactly one detailed terminal-velocity stage table in complete notes", () => {
  const lesson = catalog.subjects
    .find((subject) => subject.id === "physics")
    ?.lessons.find((entry) => entry.id === "friction-terminal-velocity")
  if (!lesson) throw new Error("Missing friction and terminal velocity lesson")

  const stageLabels = [
    "Stage 1 — just released",
    "Stage 2 — speeding up",
    "Stage 3 — terminal velocity reached",
    "Stage 4 — parachute opens",
  ]
  const stageTables = lesson.blocks.flatMap((block) => block.type === "table" && block.headers.includes("Stage") && block.headers.includes("Forces") ? [block] : [])

  expect(stageTables).toHaveLength(1)
  expect(stageTables[0]?.rows.map(([stage]) => stage)).toEqual(stageLabels)

  render(<LessonRenderer blocks={lesson.blocks} />)
  for (const label of stageLabels) expect(screen.getByRole("cell", { name: label })).toBeVisible()
})
