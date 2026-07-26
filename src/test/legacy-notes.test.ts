import { expect, test } from "vitest"

import { catalog } from "@/features/lessons/load-content"

const migratedLessons: Record<string, Record<string, string>> = {
  chemistry: {
    mnemonics: "A to Z",
    "cation-tests": "Partial ionisation of NH₃",
    "anion-tests": "Adding dilute nitric acid first",
    "gas-tests": "acidified potassium manganate(VII)",
    "qa-strategy": "What is QA?",
    "solubility-rules": "The Always-Soluble Squad",
    "salt-prep": "The big idea: The method of salt preparation",
    oxides: "The quick sort",
    bonding: "stable (usually duplet or octet)",
    "model-answers": "Concept Map (I)",
    "ph-indicators": "same 0–14 pH axis",
    "periodic-table": "The staircase line",
  },
  physics: {
    mnemonics: "The 5 kinematics symbols",
    kinematics: "Kinematics describes how things move",
    "motion-graphs": "Two rules run this whole tab",
    "equations-of-motion": "only valid when the acceleration is uniform",
    "forces-weight": "a force is a push or a pull",
    "newtons-laws": "Newton's first law",
    "friction-terminal-velocity": "Friction is not the enemy",
    "work-energy-power": "energy sits in stores",
    "energy-resources": "Singapore's energy trilemma",
    "model-answers": "Every definition and standard explanation",
    "worked-examples": "Two perpendicular forces",
  },
}

test("retains source-specific legacy notes for each migrated lesson", () => {
  for (const [subjectId, lessons] of Object.entries(migratedLessons)) {
    const subject = catalog.subjects.find((entry) => entry.id === subjectId)
    for (const [lessonId, expectedPhrase] of Object.entries(lessons)) {
      const lesson = subject?.lessons.find((entry) => entry.id === lessonId)
      const notes = lesson?.blocks.find((block) => block.type === "details" && block.summary === "Preserved source notes")
      expect(notes?.type === "details" && notes.markdown).toContain(expectedPhrase)
    }
  }
})

test("renders completed model answers instead of inert blanks", () => {
  for (const subjectId of ["chemistry", "physics"]) {
    const lesson = catalog.subjects.find((subject) => subject.id === subjectId)?.lessons.find((entry) => entry.id === "model-answers")
    const notes = lesson?.blocks.find((block) => block.type === "details" && block.summary === "Preserved source notes")

    expect(notes?.type === "details" && notes.markdown).not.toMatch(/[?]|Tap any orange blank|Reveal all answers|Hide all answers/)
  }
})
