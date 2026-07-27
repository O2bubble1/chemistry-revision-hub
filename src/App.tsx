import { AtomIcon, HelpCircleIcon, LayersIcon, MenuIcon, MoonIcon, SunIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { readNavigation, type NavigationState, writeNavigation } from "@/app/navigation"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/PageHeader"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { FlashcardsPage } from "@/features/flashcards/FlashcardsPage"
import { catalog } from "@/features/lessons/load-content"
import { LessonRenderer } from "@/features/lessons/LessonRenderer"
import { PeriodicTablePage } from "@/features/periodic-table/PeriodicTablePage"
import { QuizPage } from "@/features/quizzes/QuizPage"
import { createStorage } from "@/lib/local-storage"

type View = "lesson" | "periodic" | "quiz" | "flashcards"
type Theme = "light" | "dark" | "system"

const sidebarLabel: Record<string, string> = {
  mnemonics: "Mnemonics",
  "cation-tests": "Cation tests",
  "anion-tests": "Anion tests",
  "gas-tests": "Gas tests",
  "qa-strategy": "QA strategy",
  "salt-prep": "Salt prep",
  oxides: "Oxides",
  bonding: "Chem bonding",
  "model-answers": "Model answers",
  "solubility-rules": "Solubility",
  "ph-indicators": "pH indicators",
  "periodic-table": "Periodic table",
  "kahoot-quiz": "Quiz",
  flashcards: "Flashcards",
  kinematics: "Kinematics",
  "motion-graphs": "Motion graphs",
  "equations-of-motion": "Equations of motion",
  "forces-weight": "Forces & weight",
  "newtons-laws": "Newton’s laws",
  "friction-terminal-velocity": "Friction & terminal velocity",
  "work-energy-power": "Work, energy & power",
  "energy-resources": "Energy resources",
  "worked-examples": "Worked examples",
}
const themeStore = createStorage<Theme>("revision-hub:theme", 1, "system")

function useNavigation() {
  const [navigation, setNavigation] = useState<NavigationState>(() => readNavigation(window.location.search, catalog))
  useEffect(() => {
    const onPopState = () => setNavigation(readNavigation(window.location.search, catalog))
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])
  const select = (state: NavigationState) => {
    window.history.pushState({}, "", writeNavigation(state))
    setNavigation(state)
  }
  return [navigation, select] as const
}

export default function App() {
  const [navigation, select] = useNavigation()
  const [view, setView] = useState<View>("lesson")
  const [toolTargetId, setToolTargetId] = useState<string>()
  const [theme, setTheme] = useState<Theme>(() => themeStore.read())
  const [mobileOpen, setMobileOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const subject = catalog.subjects.find((entry) => entry.id === navigation.subjectId) ?? catalog.subjects[0]!
  const lesson = subject.lessons.find((entry) => entry.id === navigation.topicId) ?? subject.lessons[0]!
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const originalMaterialsUrl = `${import.meta.env.BASE_URL}original-materials.html`

  useEffect(() => { document.documentElement.classList.toggle("dark", dark) }, [dark])
  useEffect(() => { if (toolTargetId && (view === "quiz" || view === "flashcards")) mainRef.current?.focus() }, [toolTargetId, view])
  const chooseLesson = (topicId: string) => { setView("lesson"); select({ subjectId: subject.id, topicId }) }
  const chooseSubject = (subjectId: string) => {
    const next = catalog.subjects.find((entry) => entry.id === subjectId)!
    setView("lesson")
    select({ subjectId: next.id, topicId: next.lessons[0]!.id })
  }
  const switchTheme = () => {
    const next: Theme = dark ? "light" : "dark"
    themeStore.write(next)
    setTheme(next)
  }
  const navigationList = (close?: () => void) => <nav aria-label="Topics" className="flex flex-col gap-1">{subject.lessons.map((topic) => <Button key={topic.id} variant={view === "lesson" && lesson.id === topic.id ? "secondary" : "ghost"} className="min-h-11 justify-start" aria-label={topic.title} title={topic.title} onClick={() => { chooseLesson(topic.id); close?.() }}>{sidebarLabel[topic.id] ?? topic.title}</Button>)}</nav>
  const openTool = (nextView: View) => { setToolTargetId(undefined); setView(nextView) }
  const toolLinks = <div className="mb-8 flex flex-wrap gap-2">{subject.id === "chemistry" ? <Button variant="outline" className="min-h-11" onClick={() => openTool("periodic")}><AtomIcon data-icon="inline-start" />Periodic table</Button> : null}<Button variant="outline" className="min-h-11" onClick={() => openTool("quiz")}><HelpCircleIcon data-icon="inline-start" />Quiz</Button><Button variant="outline" className="min-h-11" onClick={() => openTool("flashcards")}><LayersIcon data-icon="inline-start" />Flashcards</Button></div>
  const archiveLink = <a className="mt-auto inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href={originalMaterialsUrl}>Original materials</a>
  const content = view === "lesson" ? <section className="mx-auto max-w-5xl"><PageHeader eyebrow={`${subject.title} / ${lesson.title}`} title={lesson.title} summary={lesson.summary} /><LessonRenderer blocks={lesson.blocks} onToolLink={(type, targetId) => { setToolTargetId(targetId); setView(type === "periodicTableLink" ? "periodic" : type === "quizLink" ? "quiz" : "flashcards") }} /></section> : view === "periodic" ? <PeriodicTablePage /> : view === "quiz" ? <QuizPage key={`quiz-${toolTargetId ?? "library"}`} initialSubject={subject.id} initialQuizId={toolTargetId} /> : <FlashcardsPage key={`flashcards-${toolTargetId ?? "library"}`} initialSubject={subject.id} initialDeckId={toolTargetId} />

  return <div className="min-h-svh bg-background text-foreground">
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur"><div className="flex min-h-16 items-center gap-3 px-4 lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={(open) => { setMobileOpen(open) }}><SheetTrigger render={<Button variant="outline" size="icon" className="min-h-11 min-w-11 lg:hidden" aria-label="Open topic navigation" />}><MenuIcon /></SheetTrigger><SheetContent side="left"><SheetHeader><SheetTitle>{subject.title} topics</SheetTitle></SheetHeader><div className="flex h-full flex-col overflow-y-auto px-4 pb-6">{navigationList(() => setMobileOpen(false))}{archiveLink}</div></SheetContent></Sheet>
      <button type="button" className="flex min-h-11 items-center gap-2 text-left font-semibold" aria-label="Revision Hub home" onClick={() => setView("lesson")}><AtomIcon aria-hidden="true" /><span className="hidden sm:inline">Revision Hub</span></button>
      <div className="ml-auto flex min-w-0 items-center gap-2"><Select value={subject.id} onValueChange={(value) => { if (value) chooseSubject(value) }} items={catalog.subjects.map((entry) => ({ label: entry.title, value: entry.id }))}><SelectTrigger aria-label="Subject" className="h-10 min-w-0 w-28 sm:min-w-32"><SelectValue /></SelectTrigger><SelectContent align="end"><SelectGroup>{catalog.subjects.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.title}</SelectItem>)}</SelectGroup></SelectContent></Select><Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Switch theme" onClick={switchTheme}>{dark ? <SunIcon /> : <MoonIcon />}</Button></div>
    </div></header>
    <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]"><aside className="hidden h-[calc(100svh-4rem)] self-start overflow-y-auto border-r p-3 lg:sticky lg:top-16 lg:flex lg:flex-col">{navigationList()}{archiveLink}</aside><main ref={mainRef} tabIndex={-1} className="min-w-0 px-4 py-8 focus:outline-none sm:px-8 lg:px-10 xl:px-12">{view === "lesson" ? toolLinks : null}{content}</main></div>
  </div>
}
