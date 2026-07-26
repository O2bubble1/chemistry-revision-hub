import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import App from "@/App"

test("shows Periodic table only for Chemistry", () => {
  window.history.replaceState({}, "", "?subject=physics&topic=kinematics")
  render(<App />)

  expect(screen.queryByRole("button", { name: "Periodic table" })).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Quiz" })).toBeVisible()
  expect(screen.getAllByRole("button", { name: "Flashcards" })).toHaveLength(2)
})
