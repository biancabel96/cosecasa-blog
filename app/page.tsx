import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Title } from "@/components/ui/title"
import { spacing, typography } from "@/lib/design-system"
import { getAllPosts, getAllTags } from "@/lib/markdown"
import { cn } from "@/lib/utils"
import { HomePageClient } from "./home-page-client"

export default async function HomePage() {
  const posts = await getAllPosts()
  const allTags = await getAllTags()

  // Convert posts to articles format for the UI
  const articles = posts.map((post) => ({
    id: post.slug,
    title: post.metadata.title,
    excerpt: post.metadata.excerpt,
    content: post.content,
    image: post.metadata.image || "/placeholder.svg",
    date: post.metadata.date,
    categories: post.metadata.tags,
    categorySlug: post.metadata.category,
  }))

  return (
    <div className="min-h-screen bg-background">
      <section className={cn(spacing.sectionHero, 'relative px-4 py-24 md:py-28')}>
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card/90 p-8 shadow-[0_40px_140px_-80px_var(--ring)] md:p-14">
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div aria-hidden className="absolute -top-24 -left-32 h-72 w-72 rounded-full bg-brand-primary/15 blur-3xl" />
              <div aria-hidden className="absolute -bottom-32 -right-10 h-80 w-80 rounded-full border border-brand-primary/40 opacity-60" />
            </div>
            <div className="relative flex flex-col items-center gap-10 text-center md:flex-row md:items-start md:text-left">
              <div className="flex flex-col items-center gap-4 md:items-start">
                <div className="rounded-[2.75rem] border border-border/60 bg-background/80 p-8 shadow-inner">
                  <Image
                    src="/logo.png"
                    alt="Cosecase logo"
                    width={220}
                    height={220}
                    priority
                    className="h-40 w-40 object-contain md:h-48 md:w-48"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="space-y-4">
                  <Title
                    as="h1"
                    align="left"
                    margin="none"
                    className="text-balance text-3xl font-semibold tracking-tight md:text-4xl"
                  >
                    Cose, case, luoghi 
                    <br/>
                    e persone da scoprire
                  </Title>
                  <p className={cn(typography.sectionSubtitle, 'mx-auto max-w-2xl text-balance pt-6 text-muted-foreground md:mx-0 md:text-left')}>
                    Storie di bellezza, cultura, eccellenza e qualità: il magazine online per rendere la casa più bella e la vita più piacevole
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2 md:justify-start">
                  <Button size="lg" asChild>
                    <Link href="#articoli">
                      Esplora gli articoli
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border border-dashed border-border/80 bg-transparent text-brand-primary hover:bg-brand-muted/30"
                    asChild
                  >
                    <Link href="/about">Conosci Maria Rosa Sirotti</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomePageClient articles={articles} categories={allTags} />
    </div>
  )
}
