import { z } from "zod"

const id = z.string().regex(/^[a-z0-9-]+$/)

const markdown = z.string().min(1).refine((value) => !/<\/?[a-z][^>]*>/i.test(value), "Raw HTML is not allowed")

const headingBlock = z.object({ type: z.literal("heading"), text: z.string().min(1), level: z.union([z.literal(2), z.literal(3)]) })
const richTextBlock = z.object({ type: z.literal("richText"), markdown })
const calloutBlock = z.object({ type: z.literal("callout"), title: z.string().min(1), body: markdown, tone: z.enum(["info", "tip", "warning"]).default("info") })
const comparisonBlock = z.object({ type: z.literal("comparison"), items: z.array(z.object({ title: z.string().min(1), body: markdown })).min(2) })
const tableBlock = z.object({ type: z.literal("table"), headers: z.array(z.string().min(1)).min(1), rows: z.array(z.array(z.string())).min(1) }).superRefine((value, context) => {
  value.rows.forEach((row, index) => {
    if (row.length !== value.headers.length) context.addIssue({ code: "custom", message: `Row ${index + 1} must match header width` })
  })
})
const figureBlock = z.object({ type: z.literal("figure"), src: z.string().min(1), alt: z.string().min(1), caption: z.string().optional() })
const figureGalleryBlock = z.object({ type: z.literal("figureGallery"), summary: z.string().min(1), figures: z.array(figureBlock.omit({ type: true })).min(1) })
const toolLinkBlock = z.object({ type: z.enum(["quizLink", "flashcardLink", "periodicTableLink"]), label: z.string().min(1), targetId: id.optional() })

export const lessonBlockSchema = z.discriminatedUnion("type", [headingBlock, richTextBlock, calloutBlock, comparisonBlock, tableBlock, figureBlock, figureGalleryBlock, toolLinkBlock])

export const lessonSchema = z.object({
  id,
  title: z.string().min(1),
  summary: z.string(),
  tags: z.array(z.string()),
  blocks: z.array(lessonBlockSchema).min(1),
})

export const contentSchema = z.object({
  subjects: z.array(z.object({ id: id, title: z.string().min(1), lessons: z.array(lessonSchema).min(1) })).min(1),
}).superRefine((catalog, context) => {
  const subjectIds = new Set<string>()
  catalog.subjects.forEach((subject) => {
    if (subjectIds.has(subject.id)) context.addIssue({ code: "custom", message: `Duplicate subject id: ${subject.id}` })
    subjectIds.add(subject.id)
    const lessonIds = new Set<string>()
    subject.lessons.forEach((lesson) => {
      if (lessonIds.has(lesson.id)) context.addIssue({ code: "custom", message: `Duplicate lesson id: ${lesson.id}` })
      lessonIds.add(lesson.id)
    })
  })
})

export type ContentCatalog = z.infer<typeof contentSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type LessonBlock = z.infer<typeof lessonBlockSchema>

export function validateContent(value: unknown): ContentCatalog {
  return contentSchema.parse(value)
}
