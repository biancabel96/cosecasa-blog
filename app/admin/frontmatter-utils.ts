type FrontmatterRecord = Record<string, string>

interface ParsedFrontmatter {
  data: FrontmatterRecord
  content: string
  hasFrontmatter: boolean
  order: string[]
}

const FRONTMATTER_DELIM = /^---\s*$/

export function applyDraftFlag(markdown: string, draft: boolean): string {
  const parsed = parseFrontmatter(markdown)
  const data: FrontmatterRecord = { ...parsed.data }
  const order = parsed.order.filter((key) => key !== "draft")

  if (draft) {
    data.draft = "true"
    order.push("draft")
  } else {
    delete data.draft
  }

  const hasData = Object.keys(data).length > 0

  if (!hasData) {
    if (!parsed.hasFrontmatter) {
      return markdown
    }
    return stripLeadingBlankLine(parsed.content)
  }

  const frontmatterBlock = buildFrontmatterBlock(data, order)
  const normalizedContent = ensureContentSpacing(parsed.content)

  return `${frontmatterBlock}${normalizedContent}`
}

export function extractDraftFlag(markdown?: string): boolean {
  if (!markdown) {
    return false
  }

  const parsed = parseFrontmatter(markdown)
  const value = parsed.data.draft

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") {
      return true
    }
    if (normalized === "false") {
      return false
    }
  }

  return false
}

export function extractFrontmatterTitle(markdown?: string): string | undefined {
  if (!markdown) {
    return undefined
  }

  const parsed = parseFrontmatter(markdown)
  const value = parsed.data.title
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }

  return undefined
}

function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const normalized = stripBom(markdown)
  if (!normalized.startsWith("---")) {
    return { data: {}, content: markdown, hasFrontmatter: false, order: [] }
  }

  const lines = normalized.split(/\r?\n/)
  if (!FRONTMATTER_DELIM.test(lines[0])) {
    return { data: {}, content: markdown, hasFrontmatter: false, order: [] }
  }

  let closingIndex = -1
  for (let index = 1; index < lines.length; index++) {
    if (FRONTMATTER_DELIM.test(lines[index])) {
      closingIndex = index
      break
    }
  }

  if (closingIndex === -1) {
    return { data: {}, content: markdown, hasFrontmatter: false, order: [] }
  }

  const frontmatterLines = lines.slice(1, closingIndex)
  const remainingLines = lines.slice(closingIndex + 1)
  const data: FrontmatterRecord = {}
  const order: string[] = []

  for (const line of frontmatterLines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) {
      continue
    }

    const key = line.slice(0, colonIndex).trim()
    if (!key) {
      continue
    }

    const value = line.slice(colonIndex + 1).trim()
    order.push(key)
    data[key] = value
  }

  return {
    data,
    content: remainingLines.join("\n"),
    hasFrontmatter: true,
    order,
  }
}

function buildFrontmatterBlock(data: FrontmatterRecord, order: string[]): string {
  const keys = Array.from(
    new Set(
      order
        .filter((key) => Object.prototype.hasOwnProperty.call(data, key))
        .concat(Object.keys(data)),
    ),
  )

  const body = keys.map((key) => `${key}: ${data[key]}`).join("\n")
  return `---\n${body}\n---`
}

function stripBom(value: string): string {
  if (value.charCodeAt(0) === 0xfeff) {
    return value.slice(1)
  }
  return value
}

function ensureContentSpacing(content: string): string {
  if (!content) {
    return "\n"
  }

  if (content.startsWith("\n")) {
    return content
  }

  return `\n\n${content}`
}

function stripLeadingBlankLine(content: string): string {
  return content.replace(/^\r?\n/, "")
}
