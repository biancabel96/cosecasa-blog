import { notFound } from "next/navigation"

import { getPostBySlug, getAllPosts, getRelatedPosts } from "@/lib/markdown"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleHeader } from "@/components/article-header"
import { ArticleContent } from "@/components/article-content"
import { ArticleMetadata } from "@/components/article-metadata"
import { RelatedPosts } from "@/components/related-posts"

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = params

  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post, 3)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <article>
          <ArticleHeader title={post.metadata.title} image={post.metadata.image} category={post.metadata.subcategory} />
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <ArticleMetadata metadata={post.metadata} />
            <ArticleContent content={post.content} />
          </div>
        </article>
        {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
      </main>
      <Footer />
    </div>
  )
}

export async function generateStaticParams() {
  const posts = await getAllPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Articolo non trovato - cosecase.it",
    }
  }

  return {
    title: `${post.metadata.title} - cosecase.it`,
    description: post.metadata.excerpt,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.excerpt,
      images: post.metadata.image ? [post.metadata.image] : [],
      type: "article",
      publishedTime: post.metadata.date,
      authors: [post.metadata.author || "Maria"],
      tags: post.metadata.tags,
    },
  }
}
