import { z } from "zod"
import { createStorage } from "@/lib/local-storage"

const deckSchema = z.object({
  id: z.string(),
  subject: z.string(),
  title: z.string(),
  recommended: z.boolean().optional(),
  custom: z.boolean().optional(),
  cards: z.array(z.object({ front: z.string(), back: z.string() })).min(1),
})

export type Flashcard = z.infer<typeof deckSchema>["cards"][number]
export type FlashcardDeck = z.infer<typeof deckSchema>

const deckStore = createStorage<unknown>("revision-hub:custom-decks", 1, [])

export function loadCustomDecks(): FlashcardDeck[] {
  const saved = z.array(deckSchema).safeParse(deckStore.read())
  return saved.success ? saved.data.map((deck) => ({ ...deck, custom: true })) : []
}

export function saveCustomDecks(decks: FlashcardDeck[]): boolean {
  return deckStore.write(decks)
}

export function exportDecks(decks: FlashcardDeck[]) {
  return JSON.stringify({ decks }, null, 2)
}

export function importDecks(json: string): FlashcardDeck[] {
  const parsed: unknown = JSON.parse(json)
  const imported = z.union([z.array(deckSchema), z.object({ decks: z.array(deckSchema) })]).safeParse(parsed)
  if (!imported.success) throw new Error("Import must contain valid flashcard decks.")
  const decks = Array.isArray(imported.data) ? imported.data : imported.data.decks
  if (!decks.length) throw new Error("Import must contain at least one deck.")
  return decks.map((deck) => ({ ...deck, id: crypto.randomUUID(), custom: true, recommended: false }))
}
