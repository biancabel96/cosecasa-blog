"use client"

import { useTransition } from "react"

import { ImageOff, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

import { usePendingChanges } from "./pending-changes-context"

interface ArticleImageDeleteToggleProps {
  slug: string
  imageName: string
}

export function ArticleImageDeleteToggle({ slug, imageName }: ArticleImageDeleteToggleProps) {
  const { state, addImageDelete, removeImageDelete } = usePendingChanges()
  const [isPending, startTransition] = useTransition()

  const isMarked = state.imageDeletes.some((item) => item.slug === slug && item.name === imageName)

  const handleClick = () => {
    startTransition(() => {
      if (isMarked) {
        removeImageDelete({ slug, name: imageName })
        toast({
          title: "Rimozione annullata",
          description: `L'immagine "${imageName}" non verrà più eliminata da ${slug}.`,
        })
        return
      }

      addImageDelete({ slug, name: imageName })
      toast({
        variant: "destructive",
        title: "Immagine segnata per la rimozione",
        description: `"${imageName}" verrà eliminata al prossimo "Pubblica".`,
      })
    })
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant={isMarked ? "outline" : "destructive"}
      size="sm"
      disabled={isPending}
      className="inline-flex items-center gap-2"
    >
      {isMarked ? (
        <>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Annulla
        </>
      ) : (
        <>
          <ImageOff className="h-3.5 w-3.5" aria-hidden="true" />
          Elimina immagine
        </>
      )}
    </Button>
  )
}

