import { useEffect, useMemo, useState } from "react"

import builtInContent from "@/content/quizzes.json"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isValidQuiz, readCustomQuizzes, saveCustomQuizzes, type Quiz, type QuizQuestion } from "./storage"

const builtInQuizzes: Quiz[] = builtInContent.quizzes
const newQuestion = (): QuizQuestion => ({ prompt: "", options: ["", ""], correctIndex: 0, explanation: "" })

function draftQuiz(subject = "chemistry"): Quiz {
  return { id: crypto.randomUUID(), subject, title: "", questions: [newQuestion()], custom: true }
}

function QuizEditor({ onSave, quiz: existingQuiz, triggerLabel = "Create custom quiz", lockedSubject }: { onSave: (quiz: Quiz) => boolean; quiz?: Quiz; triggerLabel?: string; lockedSubject?: string }) {
  const [quiz, setQuiz] = useState(() => existingQuiz ?? draftQuiz(lockedSubject))
  const [open, setOpen] = useState(false)
  const [saveError, setSaveError] = useState("")
  const valid = isValidQuiz(quiz)
  const updateQuestion = (index: number, question: QuizQuestion) => setQuiz((current) => ({ ...current, questions: current.questions.map((entry, entryIndex) => entryIndex === index ? question : entry) }))

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button variant="outline" />}>{triggerLabel}</DialogTrigger>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>{existingQuiz ? "Edit custom quiz" : "Create custom quiz"}</DialogTitle><DialogDescription>Questions need a prompt, two choices, and a valid correct answer.</DialogDescription></DialogHeader>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">Title<input aria-label="Quiz title" className="min-h-11 rounded-md border bg-background px-3" value={quiz.title} onChange={(event) => setQuiz((current) => ({ ...current, title: event.target.value }))} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Subject<input aria-label="Quiz subject" className="min-h-11 rounded-md border bg-background px-3" value={lockedSubject ?? quiz.subject} disabled={Boolean(lockedSubject)} onChange={(event) => setQuiz((current) => ({ ...current, subject: event.target.value }))} /></label>
        {quiz.questions.map((question, questionIndex) => <fieldset key={questionIndex} className="flex flex-col gap-2 rounded-lg border p-3"><legend className="px-1 text-sm font-medium">Question {questionIndex + 1}</legend>
          <input aria-label={`Question ${questionIndex + 1} prompt`} className="min-h-11 rounded-md border bg-background px-3" placeholder="Prompt" value={question.prompt} onChange={(event) => updateQuestion(questionIndex, { ...question, prompt: event.target.value })} />
          {question.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-2"><input type="radio" name={`correct-${questionIndex}`} checked={question.correctIndex === optionIndex} onChange={() => updateQuestion(questionIndex, { ...question, correctIndex: optionIndex })} aria-label={`Correct answer ${optionIndex + 1}`} /><label className="sr-only" htmlFor={`choice-${questionIndex}-${optionIndex}`}>Choice {optionIndex + 1}</label><input id={`choice-${questionIndex}-${optionIndex}`} className="min-h-11 min-w-0 flex-1 rounded-md border bg-background px-3" placeholder={`Choice ${optionIndex + 1}`} value={option} onChange={(event) => updateQuestion(questionIndex, { ...question, options: question.options.map((entry, entryIndex) => entryIndex === optionIndex ? event.target.value : entry) })} /></div>)}
          <input aria-label={`Question ${questionIndex + 1} explanation`} className="min-h-11 rounded-md border bg-background px-3" placeholder="Explanation (optional)" value={question.explanation} onChange={(event) => updateQuestion(questionIndex, { ...question, explanation: event.target.value })} />
        </fieldset>)}
        <Button type="button" variant="outline" onClick={() => setQuiz((current) => ({ ...current, questions: [...current.questions, newQuestion()] }))}>Add question</Button>
      </div>
      {saveError ? <Alert><AlertTitle>Quiz not saved</AlertTitle><AlertDescription>{saveError}</AlertDescription></Alert> : null}
      <DialogFooter><Button disabled={!valid} onClick={() => { if (!onSave({ ...quiz, subject: lockedSubject ?? quiz.subject, custom: true })) { setSaveError("Browser storage is unavailable or full."); return }; setSaveError(""); setOpen(false); if (!existingQuiz) setQuiz(draftQuiz(lockedSubject)) }}>Save quiz</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
export function QuizPage({ initialSubject = "all" }: { initialSubject?: string }) {
  const [customQuizzes, setCustomQuizzes] = useState<Quiz[]>(readCustomQuizzes)
  const [subject, setSubject] = useState(initialSubject)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [relaxed, setRelaxed] = useState(false)
  const [seconds, setSeconds] = useState(25)

  const quizzes = useMemo(() => [...builtInQuizzes, ...customQuizzes], [customQuizzes])
  const subjects = useMemo(() => [...new Set(quizzes.map((quiz) => quiz.subject))], [quizzes])
  const filteredQuizzes = initialSubject === "all" ? (subject === "all" ? quizzes : quizzes.filter((quiz) => quiz.subject === subject)) : quizzes.filter((quiz) => quiz.subject === initialSubject)
  const question = activeQuiz?.questions[questionIndex]
  const score = activeQuiz ? answers.filter((answer, index) => answer === activeQuiz.questions[index]?.correctIndex).length : 0
  const complete = activeQuiz !== null && answers.length === activeQuiz.questions.length

  useEffect(() => {
    if (!question || relaxed || selected !== null || complete) return
    const timeout = window.setTimeout(() => {
      if (seconds <= 1) {
        setSeconds(0)
        setSelected(-1)
        return
      }
      setSeconds(seconds - 1)
    }, 1000)
    return () => window.clearTimeout(timeout)
  }, [question, relaxed, selected, complete, seconds])

  const startQuiz = (quiz: Quiz) => { setActiveQuiz(quiz); setQuestionIndex(0); setAnswers([]); setSelected(null); setSeconds(25) }
  const advance = () => {
    if (!activeQuiz || selected === null) return
    const nextAnswers = [...answers, selected]
    setAnswers(nextAnswers)
    if (nextAnswers.length === activeQuiz.questions.length) return
    setQuestionIndex((current) => current + 1)
    setSelected(null)
    setSeconds(25)
  }
  const save = (quiz: Quiz): boolean => {
    const next = customQuizzes.some((entry) => entry.id === quiz.id) ? customQuizzes.map((entry) => entry.id === quiz.id ? quiz : entry) : [...customQuizzes, quiz]
    if (!saveCustomQuizzes(next)) return false
    setCustomQuizzes(next)
    return true
  }
  const duplicate = (quiz: Quiz) => save({ ...quiz, id: crypto.randomUUID(), title: `${quiz.title} copy`, custom: true, questions: quiz.questions.map((question) => ({ ...question, options: [...question.options] })) })
  const remove = (id: string) => { const next = customQuizzes.filter((quiz) => quiz.id !== id); if (saveCustomQuizzes(next)) setCustomQuizzes(next) }

  if (complete && activeQuiz) return <section className="mx-auto flex max-w-2xl flex-col gap-4"><Card><CardHeader><CardTitle>Quiz complete</CardTitle><CardDescription>{activeQuiz.title}</CardDescription></CardHeader><CardContent><p className="text-3xl font-semibold">{score} / {activeQuiz.questions.length}</p><p className="mt-2 text-muted-foreground">Correct answers</p></CardContent><CardFooter className="flex gap-2"><Button onClick={() => startQuiz(activeQuiz)}>Restart</Button><Button variant="outline" onClick={() => setActiveQuiz(null)}>Choose another quiz</Button></CardFooter></Card></section>

  if (activeQuiz && question) {
    const answered = selected !== null
    const correct = selected === question.correctIndex
    return <section className="mx-auto flex max-w-2xl flex-col gap-4"><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="secondary">Question {questionIndex + 1} of {activeQuiz.questions.length}</Badge><Button variant="outline" size="sm" onClick={() => setRelaxed((current) => !current)}>{relaxed ? "Relaxed mode on" : `Relaxed mode · ${seconds}s`}</Button></div><Card><CardHeader><CardTitle>{question.prompt}</CardTitle></CardHeader><CardContent><div className="flex flex-col gap-2" role="radiogroup" aria-label="Answers">{question.options.map((option, index) => <Button key={option} variant={selected === index ? "secondary" : "outline"} className="min-h-11 justify-start whitespace-normal text-left" disabled={answered} onClick={() => setSelected(index)}>{option}</Button>)}</div>{answered && <Alert className="mt-4"><AlertTitle>{correct ? "Correct" : selected === -1 ? "Time is up" : "Not quite"}</AlertTitle><AlertDescription>{question.explanation}</AlertDescription></Alert>}</CardContent><CardFooter>{answered ? <Button onClick={advance}>{questionIndex + 1 === activeQuiz.questions.length ? "See results" : "Next question"}</Button> : <Button variant="outline" onClick={() => setActiveQuiz(null)}>Exit quiz</Button>}</CardFooter></Card></section>
  }

  return <section className="mx-auto flex max-w-4xl flex-col gap-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold tracking-tight">Quizzes</h1><p className="mt-1 text-muted-foreground">Practice with timed questions or switch to relaxed mode.</p></div><QuizEditor onSave={save} lockedSubject={initialSubject === "all" ? undefined : initialSubject} /></div><label className="flex max-w-xs flex-col gap-1 text-sm font-medium">Subject<Select value={initialSubject === "all" ? subject : initialSubject} disabled={initialSubject !== "all"} onValueChange={(value) => setSubject(value ?? "all")} items={(initialSubject === "all" ? [{ label: "All subjects", value: "all" }, ...subjects.map((entry) => ({ label: entry, value: entry }))] : [{ label: initialSubject, value: initialSubject }])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{initialSubject === "all" ? <SelectItem value="all">All subjects</SelectItem> : null}{subjects.filter((entry) => initialSubject === "all" || entry === initialSubject).map((entry) => <SelectItem key={entry} value={entry}>{entry}</SelectItem>)}</SelectGroup></SelectContent></Select></label><div className="grid gap-4 sm:grid-cols-2">{filteredQuizzes.map((quiz) => <Card key={quiz.id}><CardHeader><CardTitle>{quiz.title}</CardTitle><CardDescription>{quiz.subject} · {quiz.questions.length} questions</CardDescription></CardHeader><CardFooter className="flex flex-wrap gap-2"><Button onClick={() => startQuiz(quiz)}>Start {quiz.title}</Button>{quiz.custom && <><Button variant="outline" onClick={() => duplicate(quiz)}>Duplicate</Button><QuizEditor quiz={quiz} triggerLabel="Edit" lockedSubject={initialSubject === "all" ? undefined : initialSubject} onSave={save} /><Button variant="destructive" onClick={() => remove(quiz.id)}>Delete</Button></>}</CardFooter></Card>)}</div></section>
}
