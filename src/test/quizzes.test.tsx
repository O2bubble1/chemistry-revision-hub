import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test } from "vitest"

import { QuizPage } from "@/features/quizzes/QuizPage"
import quizzes from "@/content/quizzes.json"

test("advances after answering a migrated quiz question", async () => {
  const user = userEvent.setup()
  const quiz = quizzes.quizzes.find((entry) => entry.id === "chem-easy")!
  const firstQuestion = quiz.questions[0]!
  const secondQuestion = quiz.questions[1]!
  const correctAnswer = firstQuestion.options[firstQuestion.correctIndex]!

  render(<QuizPage />)
  await user.click(screen.getByRole("button", { name: "Start Chemistry: Set A · Easier" }))
  await user.click(screen.getByRole("button", { name: correctAnswer }))
  await user.click(screen.getByRole("button", { name: "Next question" }))

  expect(screen.getByText(secondQuestion.prompt)).toBeVisible()
})

test("uses locked subject for a new custom quiz", async () => {
  const user = userEvent.setup()
  render(<QuizPage initialSubject="physics" />)

  await user.click(screen.getByRole("button", { name: "Create custom quiz" }))

  expect(screen.getByLabelText("Quiz subject")).toHaveValue("physics")
})
