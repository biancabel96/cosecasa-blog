"use client"

import { useCallback } from "react"

import { toast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import { usePendingChanges } from "./pending-changes-context"
import { applyDraftFlag, extractDraftFlag } from "./frontmatter-utils"

interface ArticleDraftToggleProps {
  slug: string
  title: string
  markdown: string | null
  initialDraft: boolean
}

export function ArticleDraftToggle({ slug, title, markdown, initialDraft }: ArticleDraftToggleProps) {
  const { state, addUpload, setUploadDraft, isReady } = usePendingChanges()

  const pendingUpload = state.uploads.find((upload) => upload.slug === slug)
  const pendingDraft = pendingUpload?.draft ?? (pendingUpload?.markdown ? extractDraftFlag(pendingUpload.markdown) : undefined)
  const currentDraft = pendingDraft ?? initialDraft
  const currentMarkdown = pendingUpload?.markdown ?? markdown ?? ""
  const pendingTitle = pendingUpload?.title ?? title

  const handleToggle = useCallback(
    (checked: boolean) => {
      if (!isReady) {
        return
      }
      if (!currentMarkdown) {
        toast({
          variant: "destructive",
          title: "Impossibile aggiornare lo stato",
          description: "Non è stato possibile leggere il contenuto dell'articolo.",
        })
        return
      }

      if (checked === currentDraft) {
        return
      }

      try {
        if (pendingUpload?.markdown) {
          setUploadDraft(slug, checked)
        } else {
          const updatedMarkdown = applyDraftFlag(currentMarkdown, checked)

          addUpload({
            slug,
            title: pendingTitle,
            markdown: updatedMarkdown,
            images: [],
            draft: checked,
          })
        }

        toast({
          title: checked ? "Articolo impostato come bozza" : "Articolo impostato come pubblicato",
          description: "Ricorda di premere \"Pubblica\" per applicare la modifica.",
        })
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossibile aggiornare lo stato della bozza. Riprova."
        toast({
          variant: "destructive",
          title: "Aggiornamento non riuscito",
          description: message,
        })
      }
    },
    [addUpload, currentDraft, currentMarkdown, isReady, pendingTitle, pendingUpload?.markdown, setUploadDraft, slug],
  )

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
      <Label htmlFor={`article-draft-${slug}`} className="text-xs text-muted-foreground">
        Visibilità articolo
      </Label>
      {!isReady ? (
        <span className="text-xs text-muted-foreground">Caricamento impostazioni…</span>
      ) : null}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Lista pubblica</span>
        <Switch
          id={`article-draft-${slug}`}
          checked={Boolean(currentDraft)}
          onCheckedChange={handleToggle}
          disabled={!currentMarkdown || !isReady}
          aria-label="Attiva o disattiva lo stato di bozza"
        />
        <span className="text-muted-foreground">Solo tramite link</span>
      </div>
    </div>
  )
}
