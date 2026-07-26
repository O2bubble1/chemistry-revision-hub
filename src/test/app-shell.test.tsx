import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import App from "@/App"

test("uses the styled subject selector", () => {
  render(<App />)

  expect(screen.getByRole("combobox", { name: "Subject" })).toHaveAttribute("data-slot", "select-trigger")
})
