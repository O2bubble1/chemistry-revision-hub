import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"

afterEach(() => cleanup())

import App from "@/App"

test("shows Periodic table only for Chemistry", () => {
  window.history.replaceState({}, "", "?subject=physics&topic=kinematics")
  render(<App />)

  expect(screen.queryByRole("button", { name: "Periodic table" })).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Quiz" })).toBeVisible()
  expect(screen.getAllByRole("button", { name: "Flashcards" })).toHaveLength(2)
})

test("opens a lesson-linked quiz at its declared target", async () => {
 const user = userEvent.setup()
 window.history.replaceState({}, "", "?subject=chemistry&topic=kahoot-quiz")
 render(<App />)

 await user.click(screen.getByRole("button", { name: "Open Chemistry quiz" }))
 expect(screen.getByText("A colourless solution gives a white precipitate with aqueous sodium hydroxide, and the precipitate dissolves when the sodium hydroxide is added in excess. Which test tells you whether the cation is Al³⁺ or Zn²⁺?")).toBeVisible()
})

test("opens a lesson-linked flashcard deck at its declared target", async () => {
 const user = userEvent.setup()
 window.history.replaceState({}, "", "?subject=chemistry&topic=flashcards")
 render(<App />)

 await user.click(screen.getByRole("button", { name: "Open Chemistry flashcards" }))
 expect(screen.getByText("Ammonium NH₄⁺ + NaOH")).toBeVisible()
})

test("opens the quiz library instead of retaining a prior lesson target", async () => {
 const user = userEvent.setup()
 window.history.replaceState({}, "", "?subject=chemistry&topic=kahoot-quiz")
 render(<App />)

 await user.click(screen.getByRole("button", { name: "Open Chemistry quiz" }))
 await user.click(screen.getByRole("button", { name: "Revision Hub home" }))
 await user.click(screen.getByRole("button", { name: "Quiz" }))

 expect(screen.getByRole("button", { name: "Start Chemistry: Set A · Easier" })).toBeVisible()
})

test("returns directly to the quiz library from a linked quiz", async () => {
  const user = userEvent.setup()
  window.history.replaceState({}, "", "?subject=chemistry&topic=kahoot-quiz")
  render(<App />)

  await user.click(screen.getByRole("button", { name: "Open Chemistry quiz" }))
  await user.click(screen.getByRole("button", { name: "Quiz" }))

  expect(screen.getByRole("button", { name: "Start Chemistry: Set A · Easier" })).toBeVisible()
})
