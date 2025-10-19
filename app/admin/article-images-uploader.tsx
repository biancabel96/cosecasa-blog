"use client"

import { useRef } from "react"

import { ImagePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

import { usePendingChanges, validateImageSize } from "./pending-changes-context"
import { ensureUniqueName, sanitizeFileName } from "./upload/utils"

interface ArticleImagesUploaderProps {
  slug: string
  title?: string
}

export function ArticleImagesUploader({ slug, title }: ArticleImagesUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { appendImages } = usePendingChanges()

  const handleSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    const validImages: Array<{ name: string; dataUrl: string; size: number }> = []
    const usedNames = new Set<string>()

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        continue
      }

      try {
        validateImageSize(file)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Immagine troppo grande",
          description: error instanceof Error ? error.message : "Riduci la dimensione dell'immagine.",
        })
        continue
      }

      const sanitized = sanitizeFileName(file.name, "image")
      const uniqueName = ensureUniqueName(sanitized, usedNames)
      const dataUrl = await fileToDataUrl(file)
      validImages.push({ name: uniqueName, dataUrl, size: file.size })
    }

    if (!validImages.length) {
      toast({
        variant: "destructive",
        title: "Nessuna immagine valida",
        description: "Seleziona immagini con dimensione inferiore a 2MB.",
      })
      return
    }

    appendImages(slug, validImages, { title })

    toast({
      title: "Immagini aggiunte",
      description: `Le immagini verranno caricate per \"${title || slug}\" al prossimo commit.`,
    })
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">Aggiungi nuove immagini</p>
        <p className="text-xs text-muted-foreground">
          Le immagini saranno allegate all'articolo quando pubblichi le modifiche.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleSelect(event.target.files)
            event.target.value = ""
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={onButtonClick}>
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Carica immagini
        </Button>
      </div>
    </div>
  )
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Impossibile leggere il file ${file.name}`))
    reader.readAsDataURL(file)
  })
}
