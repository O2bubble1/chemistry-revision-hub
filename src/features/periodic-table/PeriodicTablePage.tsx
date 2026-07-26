import { useState } from "react"

import elements from "@/content/elements.json"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Element = (typeof elements)[number]

export function PeriodicTablePage() {
  const [selected, setSelected] = useState<Element | null>(null)

  return <section className="mx-auto max-w-6xl">
    <div className="mb-6"><h1 className="text-3xl font-semibold tracking-tight">Periodic Table</h1><p className="mt-2 text-muted-foreground">Select an element for its structure and revision note.</p></div>
    <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground"><span>Element categories are labelled in every detail view.</span><span>Highlighted study notes cover qualitative analysis.</span></div>
    <div className="overflow-x-auto rounded-lg border bg-muted/20 p-3 shadow-sm">
      <div className="grid min-w-[58rem] grid-cols-[repeat(18,minmax(2.6rem,1fr))] gap-1">
        {elements.map((element) => <Button key={element.symbol} variant="outline" className="col-span-1 row-span-1 aspect-square h-auto min-h-11 border-primary/15 bg-primary/5 p-1 text-center hover:border-primary/40 hover:bg-primary/10" style={{ gridColumnStart: element.group, gridRowStart: element.period }} aria-label={`${element.name}, atomic number ${element.atomicNumber}`} onClick={() => setSelected(element)}><span className="text-base font-semibold">{element.symbol}</span><span className="text-[0.65rem] text-muted-foreground">{element.atomicNumber}</span></Button>)}
      </div>
    </div>
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
      <DialogContent>{selected ? <><DialogHeader><DialogTitle>{selected.name} ({selected.symbol})</DialogTitle><DialogDescription>{selected.category}</DialogDescription></DialogHeader><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Atomic number</dt><dd>{selected.atomicNumber}</dd></div><div><dt className="text-muted-foreground">Relative atomic mass</dt><dd>{selected.mass}</dd></div><div><dt className="text-muted-foreground">Shells</dt><dd>{selected.shells}</dd></div><div><dt className="text-muted-foreground">Period / group</dt><dd>{selected.period} / {selected.group}</dd></div></dl>{selected.note ? <p className="rounded-md bg-muted p-3 text-sm">{selected.note}</p> : null}</> : null}</DialogContent>
    </Dialog>
  </section>
}
