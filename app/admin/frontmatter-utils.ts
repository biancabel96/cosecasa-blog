import matter from "gray-matter"

type FrontmatterRecord = Record<string, unknown>

export function applyDraftFlag(markdown: string, draft: boolean): string {
  try {
    const parsed = matter(markdown)
    const data: FrontmatterRecord = { ...parsed.data }

    if (draft) {
      data.draft = true
    } else if (Object.prototype.hasOwnProperty.call(data, "draft")) {
      delete data.draft
    }

    return matter.stringify(parsed.content, data)
  } catch (error) {
    console.error("Impossibile aggiornare il frontmatter della bozza", error)
    return markdown
  }
}

export function extractDraftFlag(markdown?: string): boolean {
  if (!markdown) {
    return false
  }

  try {
    const parsed = matter(markdown)
    const value = parsed.data?.draft
    if (typeof value === "boolean") {
      return value
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()
      if (normalized === "true") {
        return true
      }
      if (normalized === "false") {
        return false
      }
    }
  } catch (error) {
    console.error("Impossibile leggere il frontmatter della bozza", error)
  }

  return false
}

export function extractFrontmatterTitle(markdown?: string): string | undefined {
  if (!markdown) {
    return undefined
  }

  try {
    const parsed = matter(markdown)
    const value = parsed.data?.title
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
  } catch (error) {
    console.error("Impossibile leggere il titolo dal frontmatter", error)
  }

  return undefined
}
