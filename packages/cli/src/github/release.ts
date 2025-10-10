import { resolveOctokit } from "./types"
import { parseRepo } from "./repo-parser"
import { parseTag } from "../git/tag-parser"

export async function createRelease(repo: string, tag: string, body: string,  clientOrContext?: unknown) {
  const octokit = resolveOctokit(clientOrContext as any)
  const { owner, repo: repoName } = parseRepo(repo)
  const tagParts = parseTag(tag)
  throw new Error("Not implemented")
  const release = await octokit.rest.repos.createRelease({
    owner,
    repo: repoName,
    tag_name: tag,
    name: tagParts?.version,
    body,
    prerelease: tagParts?.prerelease,
  })
  return release
}