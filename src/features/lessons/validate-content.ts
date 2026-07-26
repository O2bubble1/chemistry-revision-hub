import elements from "@/content/elements.json"
import flashcards from "@/content/flashcards.json"
import quizzes from "@/content/quizzes.json"
import { z } from "zod"
import { catalog } from "./load-content"

const quizQuestion = z.object({ prompt: z.string().min(1), options: z.array(z.string().min(1)).min(2), correctIndex: z.number().int().nonnegative(), explanation: z.string() }).superRefine((value, context) => {
  if (value.correctIndex >= value.options.length) context.addIssue({ code: "custom", message: "Correct index must point to an option" })
})
const quizSchema = z.object({ quizzes: z.array(z.object({ id: z.string().min(1), subject: z.string().min(1), title: z.string().min(1), questions: z.array(quizQuestion).min(1) })).min(1) })
const deckSchema = z.object({ decks: z.array(z.object({ id: z.string().min(1), subject: z.string().min(1), title: z.string().min(1), cards: z.array(z.object({ front: z.string().min(1), back: z.string().min(1) })).min(1) })).min(1) })
const elementSchema = z.object({ symbol: z.string().min(1), name: z.string().min(1), atomicNumber: z.number().int().min(1).max(118), category: z.string().min(1), shells: z.string().min(1), period: z.number().int().min(1).max(10), group: z.number().int().min(1).max(18), mass: z.number().positive(), note: z.string() })

quizSchema.parse(quizzes)
deckSchema.parse(flashcards)
const parsedElements = z.array(elementSchema).length(118).parse(elements)
if (new Set(parsedElements.map((element) => element.atomicNumber)).size !== 118) throw new Error("Element atomic numbers must be unique")

console.log(`Validated ${catalog.subjects.length} subjects, ${catalog.subjects.reduce((count, subject) => count + subject.lessons.length, 0)} lessons, ${quizzes.quizzes.length} quizzes, ${flashcards.decks.length} decks, and ${parsedElements.length} elements.`)
