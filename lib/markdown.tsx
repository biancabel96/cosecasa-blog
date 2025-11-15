import { fetchArticlesFromGitHub, fetchArticleFromGitHub, extractUniqueTags, type ArticleRecord } from "./articles-service"

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

type ArticleCacheState = {
  initialized: boolean
  articles: Map<string, ArticleRecord>
}

const articleCacheState: ArticleCacheState = {
  initialized: false,
  articles: new Map(),
}

let loadPromise: Promise<void> | null = null

async function ensureArticlesLoaded(): Promise<void> {
  if (articleCacheState.initialized) {
    return
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      const articles = await fetchArticlesFromGitHub()
      articleCacheState.articles = new Map(articles.map((article) => [article.slug, article]))
      articleCacheState.initialized = true
    })().finally(() => {
      loadPromise = null
    })
  }

  await loadPromise
}

function getArticlesArray(includeDrafts?: boolean): ArticleRecord[] {
  const articles = Array.from(articleCacheState.articles.values())
  const filtered = includeDrafts ? articles : articles.filter((article) => !article.draft)
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function clearArticlesCache(): void {
  articleCacheState.articles.clear()
  articleCacheState.initialized = false
}

export async function refreshArticlesCache(slugs: string[]): Promise<void> {
  if (!slugs.length) {
    return
  }

  await ensureArticlesLoaded()

  const uniqueSlugs = Array.from(new Set(slugs))
  const refreshed = await Promise.all(uniqueSlugs.map((slug) => fetchArticleFromGitHub(slug)))

  uniqueSlugs.forEach((slug, index) => {
    const article = refreshed[index]
    if (article) {
      articleCacheState.articles.set(slug, article)
    } else {
      articleCacheState.articles.delete(slug)
    }
  })
}

export function removeArticlesFromCache(slugs: string[]): void {
  const uniqueSlugs = new Set(slugs)
  uniqueSlugs.forEach((slug) => {
    articleCacheState.articles.delete(slug)
  })
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
  await ensureArticlesLoaded()
  const article = articleCacheState.articles.get(slug)

  if (!article) {
    return null
  }

  return mapArticleToPost(article)
}

interface GetAllPostsOptions {
  includeDrafts?: boolean
}

export async function getAllPosts(options: GetAllPostsOptions = {}): Promise<Post[]> {
  await ensureArticlesLoaded()
  return getArticlesArray(options.includeDrafts).map(mapArticleToPost)
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
  await ensureArticlesLoaded()
  const articles = getArticlesArray(false)
  return extractUniqueTags(articles)
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.metadata.tags.includes(tag))
}
