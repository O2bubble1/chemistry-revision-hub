import Markdown from "react-markdown"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LessonBlock } from "./schema"

type Props = { blocks: LessonBlock[]; onToolLink?: (type: "quizLink" | "flashcardLink" | "periodicTableLink", targetId?: string) => void }

export function resolveFigureSrc(src: string, base = import.meta.env.BASE_URL): string {
  return `${base.replace(/\/$/, "")}/${src.replace(/^\//, "")}`
}

function Figure({ src, alt, caption }: Extract<LessonBlock, { type: "figure" }> | Extract<LessonBlock, { type: "figureGallery" }>["figures"][number]) {
  return <figure className="typeset-figure"><img src={resolveFigureSrc(src)} alt={alt} loading="lazy" decoding="async" />{caption ? <figcaption className="typeset-figure-caption">{caption}</figcaption> : null}</figure>
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
            return <Alert key={key} variant={block.tone}><AlertTitle>{block.title}</AlertTitle><AlertDescription><Markdown>{block.body}</Markdown></AlertDescription></Alert>
          case "comparison":
            return <div key={key} data-comparison-grid className="grid items-start gap-4 sm:grid-cols-2">{block.items.map((item, itemIndex) => <Card key={item.title} data-comparison-item={itemIndex}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><Markdown>{item.body}</Markdown></CardContent></Card>)}</div>
          case "table":
            return <div key={key} className="typeset-scroll"><Table><TableHeader><TableRow>{block.headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader><TableBody>{block.rows.map((row, rowIndex) => <TableRow key={rowIndex}>{row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table></div>
          case "figure":
            return <Figure key={key} {...block} />
          case "figureGallery":
            return <Accordion key={key}><AccordionItem value={key}><AccordionTrigger>{block.summary}</AccordionTrigger><AccordionContent><div className="space-y-4">{block.figures.map((figure) => <Figure key={figure.src} {...figure} />)}</div></AccordionContent></AccordionItem></Accordion>
          case "quizLink":
          case "flashcardLink":
          case "periodicTableLink":
            return <button key={key} type="button" className="not-typeset text-primary underline underline-offset-4" onClick={() => onToolLink?.(block.type, block.targetId)}>{block.label}</button>
        }
      })}
    </article>
  )
}
