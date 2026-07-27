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

test("exposes category tint hooks on every element cell", () => {
  render(<PeriodicTablePage />)

  expect(screen.getByRole("button", { name: /hydrogen/i })).toHaveAttribute("data-category", "Nonmetal")
  expect(screen.getByRole("button", { name: /sodium/i })).toHaveAttribute("data-category", "Alkali metal")
  expect(screen.getByRole("button", { name: /helium/i })).toHaveAttribute("data-category", "Noble gas")
  expect(screen.getByRole("button", { name: /hydrogen/i })).toHaveClass("dark:bg-emerald-500/20")
  expect(screen.getByRole("button", { name: /sodium/i })).toHaveClass("dark:bg-rose-500/20")
  expect(screen.getByRole("button", { name: /helium/i })).toHaveClass("dark:bg-violet-500/20")
})

test("uses a stable detail band and horizontal-only table viewport", () => {
  render(<PeriodicTablePage />)

  expect(screen.getByTestId("periodic-detail-band")).toHaveClass("min-h-64", "h-auto", "sm:min-h-0", "sm:h-52")
  expect(screen.getByTestId("periodic-table-viewport")).toHaveClass("overflow-y-hidden")
})
