import { parseExpressionAt } from "acorn"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

type AstNode = { type: string; start: number; end: number }
type LiteralNode = AstNode & { value: string | number | boolean | null }
type ArrayNode = AstNode & { elements: AstNode[] }
type ObjectNode = AstNode & { properties: Array<{ key: AstNode; value: AstNode }> }

function balancedExpression(source: string, start: number): string {
  const opening = source.indexOf("{", start)
  if (opening < 0) throw new Error("Missing object expression")
  let depth = 0
  let quote = ""
  let escaped = false
  for (let index = opening; index < source.length; index += 1) {
    const character = source[index]!
    if (quote) {
      if (escaped) escaped = false
      else if (character === "\\") escaped = true
      else if (character === quote) quote = ""
    } else if (character === "'" || character === '"' || character === "`") quote = character
    else if (character === "{" || character === "[") depth += 1
    else if (character === "}" || character === "]") {
      depth -= 1
      if (depth === 0) return source.slice(opening, index + 1)
    }
  }
  throw new Error("Unclosed expression")
}

function balancedArray(source: string, start: number): string {
  const opening = source.indexOf("[", start)
  if (opening < 0) throw new Error("Missing array expression")
  let depth = 0
  let quote = ""
  let escaped = false
  for (let index = opening; index < source.length; index += 1) {
    const character = source[index]!
    if (quote) {
      if (escaped) escaped = false
      else if (character === "\\") escaped = true
      else if (character === quote) quote = ""
    } else if (character === "'" || character === '"' || character === "`") quote = character
    else if (character === "[") depth += 1
    else if (character === "]") {
      depth -= 1
      if (depth === 0) return source.slice(opening, index + 1)
    }
  }
  throw new Error("Unclosed array")
}

function decode(node: AstNode): unknown {
  if (node.type === "Literal") return (node as LiteralNode).value
  if (node.type === "Identifier") return (node as unknown as { name: string }).name
  if (node.type === "ArrayExpression") return (node as ArrayNode).elements.map(decode)
  if (node.type === "ObjectExpression") {
    return Object.fromEntries((node as ObjectNode).properties.map((property) => [String(decode(property.key)), decode(property.value)]))
  }
  throw new Error(`Unsupported node ${node.type}`)
}

function parseLiteral(source: string): unknown {
  return decode(parseExpressionAt(source, 0, { ecmaVersion: "latest" }) as unknown as AstNode)
}

function plainText(value: string): string {
  return value
    .replace(/<sub>(.*?)<\/sub>/g, "_$1")
    .replace(/<sup>(.*?)<\/sup>/g, "^$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&times;/g, "×")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

const html = await readFile("Revision_Hub__Chemistry_and_Physics.html", "utf8")
const templateMatch = html.match(/<script type="__bundler\/template">\s*(.*?)\s*<\/script>/s)
if (!templateMatch?.[1]) throw new Error("Missing legacy template")
const template = JSON.parse(templateMatch[1]) as string
const quizMarker = template.indexOf("QUIZ_DATA =")
const deckMarker = template.indexOf("function dkStarters()")
if (quizMarker < 0 || deckMarker < 0) throw new Error("Missing legacy study data")

const quizzes = parseLiteral(balancedExpression(template, quizMarker)) as Record<string, Record<string, Array<{ s: string; o: string[]; c: number; w: string }>>>
const decks = parseLiteral(balancedArray(template, template.indexOf("return", deckMarker))) as Array<{ id: string; name: string; subject: string; rec?: boolean; starter?: boolean; cards: Array<{ f: string; b: string }> }>

await mkdir("src/content", { recursive: true })
await writeFile(join("src/content", "quizzes.json"), `${JSON.stringify({ quizzes: Object.entries(quizzes).flatMap(([subject, sets]) => Object.entries(sets).map(([difficulty, questions]) => ({ id: `${subject}-${difficulty}`, subject: subject === "chem" ? "chemistry" : "physics", title: `${subject === "chem" ? "Chemistry" : "Physics"}: ${difficulty === "easy" ? "Set A · Easier" : "Set B · Challenging"}`, questions: questions.map((question) => ({ prompt: plainText(question.s), options: question.o.map(plainText), correctIndex: question.c, explanation: plainText(question.w) })) }))) }, null, 2)}\n`)
await writeFile(join("src/content", "flashcards.json"), `${JSON.stringify({ decks: decks.map((deck) => ({ id: deck.id, title: plainText(deck.name), subject: deck.subject === "chem" ? "chemistry" : "physics", recommended: Boolean(deck.rec), starter: Boolean(deck.starter), cards: deck.cards.map((card) => ({ front: plainText(card.f), back: plainText(card.b) })) })) }, null, 2)}\n`)
