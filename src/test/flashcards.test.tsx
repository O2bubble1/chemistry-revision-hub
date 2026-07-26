import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"

import { FlashcardsPage } from "@/features/flashcards/FlashcardsPage"
import decks from "@/content/flashcards.json"

afterEach(() => cleanup())

test("reveals answer then advances through migrated starter deck", async () => {
  const user = userEvent.setup()
  const deck = decks.decks.find((entry) => entry.id === "c-cat")!
  const firstCard = deck.cards[0]!
  const secondCard = deck.cards[1]!

  render(<FlashcardsPage />)
  await user.click(screen.getByRole("button", { name: "Study Cation tests — aqueous NaOH" }))
  expect(screen.getByText(firstCard.front)).toBeVisible()

  await user.click(screen.getByRole("button", { name: "Reveal answer" }))
  expect(screen.getByText(firstCard.back)).toBeVisible()

  await user.click(screen.getByRole("button", { name: "Got it" }))
  expect(screen.getByText(secondCard.front)).toBeVisible()
})

test("edits a duplicated custom deck", async () => {
  const user = userEvent.setup()
  render(<FlashcardsPage />)

  await user.click(screen.getByRole("button", { name: "Duplicate Cation tests — aqueous NaOH" }))
  await user.click(screen.getByRole("button", { name: "Edit Cation tests — aqueous NaOH copy" }))
  const title = screen.getByLabelText("Deck title")
  await user.clear(title)
  await user.type(title, "Edited cation deck")
  await user.click(screen.getByRole("button", { name: "Save deck" }))

  expect(screen.getByText("Edited cation deck")).toBeVisible()
})

test("uses locked subject for a new custom deck", async () => {
  const user = userEvent.setup()
  render(<FlashcardsPage initialSubject="physics" />)

  await user.click(screen.getByRole("button", { name: "Create deck" }))

  expect(screen.getByLabelText("Deck subject")).toHaveValue("physics")
})

test("rejects an imported deck with no cards", async () => {
 const { importDecks } = await import("@/features/flashcards/storage")

 expect(() => importDecks(JSON.stringify({ decks: [{ id: "empty", subject: "chemistry", title: "Empty", cards: [] }] }))).toThrow("valid flashcard decks")
})
