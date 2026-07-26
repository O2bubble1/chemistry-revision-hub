import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test } from "vitest"

import { PeriodicTablePage } from "@/features/periodic-table/PeriodicTablePage"

test("opens Hydrogen's named dialog", async () => {
  const user = userEvent.setup()
  render(<PeriodicTablePage />)

  await user.click(screen.getByRole("button", { name: /hydrogen/i }))

  expect(await screen.findByRole("dialog", { name: /hydrogen/i })).toBeVisible()
})
