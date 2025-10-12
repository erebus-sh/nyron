import { parseRepo } from "./repo-parser"
import { resolveOctokit } from "./types"

export async function getChangedFilesSince(releaseTag: string, repo: string, clientOrContext?: unknown): Promise<string[]> {
  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)

  const { data } = await octokit.rest.repos.compareCommits({
    owner,
    repo: repoName,
    base: releaseTag,
    head: "HEAD",
  })

  const files = (data.files ?? [])
    .map(f => f.filename)
    .filter((v): v is string => typeof v === 'string')
  return files
}

export async function getChangedFolders(releaseTag: string, repo: string, clientOrContext?: unknown): Promise<string[]> {
  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)

  const { data } = await octokit.rest.repos.compareCommits({
    owner,
    repo: repoName,
    base: releaseTag,
    head: "HEAD",
  })

  const files = (data.files ?? [])
    .map(f => f.filename)
    .filter((v): v is string => typeof v === 'string')

  const folders = files
    .map((file) => {
      const parts = file.split("/")
      if (parts.length === 1) return parts[0]
      return parts.slice(0, 2).join("/")
    })
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .sort()

  // dedupe consecutive duplicates after sorting
  return folders.filter((folder, idx, arr) => idx === 0 || folder !== arr[idx - 1])
}


