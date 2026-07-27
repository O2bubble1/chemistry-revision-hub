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

test("uses muted pastel category tints in both themes", () => {
  render(<PeriodicTablePage />)

  expect(screen.getByRole("button", { name: /hydrogen/i })).toHaveAttribute("data-category", "Nonmetal")
  expect(screen.getByRole("button", { name: /sodium/i })).toHaveAttribute("data-category", "Alkali metal")
  expect(screen.getByRole("button", { name: /helium/i })).toHaveAttribute("data-category", "Noble gas")
  expect(screen.getByRole("button", { name: /hydrogen/i })).toHaveClass("bg-emerald-100/80", "dark:bg-emerald-950/50")
  expect(screen.getByRole("button", { name: /sodium/i })).toHaveClass("bg-rose-100/80", "dark:bg-rose-950/50")
  expect(screen.getByRole("button", { name: /helium/i })).toHaveClass("bg-violet-100/80", "dark:bg-violet-950/50")
})

test("uses curriculum hierarchy for periodic cell metadata", () => {
  render(<PeriodicTablePage />)

  const iron = screen.getByRole("button", { name: /iron/i })
  expect(iron).toHaveClass("grid-rows-[auto_1fr_auto_auto]")
  expect(iron).toHaveClass("aspect-square")
  expect(iron).toHaveClass("p-0.5")
  expect(iron).toHaveClass("min-w-0", "overflow-hidden")
  expect(iron).toHaveClass("gap-0")
  expect(iron).toHaveClass("focus-visible:ring-2", "focus-visible:ring-inset")
  expect([...iron.querySelectorAll("[data-element-field]")].map((field) => field.getAttribute("data-element-field"))).toEqual(["mass", "symbol", "name", "atomic-number"])
  expect(iron.querySelector('[data-element-field="mass"]')).toHaveTextContent("56")
  expect(iron.querySelector('[data-element-field="symbol"]')).toHaveTextContent("Fe")
  expect(iron.querySelector('[data-element-field="name"]')).toHaveTextContent("Iron")
  expect(iron.querySelector('[data-element-field="name"]')).toHaveClass("truncate")
  expect(iron.querySelector('[data-element-field="atomic-number"]')).toHaveTextContent("26")
  expect(iron.querySelector('[data-element-field="mass"]')).toHaveClass("text-[0.45rem]", "leading-none")
  expect(iron.querySelector('[data-element-field="symbol"]')).toHaveClass("text-base", "leading-none")
  expect(iron.querySelector('[data-element-field="name"]')).toHaveClass("text-[0.4rem]", "leading-none")
  expect(iron.querySelector('[data-element-field="atomic-number"]')).toHaveClass("text-[0.45rem]", "leading-none")
  for (const field of iron.querySelectorAll("[data-element-field]")) expect(field).toHaveClass("min-w-0")

  const groupLabels = screen.getByTestId("periodic-group-labels")
  expect([...groupLabels.children].map((label) => label.textContent)).toEqual(Array.from({ length: 18 }, (_, index) => String(index + 1)))
})

test("uses a stable detail band and horizontal-only table viewport", () => {
  render(<PeriodicTablePage />)

  expect(screen.getByTestId("periodic-detail-band")).toHaveClass("min-h-64", "h-auto", "sm:min-h-0", "sm:h-52")
  expect(screen.getByTestId("periodic-table-viewport")).toHaveClass("overflow-y-hidden")
})
