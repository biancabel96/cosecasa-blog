import { getFileContent, listDirectoryContents, type RepoContentEntry } from "./github-api"

const CACHE_TTL_MS = 30_000

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const directoryCache = new Map<string, CacheEntry<RepoContentEntry[]>>()
const fileContentCache = new Map<string, CacheEntry<string>>()

function hasValidEntry<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return Boolean(entry && entry.expiresAt > Date.now())
}

function buildKey(path: string): string {
  return path.replace(/\/+$/, "") || "."
}

export async function getCachedDirectoryContents(path: string): Promise<RepoContentEntry[]> {
  const key = buildKey(path)
  const cached = directoryCache.get(key)
  if (hasValidEntry(cached)) {
    return cached.value
  }

  const value = await listDirectoryContents(path)
  directoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}

export async function getCachedFileContent(path: string): Promise<string> {
  const key = buildKey(path)
  const cached = fileContentCache.get(key)
  if (hasValidEntry(cached)) {
    return cached.value
  }

  const value = await getFileContent(path)
  fileContentCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}

export function clearGithubContentCache(): void {
  directoryCache.clear()
  fileContentCache.clear()
}
