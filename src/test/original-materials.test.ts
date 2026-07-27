import { existsSync } from "node:fs"
import { join } from "node:path"

import { expect, test } from "vitest"

import { catalog } from "@/features/lessons/load-content"

const originalAssets = [
  "handout_1.jpg",
  "handout_2.jpg",
  "handout_3.jpg",
  "handout_4.jpg",
  "handout_5.jpg",
  "handout_6.jpg",
  "handout_7.jpg",
  "pdf_p1.jpg",
  "pdf_p2.jpg",
  "pdf_p3.jpg",
  "pdf_p4.jpg",
  "pdf_p5.jpg",
  "pdf_p6.jpg",
  "pdf_p7.jpg",
  "pdf_p8.jpg",
  "pdf_p9.jpg",
  "poster_anions.jpg",
  "poster_cations.jpg",
]

test("extracts legacy original materials into accessible lesson figures", () => {
  const figures = catalog.subjects
    .flatMap((subject) => subject.lessons.flatMap((lesson) => lesson.blocks))
    .flatMap((block) => block.type === "figure" ? [block] : block.type === "figureGallery" ? block.figures : [])
    .map((figure) => figure.src.replace("/source-materials/", ""))

  for (const asset of originalAssets) {
    expect(existsSync(join("public", "source-materials", asset))).toBe(true)
    expect(figures).toContain(asset)
  }
})
