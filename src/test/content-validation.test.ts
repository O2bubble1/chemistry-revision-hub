import { expect, test } from "vitest"

import { validateContent } from "@/features/lessons/schema"
import decks from "@/content/flashcards.json"
import quizzes from "@/content/quizzes.json"

test("accepts an allowlisted rich-text lesson block", () => {
  const catalog = validateContent({
    subjects: [
      {
        id: "chemistry",
        title: "Chemistry",
        lessons: [
          {
            id: "cations",
            title: "Cations",
            summary: "",
            tags: [],
            blocks: [{ type: "richText", markdown: "# Test" }],
          },
        ],
      },
    ],
  })

  expect(catalog.subjects[0]?.lessons[0]?.blocks[0]?.type).toBe("richText")
})

test("rejects executable lesson blocks", () => {
  expect(() =>
    validateContent({
      subjects: [
        {
          id: "chemistry",
          title: "Chemistry",
          lessons: [
            {
              id: "cations",
              title: "Cations",
              summary: "",
              tags: [],
              blocks: [{ type: "script", code: "alert(1)" }],
            },
          ],
        },
      ],
    }),
  ).toThrow()
})

test("rejects inline HTML in Markdown blocks", () => {
  expect(() =>
    validateContent({
      subjects: [
        {
          id: "chemistry",
          title: "Chemistry",
          lessons: [
            {
              id: "cations",
              title: "Cations",
              summary: "",
              tags: [],
              blocks: [{ type: "richText", markdown: "<script>alert(1)</script>" }],
            },
          ],
        },
      ],
    }),
  ).toThrow()
})

test("keeps extracted quiz and flashcard content free of raw HTML", () => {
  expect(JSON.stringify([quizzes, decks])).not.toMatch(/<\/?[a-z][^>]*>/i)
})
