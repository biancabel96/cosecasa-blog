import Link from "next/link"

import { Plus, Home } from "lucide-react"

import { Title } from "@/components/ui/title"
import { spacing, typography } from "@/lib/design-system"
import { cn } from "@/lib/utils"

import { PublishButton } from "./publish-button"
import { ClearCacheButton } from "./clear-cache-button"
import { PendingSummary } from "./pending-summary"
import { RepoExplorer } from "./repo-explorer"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Pannello amministrazione",
  description: "Gestisci gli articoli salvati su GitHub.",
}

interface AdminDashboardPageProps {
  searchParams?: { prefix?: string }
}

export default function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const rawPrefix = searchParams?.prefix ? decodeURIComponent(searchParams.prefix) : ""
  const safeSegments = rawPrefix
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && !segment.includes(".."))
  const normalizedPrefix =
    safeSegments.length && safeSegments[0] === "articles"
      ? `${safeSegments.join("/")}/`
      : "articles/"

  const breadcrumbSegments = normalizedPrefix ? normalizedPrefix.slice(0, -1).split("/") : []
  const breadcrumbs = [] as Array<{ label: string; href: string; active: boolean }>

  breadcrumbs.push({ label: "Articoli", href: "/admin", active: breadcrumbSegments.length === 1 })

  if (breadcrumbSegments.length > 1) {
    let cumulative = ""
    breadcrumbSegments.slice(1).forEach((segment, index) => {
      cumulative += `${segment}/`
      const hrefPrefix = `articles/${cumulative}`
      breadcrumbs.push({
        label: segment,
        href: `/admin?prefix=${encodeURIComponent(hrefPrefix)}`,
        active: index === breadcrumbSegments.length - 2,
      })
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <section className={cn(spacing.section, "py-20")}>
        <div className={cn(spacing.containerWide, "space-y-8")}>
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Title as="h1" margin="none">
                Archivio cosecase.it
              </Title>
              <div className="flex flex-wrap items-center gap-3">
                <PublishButton />
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  Home
                </Link>
                <Link
                  href="/admin/upload"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-primary-foreground shadow-sm transition hover:bg-brand-primary/90"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Aggiungi articolo
                </Link>
              </div>
            </div>
            <p className={cn(typography.sectionSubtitle)}>
              Gestisci gli articoli salvati su GitHub. Accoda modifiche e pubblicale in un unico commit quando sei pronto.
            </p>
            <nav aria-label="Percorso corrente" className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="flex items-center gap-2">
                  {index > 0 ? <span className="text-border">/</span> : null}
                  {crumb.active ? (
                    <span className="font-semibold text-foreground">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} prefetch={false} className="transition hover:text-brand-primary">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
            <PendingSummary />
          </div>

          <RepoExplorer prefix={normalizedPrefix} />
        </div>
      </section>
    </div>
  )
}
