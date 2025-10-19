import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Title } from "@/components/ui/title"
import { typography } from "@/lib/design-system"
import type { Post } from "@/lib/markdown"
import { cn } from "@/lib/utils"

interface PostGridProps {
  posts: Post[]
}

export function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Nessun articolo trovato in questa categoria.</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <Link key={post.slug} href={`/${post.slug}`}>
          <Card interactive className="group border-0 bg-background h-full">
            <CardContent className="p-0">
              {post.metadata.image && (
                <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
                  <img
                    src={post.metadata.image || "/placeholder.svg"}
                    alt={post.metadata.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {post.metadata.subcategory}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.metadata.date).toLocaleDateString("it-IT", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <Title
                  as="h3"
                  variant="card"
                  margin="sm"
                  className="group-hover:text-brand-primary transition-colors"
                >
                  {post.metadata.title}
                </Title>
                <p className={cn(typography.bodyMuted, 'text-sm flex-grow')}>
                  {post.metadata.excerpt}
                </p>
                <div className="flex flex-wrap gap-1 mt-4">
                  {post.metadata.tags.slice(0, 3).map((tag) => (
                    <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
                      <Badge
                        variant="outline"
                        className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
