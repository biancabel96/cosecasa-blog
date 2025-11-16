import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { parseMarkdown, type ImagePathResolver } from "../lib/markdown-parser"

interface GeneratedPostMetadata {
  title: string
  excerpt: string
  date: string
  subcategory: string
  tags: string[]
  image?: string
  author?: string
  featured?: boolean
  draft: boolean
}

interface GeneratedPost {
  slug: string
  metadata: GeneratedPostMetadata
  content: string
}

interface GeneratedArticlesFile {
  generatedAt: string
  posts: GeneratedPost[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.join(__dirname, "..")
const ARTICLES_DIR = path.join(ROOT_DIR, "articles")
const GENERATED_DIR = path.join(ROOT_DIR, "generated")
const OUTPUT_JSON_PATH = path.join(GENERATED_DIR, "articles.json")
const PUBLIC_ARTICLES_DIR = path.join(ROOT_DIR, "public", "articles")

const IMAGE_PATTERN = /\.(png|jpe?g|webp|gif|svg)$/i

async function main() {
  await ensureDirectory(GENERATED_DIR)
  await fs.rm(PUBLIC_ARTICLES_DIR, { recursive: true, force: true })
  await ensureDirectory(PUBLIC_ARTICLES_DIR)

  const slugs = await readArticleSlugs()

  const posts: GeneratedPost[] = []

  for (const slug of slugs) {
    const markdownPath = path.join(ARTICLES_DIR, slug, "text.md")

    let markdown: string
    try {
      markdown = await fs.readFile(markdownPath, "utf8")
    } catch (error) {
      console.warn(`[articles] Skipping "${slug}" because text.md is missing or unreadable.`)
      continue
    }

    const assetsInfo = await copyArticleAssets(slug)

    const htmlResolver: ImagePathResolver = ({ slug: currentSlug, filename }) => {
      return buildLocalAssetPath(currentSlug, filename)
    }

    const parsed = await parseMarkdown(markdown, slug, {
      imagePathResolver: htmlResolver,
    })

    const subcategory = parsed.frontmatter.tags[0] ?? "generale"

    posts.push({
      slug,
      metadata: {
        title: parsed.frontmatter.title || slug,
        excerpt: parsed.frontmatter.description || "",
        date: parsed.frontmatter.date,
        subcategory,
        tags: parsed.frontmatter.tags,
        image: assetsInfo?.heroImagePath,
        author: "cosecase",
        featured: false,
        draft: parsed.frontmatter.draft,
      },
      content: parsed.htmlContent,
    })
  }

  posts.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime())

  const payload: GeneratedArticlesFile = {
    generatedAt: new Date().toISOString(),
    posts,
  }

  await fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify(payload, null, 2), "utf8")

  console.log(`Generated ${posts.length} article${posts.length === 1 ? "" : "s"} → ${path.relative(ROOT_DIR, OUTPUT_JSON_PATH)}`)
}

async function readArticleSlugs(): Promise<string[]> {
  const dirEntries = await fs.readdir(ARTICLES_DIR, { withFileTypes: true })
  return dirEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

interface AssetsInfo {
  heroImagePath?: string
}

async function copyArticleAssets(slug: string): Promise<AssetsInfo | null> {
  const sourceDir = path.join(ARTICLES_DIR, slug)
  const destinationDir = path.join(PUBLIC_ARTICLES_DIR, slug)

  // Ensure destination directory mirrors the source content (minus markdown)
  await fs.rm(destinationDir, { recursive: true, force: true })
  await fs.mkdir(destinationDir, { recursive: true })

  const dirEntries = await fs.readdir(sourceDir, { withFileTypes: true })

  const assetFiles = dirEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase() !== "text.md")
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))

  const heroImageName = selectHeroImage(assetFiles)
  const heroImagePath = heroImageName ? buildLocalAssetPath(slug, heroImageName) : undefined

  // Copy files/directories except text.md
  await Promise.all(
    dirEntries.map(async (entry) => {
      if (entry.name.toLowerCase() === "text.md") {
        return
      }

      const sourcePath = path.join(sourceDir, entry.name)
      const destinationPath = path.join(destinationDir, entry.name)

      if (entry.isDirectory()) {
        await copyDirectoryRecursive(sourcePath, destinationPath)
        return
      }

      if (entry.isFile()) {
        await ensureDirectory(path.dirname(destinationPath))
        await fs.copyFile(sourcePath, destinationPath)
      }
    }),
  )

  return { heroImagePath }
}

async function copyDirectoryRecursive(source: string, destination: string): Promise<void> {
  await fs.mkdir(destination, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const destinationPath = path.join(destination, entry.name)

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(sourcePath, destinationPath)
    } else if (entry.isFile()) {
      await ensureDirectory(path.dirname(destinationPath))
      await fs.copyFile(sourcePath, destinationPath)
    }
  }
}

function selectHeroImage(filenames: string[]): string | undefined {
  if (!filenames.length) {
    return undefined
  }

  const images = filenames.filter((name) => IMAGE_PATTERN.test(name))
  if (!images.length) {
    return undefined
  }

  const preferred = images.find((name) => name.toLowerCase().startsWith("banner"))
  return preferred ?? images[0]
}

function buildLocalAssetPath(slug: string, filename: string): string {
  const cleanFilename = filename.replace(/\\/g, "/")
  return `/articles/${slug}/${cleanFilename}`
}

async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

main().catch((error) => {
  console.error("Failed to generate articles dataset", error)
  process.exitCode = 1
})
