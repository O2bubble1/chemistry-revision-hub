// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { LessonRenderer } from "@/features/lessons/LessonRenderer"
import { catalog } from "@/features/lessons/load-content"

test("renders source terminal-velocity force stages as a semantic table", () => {
  const lesson = catalog.subjects
    .find((subject) => subject.id === "physics")
    ?.lessons.find((entry) => entry.id === "friction-terminal-velocity")
  if (!lesson) throw new Error("Missing friction and terminal velocity lesson")

  const flattened = lesson.blocks.find((block) => block.type === "richText" && block.markdown.includes("Terminal velocity — how the forces change1Just released"))
  const stages = lesson.blocks.find((block) => block.type === "table" && block.headers.includes("Stage") && block.headers.includes("Forces"))

  expect(flattened).toBeUndefined()
  expect(stages).toMatchObject({
    headers: ["Stage", "What happens", "Forces", "Acceleration"],
    rows: [
      ["1", "Just released", "W > R", "a = g"],
      ["2", "Speeding up", "W > R", "a decreasing"],
      ["3", "Terminal velocity", "W = R", "a = 0"],
      ["4", "Parachute opens", "R > W", "decelerating"],
    ],
  })

  render(<LessonRenderer blocks={lesson.blocks} />)
  for (const label of ["Just released", "Speeding up", "Terminal velocity", "Parachute opens"]) {
    expect(screen.getAllByRole("cell", { name: label }).length).toBeGreaterThan(0)
  }
  expect(screen.getByText("The weight NEVER changes. Only the air resistance grows — until at stage 3 it equals the weight.")).toBeVisible()
})
