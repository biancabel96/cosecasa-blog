"use client"

import { useState, useMemo, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Title } from "@/components/ui/title"
import { spacing } from "@/lib/design-system"
import { cn } from "@/lib/utils"

interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  image: string
  date: string
  categories: string[]
  categorySlug: string
}

interface HomePageClientProps {
  articles: Article[]
  categories: string[]
}

export function HomePageClient({ articles, categories }: HomePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return articles
    return articles.filter((article) => article.categories.includes(selectedCategory))
  }, [selectedCategory, articles])

  const toggleCategory = (category: string) => {
    setSelectedCategory((current) => (current === category ? null : category))
  }

  const latestArticles = filteredArticles.slice(0, 3)
  const remainingArticles = filteredArticles.slice(3)

  return (
    <>
      <section className="px-4 py-8 border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCategory(category)}
                className="text-sm"
              >
                #{category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section id="articoli" className="px-4 py-12">
        <div className={cn(spacing.containerWide)}>
          {filteredArticles.length > 0 && (
            <>
              {/* Latest section */}
              <div className="mb-12">
                {/* First article - full width */}
                {latestArticles[0] && (
                  <LinkCard article={latestArticles[0]} className="mb-6 overflow-hidden">
                    <div className="md:flex">
                      <div className="md:w-1/2">
                        <Image
                          src={latestArticles[0].image || "/placeholder.svg"}
                          alt={latestArticles[0].title}
                          width={600}
                          height={400}
                          className="w-full h-64 md:h-full object-cover"
                        />
                      </div>
                      <CardContent className="md:w-1/2 p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {latestArticles[0].categories.map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              #{cat}
                            </Badge>
                          ))}
                        </div>
                        <Title as="h3" variant="card" margin="sm" className="font-bold">
                          {latestArticles[0].title}
                        </Title>
                        <p className="text-muted-foreground mb-4 line-clamp-3">{latestArticles[0].excerpt}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(latestArticles[0].date).toLocaleDateString("it-IT", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </CardContent>
                    </div>
                  </LinkCard>
                )}

                {/* Second and third articles - side by side */}
                {latestArticles.length > 1 && (
                  <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {latestArticles.slice(1, 3).map((article) => (
                      <LinkCard key={article.id} article={article} className="overflow-hidden">
                        <Image
                          src={article.image || "/placeholder.svg"}
                          alt={article.title}
                          width={400}
                          height={250}
                          className="w-full h-48 object-cover"
                        />
                        <CardContent className="p-4">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {article.categories.map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                #{cat}
                              </Badge>
                            ))}
                          </div>
                          <Title as="h4" variant="card" margin="sm" className="font-semibold">
                            {article.title}
                          </Title>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(article.date).toLocaleDateString("it-IT", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </CardContent>
                      </LinkCard>
                    ))}
                  </div>
                )}
              </div>

              {/* Remaining articles in grid */}
              {remainingArticles.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {remainingArticles.map((article) => (
                    <LinkCard key={article.id} article={article} className="overflow-hidden">
                      <Image
                        src={article.image || "/placeholder.svg"}
                        alt={article.title}
                        width={300}
                        height={200}
                        className="w-full h-40 object-cover"
                      />
                      <CardContent className="p-4">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {article.categories.map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              #{cat}
                            </Badge>
                          ))}
                        </div>
                        <Title as="h4" variant="card" margin="sm" className="font-semibold text-base">
                          {article.title}
                        </Title>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(article.date).toLocaleDateString("it-IT", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </CardContent>
                    </LinkCard>
                  ))}
                </div>
              )}
            </>
          )}

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nessun articolo trovato per le categorie selezionate.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function LinkCard({ article, className, children }: { article: Article; className?: string; children: ReactNode }) {
  return (
    <Card className={cn("h-full transition hover:-translate-y-1 hover:shadow-lg", className)}>
      <Link
        href={`/${article.id}`}
        className="flex h-full flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2"
      >
        {children}
      </Link>
    </Card>
  )
}
