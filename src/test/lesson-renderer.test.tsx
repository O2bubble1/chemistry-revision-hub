import { render, screen, within } from "@testing-library/react"
import { expect, test } from "vitest"

import { LessonRenderer } from "@/features/lessons/LessonRenderer"
import { catalog } from "@/features/lessons/load-content"

test("renders a semantic table block", () => {
  render(<LessonRenderer blocks={[{ type: "table", headers: ["Ion"], rows: [["Cu²⁺"]] }]} />)

  expect(screen.getByRole("columnheader", { name: "Ion" })).toBeVisible()
  expect(screen.getByRole("cell", { name: "Cu²⁺" })).toBeVisible()
})

test("includes complete salt preparation procedures", async () => {
  const chemistry = catalog.subjects.find((subject) => subject.id === "chemistry")
  const saltPreparation = chemistry?.lessons.find((lesson) => lesson.id === "salt-prep")
  if (!saltPreparation) throw new Error("Missing salt preparation lesson")
  render(<LessonRenderer blocks={saltPreparation.blocks} />)

  expect(screen.getByText("Decide the method")).toBeVisible()
  expect(screen.getByText("Precipitation — insoluble salts")).toBeVisible()
  expect(screen.getByText("Titration — soluble Group 1 or ammonium salts")).toBeVisible()
  expect(screen.getByText(/Repeat without indicator/)).toBeVisible()
})

test("keeps the final comparison card aligned with its grid", () => {
  const { container } = render(<LessonRenderer blocks={[{ type: "comparison", items: [{ title: "A", body: "First" }, { title: "B", body: "Second" }, { title: "C", body: "Third" }] }]} />)

  expect(container.querySelector("[data-comparison-grid]")).toHaveClass("sm:grid-cols-2", "items-start")
  expect(container.querySelector("[data-comparison-item='2']")).not.toHaveClass("sm:col-span-2", "sm:justify-self-center")
})

test("renders lesson figures lazily with an accessible caption", () => {
  render(<LessonRenderer blocks={[{ type: "figure", src: "/source-materials/example.jpg", alt: "An accessible source figure", caption: "Source handout" }]} />)

  expect(screen.getByRole("img", { name: "An accessible source figure" })).toHaveAttribute("loading", "lazy")
  expect(screen.getByText("Source handout")).toHaveClass("typeset-figure-caption")
})

test("prefixes lesson figures with the configured deployment base", async () => {
  const { resolveFigureSrc } = await import("@/features/lessons/LessonRenderer")

  expect(resolveFigureSrc("/source-materials/example.jpg", "/chemistry-revision-hub/")).toBe("/chemistry-revision-hub/source-materials/example.jpg")
})

test("keeps four comparison cards in paired desktop columns", () => {
  const { container } = render(<LessonRenderer blocks={[{ type: "comparison", items: [{ title: "A", body: "First" }, { title: "B", body: "Second" }, { title: "C", body: "Third" }, { title: "D", body: "Fourth" }] }]} />)

  expect(container.querySelector("[data-comparison-grid]")).toHaveClass("sm:grid-cols-2")
  expect(container.querySelector("[data-comparison-grid]")).not.toHaveClass("lg:grid-cols-3")
})

test("renders source scans in an optional labelled gallery", () => {
  const { container } = render(<LessonRenderer blocks={[{ type: "figureGallery", summary: "Original source materials", figures: [{ src: "/source-materials/example.jpg", alt: "Original handout" }] }]} />)

  expect(within(container).getByRole("button", { name: "Original source materials" })).toBeVisible()
  expect(within(container).queryByRole("img", { name: "Original handout" })).not.toBeInTheDocument()
})
