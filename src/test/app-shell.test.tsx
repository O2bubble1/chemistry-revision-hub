import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"

import App from "@/App"

afterEach(() => cleanup())

test("uses the styled subject selector", () => {
  render(<App />)

  expect(screen.getByRole("combobox", { name: "Subject" })).toHaveAttribute("data-slot", "select-trigger")
})

test("keeps tool shortcuts out of their destination pages", async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getByRole("button", { name: "Quiz" }))

  expect(screen.queryByRole("button", { name: "Quiz" })).not.toBeInTheDocument()
  expect(screen.getByRole("heading", { name: "Quizzes" })).toBeVisible()
})
