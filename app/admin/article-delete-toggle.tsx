"use client"

import { useTransition } from "react"

import { Trash2, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

import { usePendingChanges } from "./pending-changes-context"

interface ArticleDeleteToggleProps {
  slug: string
}

export function ArticleDeleteToggle({ slug }: ArticleDeleteToggleProps) {
  const { state, addDelete, removeDelete } = usePendingChanges()
  const [isPending, startTransition] = useTransition()

  const isMarked = state.deletes.includes(slug)

  const handleClick = () => {
    startTransition(() => {
      if (isMarked) {
        removeDelete(slug)
        toast({
          title: "Eliminazione annullata",
          description: `L'articolo "${slug}" non verrà più rimosso al prossimo commit.`,
        })
        return
      }

      addDelete(slug)
      toast({
        variant: "destructive",
        title: "Articolo segnato per la rimozione",
        description: `"${slug}" verrà eliminato al prossimo "Pubblica".`,
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
          Annulla rimozione
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Elimina articolo
        </>
      )}
    </Button>
  )
}

