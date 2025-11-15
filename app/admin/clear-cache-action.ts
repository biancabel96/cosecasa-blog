"use server"

import { revalidatePath } from "next/cache"

import { clearArticlesCache } from "@/lib/markdown"
import { clearGithubContentCache } from "@/lib/github-cache"

interface ClearCacheResult {
  success: boolean
  error?: string
}

export async function clearArticlesCacheAction(): Promise<ClearCacheResult> {
  try {
    clearArticlesCache()
    clearGithubContentCache()
    await Promise.all([revalidatePath("/admin"), revalidatePath("/")])

    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to clear cached articles", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Impossibile svuotare la cache.",
    }
  }
}
