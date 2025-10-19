import { Octokit } from "@octokit/rest"

type BlobEncoding = "utf-8" | "base64"

type TreeMode = "100644" | "100755" | "040000" | "160000" | "120000"
type TreeType = "blob" | "tree" | "commit"

export interface GitTreeEntry {
  path: string
  mode: TreeMode
  type: TreeType
  sha?: string | null
  content?: string
}

export interface GitAuthor {
  name: string
  email: string
  date?: string
}

export interface RepoContentEntry {
  name: string
  path: string
  type: "file" | "dir"
  sha: string
  size: number
}

interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

let cachedOctokit: Octokit | null = null
let cachedConfig: GitHubConfig | null = null

function getConfig(): GitHubConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH ?? "main"

  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured")
  }
  if (!owner) {
    throw new Error("GITHUB_OWNER is not configured")
  }
  if (!repo) {
    throw new Error("GITHUB_REPO is not configured")
  }

  cachedConfig = { token, owner, repo, branch }
  return cachedConfig
}

function getOctokit(): Octokit {
  if (cachedOctokit) {
    return cachedOctokit
  }

  const { token } = getConfig()
  cachedOctokit = new Octokit({ auth: token })
  return cachedOctokit
}

export async function getCurrentMainSha(): Promise<string> {
  const { owner, repo, branch } = getConfig()
  const octokit = getOctokit()

  const response = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  })

  return response.data.object.sha
}

export async function createBlob(content: string, encoding: BlobEncoding): Promise<string> {
  const { owner, repo } = getConfig()
  const octokit = getOctokit()

  const response = await octokit.git.createBlob({
    owner,
    repo,
    content,
    encoding,
  })

  return response.data.sha
}

export async function createTree(baseTreeSha: string | undefined, entries: GitTreeEntry[]): Promise<string> {
  const { owner, repo } = getConfig()
  const octokit = getOctokit()

  const response = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: entries,
  })

  return response.data.sha
}

export async function createCommit(
  message: string,
  treeSha: string,
  parentSha: string,
  author?: GitAuthor,
): Promise<string> {
  const { owner, repo } = getConfig()
  const octokit = getOctokit()

  const response = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: treeSha,
    parents: [parentSha],
    author,
  })

  return response.data.sha
}

export async function updateMain(commitSha: string): Promise<void> {
  const { owner, repo, branch } = getConfig()
  const octokit = getOctokit()

  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commitSha,
    force: false,
  })
}

export async function getCommitTreeSha(commitSha: string): Promise<string> {
  const { owner, repo } = getConfig()
  const octokit = getOctokit()

  const response = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: commitSha,
  })

  return response.data.tree.sha
}

export async function listDirectoryContents(path: string): Promise<RepoContentEntry[]> {
  const { owner, repo, branch } = getConfig()
  const octokit = getOctokit()

  const normalizedPath = path.replace(/^\/+/, "").replace(/\/+$/, "")

  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: normalizedPath || ".",
      ref: branch,
    })

    if (!Array.isArray(response.data)) {
      return []
    }

    return response.data.map((entry) => ({
      name: entry.name,
      path: entry.path,
      type: entry.type === "dir" ? "dir" : "file",
      sha: entry.sha,
      size: typeof entry.size === "number" ? entry.size : 0,
    }))
  } catch (error) {
    if (isNotFoundError(error)) {
      return []
    }
    throw error
  }
}

export function getRawFileUrl(path: string): string {
  const { owner, repo, branch } = getConfig()
  const safePath = path.replace(/^\/+/, "")
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${safePath}`
}

export async function getFileContent(path: string): Promise<string> {
  const { owner, repo, branch } = getConfig()
  const octokit = getOctokit()
  const normalizedPath = path.replace(/^\/+/, "")

  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: normalizedPath,
      ref: branch,
    })

    if (Array.isArray(response.data)) {
      throw new Error(`Expected file content for ${normalizedPath}, received directory listing.`)
    }

    const { content, encoding } = response.data

    if (!content) {
      return ""
    }

    if (encoding === "base64") {
      return Buffer.from(content, "base64").toString("utf-8")
    }

    return content
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error(`File ${normalizedPath} not found in repository.`)
    }
    throw error
  }
}

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status?: number }).status === 404,
  )
}
