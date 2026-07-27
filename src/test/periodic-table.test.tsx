import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"

afterEach(() => cleanup())

import { PeriodicTablePage } from "@/features/periodic-table/PeriodicTablePage"

test("updates the persistent periodic-table detail panel", async () => {
  const user = userEvent.setup()
  render(<PeriodicTablePage />)

  const hydrogen = screen.getByRole("button", { name: /hydrogen/i })
  expect(hydrogen).toHaveTextContent("1")
  expect(hydrogen).toHaveTextContent("H")
  expect(hydrogen).toHaveTextContent("Hydrogen")
  expect(screen.getByRole("button", { name: /chlorine/i })).toHaveTextContent("35.5")

  await user.click(hydrogen)

  expect(screen.getByRole("region", { name: "Selected element" })).toHaveTextContent("Hydrogen")
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
})

test("updates selected element when a cell receives keyboard focus", async () => {
  const user = userEvent.setup()
  render(<PeriodicTablePage />)

  await user.tab()

  expect(screen.getByRole("region", { name: "Selected element" })).toHaveTextContent("Hydrogen")
})
