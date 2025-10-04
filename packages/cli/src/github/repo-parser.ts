import type { Repo } from "./types"

export function parseRepo(repoString: string): Repo {
  const [owner, repo] = repoString.split("/")
  if (!owner || !repo) {
    throw new Error(`Invalid repo string: ${repoString} expected format: owner/repo`)
  }
  return { owner, repo }
}