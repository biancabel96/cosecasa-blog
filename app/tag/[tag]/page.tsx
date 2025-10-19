import { notFound } from "next/navigation"

import { getPostsByTag, getAllTags } from "@/lib/markdown"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CategoryHeader } from "@/components/category-header"
import { PostGrid } from "@/components/post-grid"

interface TagPageProps {
  params: {
    tag: string
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = params
  const decodedTag = decodeURIComponent(tag)

  const posts = await getPostsByTag(decodedTag)

  if (posts.length === 0) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <CategoryHeader title={`Tag: ${decodedTag}`} description={`Tutti gli articoli taggati con "${decodedTag}"`} />
        <div className="container mx-auto px-4 py-8">
          <PostGrid posts={posts} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export async function generateStaticParams() {
  const tags = await getAllTags()

  return tags.map((tag) => ({
    tag: encodeURIComponent(tag),
  }))
}

export function generateMetadata({ params }: TagPageProps) {
  const { tag } = params
  const decodedTag = decodeURIComponent(tag)

  return {
    title: `Tag: ${decodedTag} - cosecase.it`,
    description: `Scopri tutti gli articoli taggati con "${decodedTag}" su cosecase.it`,
  }
}
