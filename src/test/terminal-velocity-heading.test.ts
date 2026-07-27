import { expect, test } from "vitest"

import { catalog } from "@/features/lessons/load-content"

test("keeps terminal velocity factor heading free of flattened table labels", () => {
  const lesson = catalog.subjects
    .find((subject) => subject.id === "physics")
    ?.lessons.find((entry) => entry.id === "friction-terminal-velocity")
  const richText = lesson?.blocks.find((block) => block.type === "richText" && block.markdown.includes("What changes the size of the terminal velocity"))
  const terminalVelocityHeading = richText?.type === "richText"
    ? richText.markdown.match(/What changes the size of the terminal velocity(?=\n\nMass of the falling object)/)?.[0]
    : undefined

  expect(terminalVelocityHeading).toBe("What changes the size of the terminal velocity")
  expect(terminalVelocityHeading).not.toContain("FactorEffect and reason")
})
