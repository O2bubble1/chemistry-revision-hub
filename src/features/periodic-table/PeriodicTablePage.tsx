import { useState } from "react"

import elements from "@/content/elements.json"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/PageHeader"

type Element = (typeof elements)[number]

const categoryTints: Record<string, string> = {
  "Alkali metal": "border-rose-300/80 bg-rose-100/80 hover:bg-rose-200/80 dark:border-rose-300/35 dark:bg-rose-950/50 dark:hover:bg-rose-900/60",
  "Alkaline earth metal": "border-orange-300/80 bg-orange-100/80 hover:bg-orange-200/80 dark:border-orange-300/35 dark:bg-orange-950/50 dark:hover:bg-orange-900/60",
  Actinide: "border-red-300/80 bg-red-100/80 hover:bg-red-200/80 dark:border-red-300/35 dark:bg-red-950/50 dark:hover:bg-red-900/60",
  Halogen: "border-fuchsia-300/80 bg-fuchsia-100/80 hover:bg-fuchsia-200/80 dark:border-fuchsia-300/35 dark:bg-fuchsia-950/50 dark:hover:bg-fuchsia-900/60",
  Lanthanide: "border-cyan-300/80 bg-cyan-100/80 hover:bg-cyan-200/80 dark:border-cyan-300/35 dark:bg-cyan-950/50 dark:hover:bg-cyan-900/60",
  Metalloid: "border-amber-300/80 bg-amber-100/80 hover:bg-amber-200/80 dark:border-amber-300/35 dark:bg-amber-950/50 dark:hover:bg-amber-900/60",
  "Noble gas": "border-violet-300/80 bg-violet-100/80 hover:bg-violet-200/80 dark:border-violet-300/35 dark:bg-violet-950/50 dark:hover:bg-violet-900/60",
  Nonmetal: "border-emerald-300/80 bg-emerald-100/80 hover:bg-emerald-200/80 dark:border-emerald-300/35 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60",
  "Post-transition metal": "border-indigo-300/80 bg-indigo-100/80 hover:bg-indigo-200/80 dark:border-indigo-300/35 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60",
  "Transition metal": "border-sky-300/80 bg-sky-100/80 hover:bg-sky-200/80 dark:border-sky-300/35 dark:bg-sky-950/50 dark:hover:bg-sky-900/60",
}

function SelectedElementPanel({ selected }: { selected: Element | null }) {
  return <aside data-testid="periodic-detail-band" role="region" aria-label="Selected element" className="flex h-auto min-h-64 flex-col justify-center rounded-lg border border-primary/25 bg-card p-5 shadow-sm sm:min-h-0 sm:h-52">
    {selected ? <div aria-live="polite" className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <h2 className="min-w-0 text-xl font-semibold tracking-tight">{selected.name} <span className="text-muted-foreground">({selected.symbol})</span></h2>
        <span className="shrink-0 rounded-full border border-current/25 px-2 py-1 text-xs font-medium text-muted-foreground">{selected.category}</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
        <div><dt className="text-muted-foreground">Atomic number</dt><dd className="font-medium">{selected.atomicNumber}</dd></div>
        <div><dt className="text-muted-foreground">Relative atomic mass</dt><dd className="font-medium">{selected.mass}</dd></div>
        <div><dt className="text-muted-foreground">Shells</dt><dd className="font-medium">{selected.shells}</dd></div>
        <div><dt className="text-muted-foreground">Period / group</dt><dd className="font-medium">{selected.period} / {selected.group}</dd></div>
      </dl>
      <p className="text-sm leading-snug text-muted-foreground">{selected.note || "No revision note recorded for this element."}</p>
    </div> : <div className="space-y-2"><h2 className="text-lg font-semibold">Selected element</h2><p className="max-w-2xl text-sm text-muted-foreground">Select or focus an element to view its structure and revision note.</p></div>}
  </aside>
}

export function PeriodicTablePage() {
  const [selected, setSelected] = useState<Element | null>(null)

  return <section className="mx-auto w-full max-w-[96rem]">
    <PageHeader title="Periodic Table" summary="Select an element for its structure and revision note." />
    <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground"><span>Element categories are labelled in every detail view.</span><span>Highlighted study notes cover qualitative analysis.</span></div>
    <SelectedElementPanel selected={selected} />
    <p className="mb-2 mt-4 text-sm text-muted-foreground sm:hidden">Swipe the table horizontally to explore all elements</p>
    <div data-testid="periodic-table-viewport" className="mt-4 overflow-x-auto overflow-y-hidden rounded-lg border bg-muted/20 p-3 shadow-sm">
      <div className="min-w-[58rem]">
        <div data-testid="periodic-group-labels" className="mb-1.5 grid grid-cols-[repeat(18,minmax(2.6rem,1fr))] gap-1.5 text-center text-xs font-medium text-muted-foreground">
          {Array.from({ length: 18 }, (_, index) => <span key={index}>{index + 1}</span>)}
        </div>
        <div className="grid grid-cols-[repeat(18,minmax(2.6rem,1fr))] gap-1.5">
          {elements.map((element) => <Button key={element.symbol} variant="outline" data-category={element.category} className={`col-span-1 row-span-1 grid aspect-square h-auto min-h-0 min-w-0 overflow-hidden grid-rows-[auto_1fr_auto_auto] gap-0 border p-0.5 text-center leading-none focus-visible:ring-2 focus-visible:ring-inset ${categoryTints[element.category] ?? "border-primary/35 bg-primary/10 hover:bg-primary/20"}`} style={{ gridColumnStart: element.group, gridRowStart: element.period }} aria-label={`${element.name}, atomic number ${element.atomicNumber}`} onClick={() => setSelected(element)} onFocus={() => setSelected(element)}>
            <span data-element-field="mass" className="min-w-0 justify-self-center text-[0.45rem] leading-none text-muted-foreground">{element.mass}</span>
            <span data-element-field="symbol" className="min-w-0 self-center text-base leading-none font-semibold">{element.symbol}</span>
            <span data-element-field="name" className="min-w-0 w-full truncate text-[0.4rem] leading-none font-medium text-muted-foreground">{element.name}</span>
            <span data-element-field="atomic-number" className="min-w-0 justify-self-center text-[0.45rem] leading-none text-muted-foreground">{element.atomicNumber}</span>
          </Button>)}
        </div>
      </div>
    </div>
  </section>
}
