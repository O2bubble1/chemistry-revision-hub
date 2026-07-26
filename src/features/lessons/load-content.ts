import content from "@/content/lessons.json"
import { validateContent } from "./schema"

export const catalog = validateContent(content)
