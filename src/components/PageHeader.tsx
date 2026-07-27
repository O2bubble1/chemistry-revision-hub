import type { ReactNode } from "react"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  summary?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, summary, actions }: PageHeaderProps) {
  return <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      {eyebrow ? <p className="mb-2 text-sm text-muted-foreground">{eyebrow}</p> : null}
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {summary ? <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{summary}</p> : null}
    </div>
    {actions}
  </header>
}
