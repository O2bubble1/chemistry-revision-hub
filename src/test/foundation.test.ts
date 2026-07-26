import { beforeEach, describe, expect, test } from "vitest"

import { getBasePath } from "../../vite.config"
import { readNavigation, writeNavigation } from "@/app/navigation"
import { createStorage } from "@/lib/local-storage"


beforeEach(() => {
  const values = new Map<string, string>()
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  })
})
describe("GitHub Pages base path", () => {
  test("uses the repository path in GitHub Actions", () => {
    expect(
      getBasePath({
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "school/revision-hub",
      }),
    ).toBe("/revision-hub/")
  })

  test("uses root path locally", () => {
    expect(getBasePath({})).toBe("/")
  })
})

describe("query-state navigation", () => {
  const catalog = {
    subjects: [
      {
        id: "chemistry",
        lessons: [{ id: "mnemonics" }, { id: "cation-tests" }],
      },
      { id: "physics", lessons: [{ id: "kinematics" }] },
    ],
  }

  test("falls back to the first lesson for invalid state", () => {
    expect(readNavigation("?subject=unknown&topic=nope", catalog)).toEqual({
      subjectId: "chemistry",
      topicId: "mnemonics",
    })
  })

  test("serializes selection to a query string", () => {
    expect(writeNavigation({ subjectId: "physics", topicId: "kinematics" })).toBe(
      "?subject=physics&topic=kinematics",
    )
  })
})

describe("local storage", () => {
  test("uses fallback after corrupt data", () => {
    window.localStorage.setItem("revision-hub:test", "not-json")
    const storage = createStorage("revision-hub:test", 1, "system")
    expect(storage.read()).toBe("system")
  })

  test("uses fallback after malformed payload", () => {
    window.localStorage.setItem("revision-hub:test", JSON.stringify({ version: 1 }))
    const storage = createStorage("revision-hub:test", 1, "system")
    expect(storage.read()).toBe("system")
  })

  test("reports failed writes without browser storage", () => {
    Object.defineProperty(window, "localStorage", { configurable: true, value: undefined })
    expect(createStorage("revision-hub:test", 1, "system").write("dark")).toBe(false)
  })
})
