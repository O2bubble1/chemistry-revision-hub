import { expect, test } from "vitest"

import { catalog } from "@/features/lessons/load-content"

test("keeps terminal velocity factor labels in a semantic table", () => {
  const lesson = catalog.subjects
    .find((subject) => subject.id === "physics")
    ?.lessons.find((entry) => entry.id === "friction-terminal-velocity")
  const heading = lesson?.blocks.find((block) => block.type === "heading" && block.text === "What changes the size of the terminal velocity")
  const table = lesson?.blocks.find((block) => block.type === "table" && block.headers[0] === "Factor")

  expect(heading?.type === "heading" ? heading.text : undefined).toBe("What changes the size of the terminal velocity")
  expect(heading?.type === "heading" ? heading.text : undefined).not.toContain("FactorEffect and reason")
  expect(table).toMatchObject({
    type: "table",
    headers: ["Factor", "Effect and reason"],
    rows: [
      ["Mass of the falling object", expect.stringContaining("greater terminal velocity")],
      ["Cross-sectional area", expect.stringContaining("lower terminal velocity")],
    ],
  })
})
