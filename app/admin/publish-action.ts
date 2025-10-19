"use server"

import { revalidatePath } from "next/cache"
import { currentUser } from "@clerk/nextjs/server"

import { clearArticlesCache } from "@/lib/markdown"

import {
  createBlob,
  createCommit,
  createTree,
  getCommitTreeSha,
  getCurrentMainSha,
  updateMain,
  type GitTreeEntry,
} from "@/lib/github-api"

interface PublishImage {
  name: string
  dataUrl: string
  size: number
}

export interface PublishUpload {
  slug: string
  title?: string
  markdown?: string
  images: PublishImage[]
}

export interface PublishImageDelete {
  slug: string
  name: string
}

interface PublishResult {
  success: boolean
  commitSha?: string
  error?: string
}

const MAX_TOTAL_IMAGE_SIZE = 8 * 1024 * 1024 // Defensive limit for combined image payload in a single publish

export async function publishChangesAction(
  uploads: PublishUpload[],
  deletes: string[],
  imageDeletes: PublishImageDelete[],
): Promise<PublishResult> {
  if (
    (!uploads || uploads.length === 0) &&
    (!deletes || deletes.length === 0) &&
    (!imageDeletes || imageDeletes.length === 0)
  ) {
    return { success: false, error: "Non ci sono modifiche da pubblicare." }
  }

  const user = await currentUser()

  if (!user) {
    return { success: false, error: "Devi essere autenticato per pubblicare le modifiche." }
  }

  try {
    const normalizedUploads = uploads.map(normalizeUpload)
    const normalizedDeletes = [...new Set(deletes.map(normalizeSlug))]
    const normalizedImageDeletes = normalizeImageDeletes(imageDeletes)

    const parentSha = await getCurrentMainSha()
    const baseTreeSha = await getCommitTreeSha(parentSha)

    const treeEntries = await buildTreeEntries(normalizedUploads, normalizedDeletes, normalizedImageDeletes)

    if (!treeEntries.length) {
      return { success: false, error: "Non è stato possibile determinare alcuna modifica da pubblicare." }
    }

    const treeSha = await createTree(baseTreeSha, treeEntries)

    const author = resolveAuthor(user)
    const commitMessage = buildCommitMessage(normalizedUploads, normalizedDeletes, normalizedImageDeletes)
    const commitSha = await createCommit(commitMessage, treeSha, parentSha, author)

    try {
      await updateMain(commitSha)
      clearArticlesCache()
    } catch (error: unknown) {
      if (isOctokitConflict(error)) {
        return {
          success: false,
          error: "Il ramo principale è cambiato nel frattempo. Aggiorna la pagina e riprova a pubblicare.",
        }
      }
      throw error
    }

    revalidatePath("/admin", "page")
    revalidatePath("/", "layout")

    return { success: true, commitSha }
  } catch (error: unknown) {
    console.error("Failed to publish changes", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossibile pubblicare le modifiche. Riprova più tardi.",
    }
  }
}

function normalizeUpload(upload: PublishUpload): PublishUpload {
  const slug = normalizeSlug(upload.slug)

  const sanitizedImages = (upload.images ?? []).map((image, index) => {
    const filename = sanitizeFileName(image.name || `image-${index + 1}.png`)
    if (!image.dataUrl.startsWith("data:")) {
      throw new Error(`Formato immagine non valido per "${filename}".`)
    }
    return {
      name: filename,
      dataUrl: image.dataUrl,
      size: image.size,
    }
  })

  const hasMarkdown = typeof upload.markdown === "string" && upload.markdown.trim().length > 0
  const hasImages = sanitizedImages.length > 0

  if (!hasMarkdown && !hasImages) {
    throw new Error(`Nessuna modifica valida trovata per l'articolo "${upload.title || slug}".`)
  }

  return {
    slug,
    title: upload.title?.trim() || slug,
    markdown: hasMarkdown ? upload.markdown : undefined,
    images: sanitizedImages,
  }
}

function normalizeSlug(raw: string): string {
  const trimmed = raw.trim().toLowerCase()
  const cleaned = trimmed
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  if (!cleaned || cleaned.length > 100 || cleaned.includes("..")) {
    throw new Error(`Slug non valido: "${raw}".`)
  }

  return cleaned
}

function sanitizeFileName(name: string): string {
  const segments = name.replace(/\\/g, "/").split("/")
  const base = segments[segments.length - 1] || "asset"
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "-")
  return cleaned || "asset"
}

function normalizeImageDeletes(imageDeletes: PublishImageDelete[]): PublishImageDelete[] {
  const unique = new Map<string, PublishImageDelete>()

  for (const entry of imageDeletes ?? []) {
    if (!entry) {
      continue
    }
    const slug = normalizeSlug(entry.slug)
    const name = sanitizeFileName(entry.name)
    const key = `${slug}/${name}`
    if (!unique.has(key)) {
      unique.set(key, { slug, name })
    }
  }

  return Array.from(unique.values())
}

async function buildTreeEntries(
  uploads: PublishUpload[],
  deletes: string[],
  imageDeletes: PublishImageDelete[],
): Promise<GitTreeEntry[]> {
  const entries: GitTreeEntry[] = []

  let totalImageSize = 0

  for (const upload of uploads) {
    if (upload.markdown) {
      const markdownSha = await createBlob(upload.markdown, "utf-8")
      entries.push({
        path: `articles/${upload.slug}/text.md`,
        mode: "100644",
        type: "blob",
        sha: markdownSha,
      })
    }

    for (const image of upload.images ?? []) {
      totalImageSize += image.size
      if (totalImageSize > MAX_TOTAL_IMAGE_SIZE) {
        throw new Error(
          "Le immagini pendenti superano il limite totale di 4MB per una singola pubblicazione. Riduci il numero o la dimensione delle immagini.",
        )
      }

      const base64 = extractBase64(image.dataUrl)
      const imageSha = await createBlob(base64, "base64")
      entries.push({
        path: `articles/${upload.slug}/${image.name}`,
        mode: "100644",
        type: "blob",
        sha: imageSha,
      })
    }
  }

  for (const slug of deletes) {
    entries.push({
      path: `articles/${slug}`,
      mode: "040000",
      type: "tree",
      sha: null,
    })
  }

  for (const { slug, name } of imageDeletes) {
    entries.push({
      path: `articles/${slug}/${name}`,
      mode: "100644",
      type: "blob",
      sha: null,
    })
  }

  return entries
}

function extractBase64(dataUrl: string): string {
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/)
  if (!match || !match[1]) {
    throw new Error("Formato immagine non valido: atteso data URL base64.")
  }
  return match[1]
}

function resolveAuthor(user: Awaited<ReturnType<typeof currentUser>> | null) {
  if (!user) {
    return undefined
  }

  const primaryEmail = user.primaryEmailAddressId
    ? user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)
    : user.emailAddresses[0]

  const email = primaryEmail?.emailAddress || "mariarosa.sirotti@gmail.com"
  const name = user.fullName || user.username || "Admin"

  return { name, email }
}

function buildCommitMessage(
  uploads: PublishUpload[],
  deletes: string[],
  imageDeletes: PublishImageDelete[],
): string {
  const additions = uploads.length
  const removals = deletes.length + imageDeletes.length
  const header = `Publish articles (+${additions}, -${removals})`

  const uploadLines = uploads.map((upload) => `- ${upload.slug}`)
  const deleteLines = deletes.map((slug) => `✂︎ ${slug}`)
  const imageDeleteLines = imageDeletes.map(({ slug, name }) => `✂︎ ${slug}/${name}`)

  const bodyLines = [...uploadLines, ...deleteLines, ...imageDeleteLines]
  const body = bodyLines.length ? `${bodyLines.join("\n")}\n\n` : "\n"

  return `${header}\n${body}🤖 via Admin Panel`
}

function isOctokitConflict(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status?: number }).status === 422,
  )
}
