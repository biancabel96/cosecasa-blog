"use server"

import { clearGithubContentCache } from "@/lib/github-cache"

interface ClearCacheResult {
  success: boolean
  error?: string
}

export async function clearArticlesCacheAction(): Promise<ClearCacheResult> {
  try {
    clearGithubContentCache()

    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to clear cached articles", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Impossibile svuotare la cache.",
    }
  }
}
