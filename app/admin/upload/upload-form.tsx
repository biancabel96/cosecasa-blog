"use client"

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { FileText, Loader2, RefreshCcw, Trash2, X, type LucideIcon } from "lucide-react"

import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import { usePendingChanges, validateImageSize } from "../pending-changes-context"
import { createSlug, ensureUniqueName, sanitizeFileName } from "./utils"
import { applyDraftFlag, extractDraftFlag } from "../frontmatter-utils"

interface LocalImage {
  id: string
  file: File
  preview: string
}

const MAX_MARKDOWN_SIZE_BYTES = 2 * 1024 * 1024

export function UploadForm() {
  const [markdownFile, setMarkdownFile] = useState<File | null>(null)
  const [images, setImages] = useState<LocalImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDraft, setIsDraft] = useState(false)

  const router = useRouter()
  const { addUpload } = usePendingChanges()

  const markdownInputRef = useRef<HTMLInputElement | null>(null)
  const imagesRef = useRef<LocalImage[]>([])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview))
    }
  }, [])

  const handleMarkdownChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    if (file) {
      const isMarkdown =
        file.type === "text/markdown" ||
        file.type === "text/plain" ||
        file.name.toLowerCase().endsWith(".md")

      if (!isMarkdown) {
        toast({
          variant: "destructive",
          title: "Formato non supportato",
          description: "Carica un file markdown (.md).",
        })
        event.target.value = ""
        return
      }

      if (file.size === 0) {
        toast({
          variant: "destructive",
          title: "File vuoto",
          description: "Il markdown selezionato è vuoto.",
        })
        event.target.value = ""
        return
      }

      if (file.size > MAX_MARKDOWN_SIZE_BYTES) {
        toast({
          variant: "destructive",
          title: "Markdown troppo grande",
          description: "Dimensione massima consentita: 2MB.",
        })
        event.target.value = ""
        return
      }

      void file
        .text()
        .then((content) => setIsDraft(extractDraftFlag(content)))
        .catch(() => setIsDraft(false))
    } else {
      setIsDraft(false)
    }

    setMarkdownFile(file)

    if (event.target) {
      event.target.value = ""
    }
  }

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const nextImages: LocalImage[] = []

    for (const file of files) {
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

      const alreadySelected = images.some((image) => image.file.name === file.name && image.file.size === file.size)
      if (alreadySelected) {
        continue
      }

      const identifier = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
      nextImages.push({ id: identifier, file, preview: URL.createObjectURL(file) })
    }

    if (nextImages.length > 0) {
      setImages((prev) => [...prev, ...nextImages])
    }

    if (event.target) {
      event.target.value = ""
    }
  }

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((image) => image.id !== id)
      const removed = prev.find((image) => image.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.preview)
      }
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    if (!markdownFile) {
      toast({
        variant: "destructive",
        title: "Compila i campi richiesti",
        description: "Seleziona il file markdown dell'articolo.",
      })
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const markdownContent = await markdownFile.text()

      if (!markdownContent.trim()) {
        throw new Error("Il file markdown non può essere vuoto.")
      }

      const extractedTitle = extractTitleFromFrontmatter(markdownContent)

      const slug = createSlug(extractedTitle) || "untitled"

      const markdownWithDraft = applyDraftFlag(markdownContent, isDraft)

      const usedNames = new Set<string>()
      const imagePayload = [] as Array<{ name: string; dataUrl: string; size: number }>

      for (const [index, image] of images.entries()) {
        const sanitizedName = sanitizeFileName(image.file.name || `image-${index + 1}.png`, `image-${index + 1}`)
        const uniqueName = ensureUniqueName(sanitizedName, usedNames)
        const dataUrl = await fileToDataUrl(image.file)
        imagePayload.push({ name: uniqueName, dataUrl, size: image.file.size })
      }

      addUpload({
        slug,
        title: extractedTitle,
        markdown: markdownWithDraft,
        images: imagePayload,
        draft: isDraft,
      })

      toast({
        title: "Articolo aggiunto alle modifiche",
        description: "Apri la pagina principale dell'admin e pubblica quando sei pronto.",
      })

      setMarkdownFile(null)
      setImages((prev) => {
        prev.forEach((image) => URL.revokeObjectURL(image.preview))
        return []
      })

      setIsDraft(false)

      if (markdownInputRef.current) {
        markdownInputRef.current.value = ""
      }

      router.push("/admin")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossibile aggiungere l'articolo alle modifiche pendenti. Riprova."

      setFormError(message)

      toast({
        variant: "destructive",
        title: "Operazione non riuscita",
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSubmitDisabled = !markdownFile || isSubmitting

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <span className="block text-sm font-medium text-muted-foreground">File Markdown (.md)</span>
            {!markdownFile ? (
              <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground transition hover:border-brand-primary">
                <input
                  ref={markdownInputRef}
                  id="markdown-file"
                  name="markdown"
                  type="file"
                  accept=".md,text/markdown"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={handleMarkdownChange}
                />
                <FileText className="mb-3 h-6 w-6 text-muted-foreground transition group-hover:text-brand-primary" />
                <span className="font-medium text-foreground">Scegli un file markdown</span>
                <span className="mt-1 text-xs text-muted-foreground">Trascina qui oppure clicca per selezionare</span>
              </label>
            ) : (
              <>
                <input
                  ref={markdownInputRef}
                  id="markdown-file"
                  name="markdown"
                  type="file"
                  accept=".md,text/markdown"
                  className="hidden"
                  onChange={handleMarkdownChange}
                />
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <FileText className="h-5 w-5 text-brand-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium">{markdownFile.name}</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(markdownFile.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={RefreshCcw}
                      label="Sostituisci file"
                      onClick={() => markdownInputRef.current?.click()}
                    />
                    <IconButton
                      icon={Trash2}
                      label="Rimuovi file"
                      onClick={() => {
                        setMarkdownFile(null)
                        if (markdownInputRef.current) {
                          markdownInputRef.current.value = ""
                        }
                        setIsDraft(false)
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="draft-mode" className="text-sm font-medium text-foreground">
                Salva come bozza
              </Label>
              <p className="text-xs text-muted-foreground">
                Quando attivo, l'articolo rimarrà nascosto da homepage, ricerche e liste pubbliche.
              </p>
            </div>
            <Switch
              id="draft-mode"
              checked={isDraft}
              onCheckedChange={setIsDraft}
              aria-label="Attiva o disattiva la modalità bozza"
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="images" className="block text-sm font-medium text-muted-foreground">
                Immagini opzionali
              </label>
              <input
                id="images"
                name="images"
                type="file"
                accept="image/*"
                multiple
                className="mt-1 block w-full cursor-pointer rounded-md border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-brand-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-secondary-foreground hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                onChange={handleImagesChange}
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {images.map((image) => (
                  <div key={image.id} className="group relative overflow-hidden rounded-lg border border-border">
                    <img src={image.preview} alt={image.file.name} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-opacity hover:opacity-90"
                      aria-label={`Rimuovi ${image.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="truncate bg-background/80 px-2 py-1 text-center text-xs text-muted-foreground">
                      {image.file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start gap-3">
            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Aggiunta in corso...
                </>
              ) : (
                "Aggiungi alle modifiche"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              L'articolo verrà salvato localmente nelle modifiche in sospeso. Premi "Pubblica" dalla dashboard quando vuoi creare il commit su GitHub.
            </p>
          </div>

          {formError ? (
            <p
              role="alert"
              className="mt-2 inline-block rounded-md border border-destructive/50 bg-destructive px-4 py-3 text-sm font-medium text-white"
            >
              {formError}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}

async function fileToDataUrl(file: File): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("La conversione dei file è disponibile solo lato client.")
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Impossibile leggere il file ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-brand-primary hover:text-brand-primary"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

function extractTitleFromFrontmatter(markdown: string): string {
  const trimmed = markdown.trimStart()
  const [firstLineRaw = ""] = trimmed.split(/\r?\n/, 1)
  const firstLine = firstLineRaw.trim()
  const normalizedFirstLine = firstLine.replace(/\s+/g, "")

  if (!trimmed.startsWith("---")) {
    if (/^[\u2013\u2014]+$/u.test(normalizedFirstLine)) {
      throw new Error("Il frontmatter deve iniziare con tre trattini semplici `---`, non con il trattino lungo `—`.")
    }
    throw new Error("Il file markdown deve iniziare con un frontmatter YAML delimitato da `---` su una riga dedicata.")
  }

  const match = trimmed.match(/^---\s*\n([\s\S]*?)\n(---)/)
  if (!match) {
    throw new Error("Il frontmatter deve essere chiuso da una seconda riga con `---`.")
  }

  const closingDelimiter = match[2]
  if (closingDelimiter !== "---") {
    throw new Error("Il frontmatter deve essere chiuso con tre trattini `---`.")
  }

  const lines = match[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  for (const line of lines) {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) {
      continue
    }
    const key = line.slice(0, separatorIndex).trim().toLowerCase()
    if (key !== "title") {
      continue
    }
    const rawValue = line.slice(separatorIndex + 1).trim()
    const unquoted = rawValue.replace(/^['"]/, "").replace(/['"]$/, "")
    if (unquoted.length > 0) {
      return unquoted
    }
  }

  throw new Error("Nel frontmatter manca la chiave obbligatoria `title`.")
}
