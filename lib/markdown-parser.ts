import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeHighlight from "rehype-highlight"
import rehypeStringify from "rehype-stringify"

import { getRawFileUrl } from "./github-api"

export interface ParsedMarkdown {
  frontmatter: {
    title: string
    date: string
    description: string
    tags: string[]
    draft: boolean
  }
  htmlContent: string
  rawContent: string
}

interface ImagePathResolverOptions {
  slug: string
  filename: string
}

export type ImagePathResolver = (options: ImagePathResolverOptions) => string

export interface ParseMarkdownOptions {
  imagePathResolver?: ImagePathResolver
}

const defaultImagePathResolver: ImagePathResolver = ({ slug, filename }) => {
  return ghRawUrl(slug, filename)
}

/**
 * Parse a Markdown file with YAML frontmatter
 * Extracts metadata and converts Markdown to HTML with syntax highlighting
 */
export async function parseMarkdown(
  markdownText: string,
  slug: string,
  options?: ParseMarkdownOptions,
): Promise<ParsedMarkdown> {
  // Parse frontmatter using gray-matter
  const { data, content } = matter(markdownText)

  // Extract and parse tags from comma-separated string
  const tagsRaw = data.tags || ""
  const tags =
    typeof tagsRaw === "string"
      ? tagsRaw
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : Array.isArray(tagsRaw)
        ? tagsRaw
        : []

  const imagePathResolver = options?.imagePathResolver ?? defaultImagePathResolver

  // Replace relative image paths with full GitHub raw URLs
  const contentWithResolvedImages = resolveImagePaths(content, slug, imagePathResolver)

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight, {
      detect: false,
      subset: ["swift", "javascript", "typescript", "css", "html", "bash", "json"],
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(contentWithResolvedImages)

  const htmlContent = processedContent.toString()

  return {
    frontmatter: {
      title: data.title || "Untitled",
      date: data.date || new Date().toISOString().split("T")[0],
      description: data.description || "",
      tags,
      draft: resolveDraftFlag(data.draft),
    },
    htmlContent,
    rawContent: content,
  }
}

function resolveDraftFlag(value: unknown): boolean {
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

  return false
}

/**
 * Replace relative image paths with full GitHub raw URLs
 * Converts: ![alt](/image.png) -> ![alt](https://raw.githubusercontent.com/.../articles/slug/image.png)
 */
function resolveImagePaths(content: string, slug: string, resolver: ImagePathResolver): string {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g

  return content.replace(imageRegex, (match, alt, path) => {
    if (isRelativePath(path)) {
      const normalized = normalizeRelativePath(path)
      const imageUrl = resolver({ slug, filename: normalized })
      return `![${alt}](${imageUrl})`
    }

    return match
  })
}

function isRelativePath(path: string): boolean {
  return path.startsWith("./") || path.startsWith("../") || path.startsWith("/") || !/^https?:/i.test(path)
}

function normalizeRelativePath(path: string): string {
  if (path.includes("..")) {
    throw new Error("Path traversal rilevato nelle immagini dell'articolo.")
  }

  const withoutLeading = path.replace(/^\.+\/+/, "").replace(/^\/+/, "")
  const normalized = withoutLeading.replace(/\\/g, "/")

  return normalized
}

function ghRawUrl(slug: string, filename: string): string {
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "")

  if (!cleanSlug) {
    throw new Error("Slug articolo non valido per la generazione dell'URL GitHub.")
  }

  const cleanFile = filename.replace(/\\/g, "/").replace(/^\/+/, "")

  if (!cleanFile || cleanFile.includes("..")) {
    throw new Error("Percorso immagine non valido per GitHub Raw.")
  }

  return getRawFileUrl(`articles/${cleanSlug}/${cleanFile}`)
}
