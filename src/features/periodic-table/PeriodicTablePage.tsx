import { useState } from "react"

import elements from "@/content/elements.json"
import { Button } from "@/components/ui/button"

type Element = (typeof elements)[number]

const categoryTints: Record<string, string> = {
  "Alkali metal": "border-destructive/30 bg-destructive/10 hover:bg-destructive/15",
  "Alkaline earth metal": "border-primary/30 bg-primary/10 hover:bg-primary/15",
  Actinide: "border-primary/30 bg-primary/10 hover:bg-primary/15",
  Halogen: "border-destructive/30 bg-destructive/10 hover:bg-destructive/15",
  Lanthanide: "border-primary/30 bg-primary/10 hover:bg-primary/15",
  Metalloid: "border-primary/30 bg-primary/10 hover:bg-primary/15",
  "Noble gas": "border-primary/30 bg-primary/10 hover:bg-primary/15",
  Nonmetal: "border-primary/30 bg-primary/10 hover:bg-primary/15",
  "Post-transition metal": "border-muted-foreground/30 bg-muted hover:bg-muted/75",
  "Transition metal": "border-muted-foreground/30 bg-muted hover:bg-muted/75",
}

function SelectedElementPanel({ selected }: { selected: Element | null }) {
  return <aside role="region" aria-label="Selected element" className="col-start-3 col-span-10 row-start-1 row-span-3 flex min-w-0 flex-col justify-center rounded-md border border-primary/20 bg-background p-3 shadow-sm">
    {selected ? <div aria-live="polite" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2"><h2 className="min-w-0 truncate text-lg font-semibold">{selected.name} <span className="text-muted-foreground">({selected.symbol})</span></h2><span className="shrink-0 text-xs font-medium text-muted-foreground">{selected.category}</span></div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs"><div><dt className="text-muted-foreground">Atomic number</dt><dd>{selected.atomicNumber}</dd></div><div><dt className="text-muted-foreground">Relative atomic mass</dt><dd>{selected.mass}</dd></div><div><dt className="text-muted-foreground">Shells</dt><dd>{selected.shells}</dd></div><div><dt className="text-muted-foreground">Period / group</dt><dd>{selected.period} / {selected.group}</dd></div></dl>
      {selected.note ? <p className="text-xs leading-snug text-muted-foreground">{selected.note}</p> : <p className="text-xs text-muted-foreground">No revision note recorded for this element.</p>}
    </div> : <div className="space-y-1"><h2 className="text-sm font-semibold">Selected element</h2><p className="text-xs text-muted-foreground">Select or focus an element to view its structure and revision note.</p></div>}
  </aside>
}

export function PeriodicTablePage() {
  const [selected, setSelected] = useState<Element | null>(null)

  return <section className="mx-auto max-w-6xl">
    <div className="mb-6"><h1 className="text-3xl font-semibold tracking-tight">Periodic Table</h1><p className="mt-2 text-muted-foreground">Select an element for its structure and revision note.</p></div>
    <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground"><span>Element categories are labelled in every detail view.</span><span>Highlighted study notes cover qualitative analysis.</span></div>
    <p className="mb-2 text-sm text-muted-foreground sm:hidden">Swipe horizontally to explore all elements.</p>
    <div className="overflow-x-auto rounded-lg border bg-muted/20 p-3 shadow-sm">
      <div className="grid min-w-[58rem] grid-cols-[repeat(18,minmax(2.6rem,1fr))] gap-1">
        <SelectedElementPanel selected={selected} />
        {elements.map((element) => <Button key={element.symbol} variant="outline" className={`col-span-1 row-span-1 grid aspect-square h-auto min-h-0 grid-rows-[auto_1fr_auto_auto] items-center border p-1 text-center leading-none ${categoryTints[element.category] ?? "border-primary/15 bg-primary/5 hover:bg-primary/10"}`} style={{ gridColumnStart: element.group, gridRowStart: element.period }} aria-label={`${element.name}, atomic number ${element.atomicNumber}`} onClick={() => setSelected(element)} onFocus={() => setSelected(element)}>
          <span className="justify-self-start text-[0.625rem] text-muted-foreground">{element.atomicNumber}</span><span className="self-end text-base font-semibold">{element.symbol}</span><span className="w-full truncate text-[0.55rem] text-muted-foreground">{element.name}</span><span className="text-[0.55rem] text-muted-foreground">{element.mass}</span>
        </Button>)}
      </div>
    </div>
  </section>
}
