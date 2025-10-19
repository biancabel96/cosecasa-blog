"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

import { clearArticlesCacheAction } from "./clear-cache-action"

export function ClearCacheButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await clearArticlesCacheAction()

      if (result.success) {
        router.refresh()
        toast({
          title: "Cache svuotata",
          description: "Gli articoli verranno ricaricati dal repository alla prossima visita.",
        })
        return
      }

      toast({
        variant: "destructive",
        title: "Errore nello svuotare la cache",
        description: result.error ?? "Riprova più tardi.",
      })
    })
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
      className="relative"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Svuotando...</span>
        </>
      ) : (
        <>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Svuota cache</span>
        </>
      )}
    </Button>
  )
}
