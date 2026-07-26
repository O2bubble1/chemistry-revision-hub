import Markdown from "react-markdown"

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LessonBlock } from "./schema"

type Props = { blocks: LessonBlock[]; onToolLink?: (type: "quizLink" | "flashcardLink" | "periodicTableLink", targetId?: string) => void }

export function resolveFigureSrc(src: string, base = import.meta.env.BASE_URL): string {
  return `${base.replace(/\/$/, "")}/${src.replace(/^\//, "")}`
}

export function LessonRenderer({ blocks, onToolLink }: Props) {
  return (
    <article className="typeset typeset-docs max-w-3xl">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`
        switch (block.type) {
          case "heading":
            return block.level === 2 ? <h2 key={key}>{block.text}</h2> : <h3 key={key}>{block.text}</h3>
          case "richText":
            return <Markdown key={key}>{block.markdown}</Markdown>
          case "callout":
            return <Alert key={key}><AlertTitle>{block.title}</AlertTitle><AlertDescription><Markdown>{block.body}</Markdown></AlertDescription></Alert>
          case "comparison":
            return <div key={key} data-comparison-grid className="grid items-start gap-4 sm:grid-cols-2">{block.items.map((item, itemIndex) => <Card key={item.title} data-comparison-item={itemIndex} className={block.items.length === 3 && itemIndex === 2 ? "sm:col-span-2 sm:w-[calc(50%-0.5rem)] sm:justify-self-center" : undefined}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><Markdown>{item.body}</Markdown></CardContent></Card>)}</div>
          case "table":
            return <div key={key} className="typeset-scroll"><Table><TableHeader><TableRow>{block.headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader><TableBody>{block.rows.map((row, rowIndex) => <TableRow key={rowIndex}>{row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table></div>
          case "figure":
            return <figure key={key} className="typeset-figure"><img src={resolveFigureSrc(block.src)} alt={block.alt} loading="lazy" decoding="async" />{block.caption ? <figcaption className="typeset-figure-caption">{block.caption}</figcaption> : null}</figure>
          case "details":
            return <Accordion key={key} className="not-typeset" defaultValue={undefined}><AccordionItem value={key}><AccordionTrigger>{block.summary}</AccordionTrigger><AccordionContent><div className="typeset"><Markdown>{block.markdown}</Markdown></div></AccordionContent></AccordionItem></Accordion>
          case "quizLink":
          case "flashcardLink":
          case "periodicTableLink":
            return <button key={key} type="button" className="not-typeset text-primary underline underline-offset-4" onClick={() => onToolLink?.(block.type, block.targetId)}>{block.label}</button>
        }
      })}
    </article>
  )
}
