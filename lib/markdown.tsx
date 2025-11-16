import generatedArticles from "@/generated/articles.json"

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

type GeneratedArticlesFile = {
  generatedAt: string
  posts: Post[]
}

const generatedData = generatedArticles as GeneratedArticlesFile

const allPosts = freezePosts(generatedData.posts)
const publishedPosts = allPosts.filter((post) => !post.metadata.draft)

function freezePosts(posts: Post[]): Post[] {
  return posts
    .slice()
    .sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime())
    .map((post) => ({
      ...post,
      metadata: {
        ...post.metadata,
        tags: [...post.metadata.tags],
      },
    }))
}

function clonePost(post: Post): Post {
  return {
    slug: post.slug,
    content: post.content,
    metadata: {
      ...post.metadata,
      tags: [...post.metadata.tags],
    },
  }
}

function clonePosts(posts: Post[]): Post[] {
  return posts.map(clonePost)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const post = allPosts.find((entry) => entry.slug === slug)
  return post ? clonePost(post) : null
}

interface GetAllPostsOptions {
  includeDrafts?: boolean
}

export async function getAllPosts(options: GetAllPostsOptions = {}): Promise<Post[]> {
  const source = options.includeDrafts ? allPosts : publishedPosts
  return clonePosts(source)
}

export async function getFeaturedPosts(limit = 6): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.metadata.featured).slice(0, limit)
}

export async function getRelatedPosts(currentPost: Post, limit = 3): Promise<Post[]> {
  const all = await getAllPosts()
  const others = all.filter((post) => post.slug !== currentPost.slug)

  const related = others.filter((post) => {
    const hasTag = post.metadata.tags.some((tag) => currentPost.metadata.tags.includes(tag))
    const sameSubcategory = post.metadata.subcategory === currentPost.metadata.subcategory
    return hasTag || sameSubcategory
  })

  if (related.length < limit) {
    const filler = others.filter((post) => !related.includes(post))
    related.push(...filler.slice(0, limit - related.length))
  }

  return related.slice(0, limit)
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts()
  const tagSet = new Set<string>()
  posts.forEach((post) => post.metadata.tags.forEach((tag) => tagSet.add(tag)))
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.metadata.tags.includes(tag))
}
