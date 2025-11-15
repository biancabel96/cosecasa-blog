import { listDirectoryContents, getFileContent, getRawFileUrl } from "./github-api"
import { parseMarkdown } from "./markdown-parser"

export interface ArticleRecord {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  htmlContent: string
  imageUrl?: string
  draft: boolean
}

const IMAGE_PATTERN = /\.(png|jpe?g|webp|gif|svg)$/i

export async function fetchArticlesFromGitHub(): Promise<ArticleRecord[]> {
  const slugs = await fetchArticleSlugsFromGitHub()
  const articles = await Promise.all(slugs.map((slug) => fetchArticleFromGitHub(slug)))
  const filtered = articles.filter((article): article is ArticleRecord => Boolean(article))
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return filtered
}

export async function fetchArticleSlugsFromGitHub(): Promise<string[]> {
  const rootEntries = await listDirectoryContents("articles")
  return rootEntries.filter((entry) => entry.type === "dir").map((entry) => entry.name)
}

export async function fetchArticleFromGitHub(slug: string): Promise<ArticleRecord | null> {
  try {
    const markdownPath = `articles/${slug}/text.md`
    const markdownText = await getFileContent(markdownPath)
    if (!markdownText) {
      return null
    }

    const parsed = await parseMarkdown(markdownText, slug)

    const articleFiles = await listDirectoryContents(`articles/${slug}`)
    const bannerImage = articleFiles.find((entry) => entry.type === "file" && IMAGE_PATTERN.test(entry.name))
    const imageUrl = bannerImage ? getRawFileUrl(bannerImage.path) : undefined

    return {
      slug,
      title: parsed.frontmatter.title,
      date: parsed.frontmatter.date,
      description: parsed.frontmatter.description,
      tags: parsed.frontmatter.tags,
      htmlContent: parsed.htmlContent,
      imageUrl,
      draft: parsed.frontmatter.draft,
    }
  } catch (error) {
    console.error(`Unable to load article ${slug}`, error)
    return null
  }
}

export function extractUniqueTags(articles: ArticleRecord[]): string[] {
  const tagSet = new Set<string>()

  for (const article of articles) {
    for (const tag of article.tags) {
      tagSet.add(tag)
    }
  }

  return Array.from(tagSet).sort()
}

function extractFirstImage(htmlContent: string): string | undefined {
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i)
  return imgMatch?.[1]
}
