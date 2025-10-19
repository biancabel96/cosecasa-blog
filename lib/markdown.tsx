import { cache } from "react"

import { fetchArticlesFromGitHub, extractUniqueTags, type ArticleRecord } from "./articles-service"

export interface PostMetadata {
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

export interface Post {
  slug: string
  metadata: PostMetadata
  content: string
}

// Cache for build-time article fetching
const getCachedArticles = cache(async (): Promise<ArticleRecord[]> => {
  return await fetchArticlesFromGitHub()
})

// Allows server actions to flush the memoized GitHub fetch when new content lands
export function clearArticlesCache(): void {
  const cached = getCachedArticles as typeof getCachedArticles & { clear?: () => void }
  cached.clear?.()
}

/**
 * Map ArticleRecord to Post interface
 */
function mapArticleToPost(article: ArticleRecord): Post {
  const subcategory = article.tags[0] || "generale"

  return {
    slug: article.slug,
    metadata: {
      title: article.title,
      excerpt: article.description,
      date: article.date,
      subcategory,
      tags: article.tags,
      image: article.imageUrl,
      author: "cosecase",
      featured: false, // Can be enhanced later by checking a frontmatter field
      draft: article.draft,
    },
    content: article.htmlContent,
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const articles = await getCachedArticles()
  const article = articles.find((a) => a.slug === slug)

  if (!article) {
    return null
  }

  return mapArticleToPost(article)
}

interface GetAllPostsOptions {
  includeDrafts?: boolean
}

export async function getAllPosts(options: GetAllPostsOptions = {}): Promise<Post[]> {
  const articles = await getCachedArticles()
  const filtered = options.includeDrafts ? articles : articles.filter((article) => !article.draft)
  return filtered.map(mapArticleToPost)
}

export async function getFeaturedPosts(limit = 6): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.metadata.featured).slice(0, limit)
}

export async function getRelatedPosts(currentPost: Post, limit = 3): Promise<Post[]> {
  const allPosts = await getAllPosts()
  const otherPosts = allPosts.filter((post) => post.slug !== currentPost.slug)

  // Find posts with matching tags or same subcategory
  const relatedPosts = otherPosts.filter((post) => {
    const hasMatchingTags = post.metadata.tags.some((tag) => currentPost.metadata.tags.includes(tag))
    const sameSubcategory = post.metadata.subcategory === currentPost.metadata.subcategory

    return hasMatchingTags || sameSubcategory
  })

  // If not enough related posts, fill with recent posts
  if (relatedPosts.length < limit) {
    const recentPosts = otherPosts.filter((post) => !relatedPosts.includes(post))
    relatedPosts.push(...recentPosts.slice(0, limit - relatedPosts.length))
  }

  return relatedPosts.slice(0, limit)
}

export async function getAllTags(): Promise<string[]> {
  const articles = await getCachedArticles()
  const published = articles.filter((article) => !article.draft)
  return extractUniqueTags(published)
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.metadata.tags.includes(tag))
}
