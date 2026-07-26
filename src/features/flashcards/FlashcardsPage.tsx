import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import content from "@/content/flashcards.json"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  exportDecks,
  importDecks,
  loadCustomDecks,
  saveCustomDecks,
  type Flashcard,
  type FlashcardDeck,
} from "./storage"

const builtInDecks: FlashcardDeck[] = content.decks

export function FlashcardsPage({ initialSubject = "all", initialDeckId }: { initialSubject?: string; initialDeckId?: string }) {
  const [customDecks, setCustomDecks] = useState(loadCustomDecks)
  const [subject, setSubject] = useState(initialSubject)
  const [studying, setStudying] = useState<FlashcardDeck | null>(() => builtInDecks.find((deck) => deck.id === initialDeckId) ?? null)
  const [cards, setCards] = useState<Flashcard[]>(() => builtInDecks.find((deck) => deck.id === initialDeckId)?.cards ?? [])
  const [cardIndex, setCardIndex] = useState(0)
  const [missedCards, setMissedCards] = useState<Flashcard[]>([])
  const [reviewingMissed, setReviewingMissed] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null)
  const [error, setError] = useState("")
  const importInput = useRef<HTMLInputElement>(null)
  const decks = [...builtInDecks, ...customDecks]
  const subjects = [...new Set(decks.map((deck) => deck.subject))]
  const visibleDecks = initialSubject === "all" ? (subject === "all" ? decks : decks.filter((deck) => deck.subject === subject)) : decks.filter((deck) => deck.subject === initialSubject)
  const card = cards[cardIndex]
  const updateCustomDecks = (next: FlashcardDeck[]) => {
    if (!saveCustomDecks(next)) {
      setError("Could not save decks in this browser.")
      return false
    }
    setCustomDecks(next)
    return true
  }

  const startStudy = (deck: FlashcardDeck) => {
    setStudying(deck)
    setCards(deck.cards)
    setCardIndex(0)
    setMissedCards([])
    setReviewingMissed(false)
    setRevealed(false)
  }

  const gradeCard = (missed: boolean) => {
    const nextMissed = missed ? [...missedCards, card] : missedCards
    if (cardIndex + 1 < cards.length) {
      setCardIndex((current) => current + 1)
      setMissedCards(nextMissed)
      setRevealed(false)
      return
    }
    if (nextMissed.length) {
      setCards(nextMissed)
      setCardIndex(0)
      setMissedCards([])
      setReviewingMissed(true)
      setRevealed(false)
      return
    }
    setStudying(null)
  }

  const saveDeck = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const cards = String(form.get("cards") ?? "")
      .split("\n")
      .map((line) => line.split("|", 2).map((part) => part.trim()))
      .filter(([front, back]) => front && back)
    const title = String(form.get("title") ?? "").trim()
    const deckSubject = initialSubject === "all" ? String(form.get("subject") ?? "").trim() : initialSubject
    if (!title || !deckSubject || !cards.length) {
      setError("Add a title, subject, and at least one Question | Answer card.")
      return
    }
    const nextDeck: FlashcardDeck = {
      id: editingDeck?.id ?? crypto.randomUUID(),
      title,
      subject: deckSubject,
      cards: cards.map(([front, back]) => ({ front, back })),
      custom: true,
      recommended: false,
    }
    if (!updateCustomDecks(editingDeck ? customDecks.map((deck) => deck.id === editingDeck.id ? nextDeck : deck) : [...customDecks, nextDeck])) return
    setError("")
    setCreateOpen(false)
    setEditingDeck(null)
  }

  const duplicateDeck = (deck: FlashcardDeck) => {
    updateCustomDecks([
      ...customDecks,
      { ...deck, id: crypto.randomUUID(), title: `${deck.title} copy`, custom: true, recommended: false },
    ])
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      updateCustomDecks([...customDecks, ...importDecks(await file.text())])
      setError("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not import decks.")
    } finally {
      event.target.value = ""
    }
  }

  const downloadDecks = () => {
    const url = URL.createObjectURL(new Blob([exportDecks(customDecks)], { type: "application/json" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "flashcard-decks.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  if (studying && card) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">{reviewingMissed ? "Review missed cards" : studying.title}</p>
            <h1 className="font-heading text-2xl font-semibold">Card {cardIndex + 1} of {cards.length}</h1>
          </div>
          <Button variant="outline" onClick={() => setStudying(null)}>Back to decks</Button>
        </div>
        <Card className="min-h-72 justify-center">
          <CardContent className="flex flex-col gap-6 py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">Question</p>
            <p className="text-xl leading-relaxed sm:text-2xl">{card.front}</p>
            {revealed ? (
              <div className="flex flex-col gap-3 border-t pt-6">
                <p className="text-sm font-medium text-muted-foreground">Answer</p>
                <p className="text-lg leading-relaxed">{card.back}</p>
              </div>
            ) : (
              <Button className="self-center" onClick={() => setRevealed(true)}>Reveal answer</Button>
            )}
          </CardContent>
          {revealed && (
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => gradeCard(true)}>Review again</Button>
              <Button className="w-full sm:w-auto" onClick={() => gradeCard(false)}>Got it</Button>
            </CardFooter>
          )}
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">Active recall</p>
          <h1 className="font-heading text-3xl font-semibold">Flashcards</h1>
          <p className="text-muted-foreground">Choose a deck, reveal each answer, then revisit cards you missed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadDecks}>Export custom decks</Button>
          <Button variant="outline" onClick={() => importInput.current?.click()}>Import JSON</Button>
          <input ref={importInput} aria-label="Import flashcard decks" className="sr-only" type="file" accept="application/json" onChange={handleImport} />
          <Button onClick={() => { setEditingDeck(null); setCreateOpen(true) }}>Create deck</Button>
        </div>
      </header>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <label className="flex max-w-xs flex-col gap-2 text-sm font-medium">
        Subject
        <select className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm" value={initialSubject === "all" ? subject : initialSubject} disabled={initialSubject !== "all"} onChange={(event) => setSubject(event.target.value)}>
          {initialSubject === "all" ? <option value="all">All subjects</option> : null}
          {subjects.filter((item) => initialSubject === "all" || item === initialSubject).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <section aria-label="Deck library" className="grid gap-4 sm:grid-cols-2">
        {visibleDecks.map((deck) => (
          <Card key={deck.id}>
            <CardHeader>
              <CardTitle>{deck.title}</CardTitle>
              <CardDescription>{deck.cards.length} cards · {deck.subject}</CardDescription>
              <CardAction>{deck.recommended && <Badge>Recommended</Badge>}</CardAction>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-2">
              <Button onClick={() => startStudy(deck)}>Study {deck.title}</Button>
              <Button variant="outline" aria-label={`Duplicate ${deck.title}`} onClick={() => duplicateDeck(deck)}>Duplicate</Button>
              {deck.custom && <Button variant="outline" aria-label={`Edit ${deck.title}`} onClick={() => { setEditingDeck(deck); setCreateOpen(true) }}>Edit</Button>}
              {deck.custom && <Button variant="destructive" aria-label={`Delete ${deck.title}`} onClick={() => updateCustomDecks(customDecks.filter((item) => item.id !== deck.id))}>Delete</Button>}
            </CardFooter>
          </Card>
        ))}
      </section>
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setEditingDeck(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDeck ? "Edit custom deck" : "Create custom deck"}</DialogTitle>
            <DialogDescription>Write one card per line as Question | Answer.</DialogDescription>
          </DialogHeader>
          <form key={editingDeck?.id ?? "new"} className="flex flex-col gap-4" onSubmit={saveDeck}>
            <label className="flex flex-col gap-2 text-sm font-medium">Deck title<input className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm" name="title" defaultValue={editingDeck?.title} required /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Subject<input aria-label="Deck subject" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm" name="subject" defaultValue={editingDeck?.subject ?? (initialSubject === "all" ? "" : initialSubject)} disabled={initialSubject !== "all"} required /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Cards<textarea className="min-h-24 rounded-lg border border-input bg-background px-2.5 py-2 text-sm" name="cards" defaultValue={editingDeck?.cards.map((card) => `${card.front} | ${card.back}`).join("\n")} placeholder="Question | Answer" required /></label>
            <DialogFooter><Button type="submit">Save deck</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
