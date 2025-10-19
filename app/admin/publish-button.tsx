"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

import { usePendingChanges } from "./pending-changes-context"
import { publishChangesAction } from "./publish-action"

export function PublishButton() {
  const router = useRouter()
  const {
    state,
    hasPending,
    storageUsed,
    storageLimit,
    clearAll,
    isReady,
  } = usePendingChanges()

  const [open, setOpen] = useState(false)
  const [isPublishing, startTransition] = useTransition()

  const uploads = state.uploads
  const deletes = state.deletes
  const imageDeletes = state.imageDeletes

  const pendingCount = uploads.length + deletes.length + imageDeletes.length
  const totalImages = uploads.reduce((total, upload) => total + (upload.images?.length ?? 0), 0)
  const imageDeletesBySlug = useMemo(() => {
    return imageDeletes.reduce<Record<string, string[]>>((acc, item) => {
      if (!acc[item.slug]) {
        acc[item.slug] = []
      }
      acc[item.slug].push(item.name)
      return acc
    }, {})
  }, [imageDeletes])

  const handlePublish = () => {
    if (!hasPending || isPublishing) {
      return
    }

    startTransition(async () => {
      const result = await publishChangesAction(uploads, deletes, imageDeletes)

      if (result.success) {
        clearAll()
        setOpen(false)
        router.refresh()

        toast({
          title: "Modifiche pubblicate",
          description: result.commitSha
            ? `Commit ${result.commitSha.slice(0, 7)} creato con successo.`
            : "Commit creato con successo.",
        })

        return
      }

      const errorMessage = result.error || "Pubblicazione non riuscita. Riprova." 

      const lowerMessage = errorMessage.toLowerCase()
      const shouldSuggestRefresh = lowerMessage.includes("aggiorna") || lowerMessage.includes("refresh")

      toast({
        variant: "destructive",
        title: "Pubblicazione fallita",
        description: errorMessage,
        action: shouldSuggestRefresh ? (
          <ToastAction altText="Aggiorna" onClick={() => window.location.reload()}>
            Aggiorna
          </ToastAction>
        ) : undefined,
      })
    })
  }

  const storageUsagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100))

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPublishing && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          disabled={!isReady || !hasPending || isPublishing}
          className="relative"
        >
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          Pubblica
          {hasPending ? (
            <Badge variant="default" className="ml-2">
              {pendingCount}
            </Badge>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pubblicare le modifiche?</DialogTitle>
          <DialogDescription>
            Verrà creato un commit su <code>main</code> e partirà automaticamente la build su Vercel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-foreground">
          <div className="rounded-md border border-border/60 bg-muted/20 p-3">
            <p className="font-medium">Riepilogo</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>• {uploads.length} articoli da aggiungere o aggiornare</li>
              <li>• {deletes.length} articoli da eliminare</li>
              <li>• {totalImages} immagini da caricare</li>
              <li>• {imageDeletes.length} immagini da eliminare</li>
            </ul>
          </div>

          {uploads.length > 0 ? (
            <div>
              <p className="font-medium text-foreground">Articoli da pubblicare</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {uploads.map((upload) => (
                  <li key={upload.slug} className="truncate">
                    📄 <span className="font-medium text-foreground">{upload.title || upload.slug}</span>
                    <span className="ml-2 text-xs">({upload.slug})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {deletes.length > 0 ? (
            <div>
              <p className="font-medium text-foreground">Articoli da eliminare</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {deletes.map((slug) => (
                  <li key={slug}>
                    ✂︎ <span className="font-medium text-foreground">{slug}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {imageDeletes.length > 0 ? (
            <div>
              <p className="font-medium text-foreground">Immagini da eliminare</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {Object.entries(imageDeletesBySlug).map(([slug, names]) => (
                  <li key={slug} className="truncate">
                    ✂︎ <span className="font-medium text-foreground">{slug}</span>
                    <span className="ml-2 text-xs">({names.join(", ")})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Spazio locale utilizzato: {formatBytes(storageUsed)} su {formatBytes(storageLimit)} ({storageUsagePercent}%).
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPublishing}>
              Annulla
            </Button>
          </DialogClose>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Pubblicazione...
              </>
            ) : (
              "Pubblica ora"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
