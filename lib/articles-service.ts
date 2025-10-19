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
  const rootEntries = await listDirectoryContents("articles")
  const articleDirs = rootEntries.filter((entry) => entry.type === "dir")

  const articles: ArticleRecord[] = []

  for (const dir of articleDirs) {
    const slug = dir.name

    try {
      const markdownPath = `articles/${slug}/text.md`
      const markdownText = await getFileContent(markdownPath)
      if (!markdownText) {
        continue
      }

      const parsed = await parseMarkdown(markdownText, slug)

      // Look for banner image (banner.png, banner.jpg, banner.webp, etc.)
      const articleFiles = await listDirectoryContents(`articles/${slug}`)
      const bannerImage = articleFiles.find(
        (entry) => entry.type === "file" && /^banner\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)
      )

      const imageUrl = bannerImage ? getRawFileUrl(bannerImage.path) : undefined

      articles.push({
        slug,
        title: parsed.frontmatter.title,
        date: parsed.frontmatter.date,
        description: parsed.frontmatter.description,
        tags: parsed.frontmatter.tags,
        htmlContent: parsed.htmlContent,
        imageUrl,
        draft: parsed.frontmatter.draft,
      })
    } catch (error) {
      console.error(`Unable to load article ${dir.name}`, error)
    }
  }

  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return articles
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
