import { createStorage } from "@/lib/local-storage"

export type QuizQuestion = {
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type Quiz = {
  id: string
  subject: string
  title: string
  questions: QuizQuestion[]
  custom?: true
}

const customQuizStore = createStorage<Quiz[]>("revision-hub:custom-quizzes", 1, [])

function isQuestion(value: unknown): value is QuizQuestion {
  if (typeof value !== "object" || value === null || !("prompt" in value) || !("options" in value) || !("correctIndex" in value) || !("explanation" in value)) return false
  const { prompt, options, correctIndex, explanation } = value
  return typeof prompt === "string" && prompt.trim().length > 0
    && Array.isArray(options) && options.length >= 2
    && options.every((option) => typeof option === "string" && option.trim().length > 0)
    && typeof correctIndex === "number" && Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < options.length
    && typeof explanation === "string"
}

export function isValidQuiz(value: unknown): value is Quiz {
  if (typeof value !== "object" || value === null || !("id" in value) || !("subject" in value) || !("title" in value) || !("questions" in value)) return false
  const { id, subject, title, questions } = value
  return typeof id === "string" && id.length > 0
    && typeof subject === "string" && subject.trim().length > 0
    && typeof title === "string" && title.trim().length > 0
    && Array.isArray(questions) && questions.length > 0 && questions.every(isQuestion)
}

export function readCustomQuizzes(): Quiz[] {
  const stored = customQuizStore.read()
  if (!Array.isArray(stored)) return []
  const quizzes: Quiz[] = []
  for (const quiz of stored) if (isValidQuiz(quiz)) quizzes.push({ ...quiz, custom: true })
  return quizzes
}

export function saveCustomQuizzes(quizzes: Quiz[]): boolean {
  const validQuizzes: Quiz[] = []
  for (const quiz of quizzes) if (isValidQuiz(quiz)) validQuizzes.push({ ...quiz, custom: true })
  return customQuizStore.write(validQuizzes)
}
