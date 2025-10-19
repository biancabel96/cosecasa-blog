export function createSlug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function sanitizeFileName(fileName: string, fallback: string): string {
  const name = fileName.trim()
  const extensionMatch = name.match(/\.([a-z0-9]+)$/i)
  const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : ""
  const base = extension ? name.slice(0, -extension.length) : name
  const slug = createSlug(base) || fallback
  return `${slug}${extension}`
}

export function ensureUniqueName(fileName: string, usedNames: Set<string>): string {
  if (!usedNames.has(fileName)) {
    usedNames.add(fileName)
    return fileName
  }

  const extensionMatch = fileName.match(/\.([a-z0-9]+)$/i)
  const extension = extensionMatch ? `.${extensionMatch[1]}` : ""
  const base = extension ? fileName.slice(0, -extension.length) : fileName

  let attempt = 1
  let candidate = `${base}-${attempt}${extension}`

  while (usedNames.has(candidate)) {
    attempt += 1
    candidate = `${base}-${attempt}${extension}`
  }

  usedNames.add(candidate)
  return candidate
}
