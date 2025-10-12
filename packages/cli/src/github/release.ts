import { resolveOctokit } from "./types"
import { parseRepo } from "./repo-parser"

export async function getLatestRelease(repo: string, prerelease: boolean, clientOrContext?: unknown) {
  const octokit = resolveOctokit(clientOrContext as any)
  const { owner, repo: repoName } = parseRepo(repo)
  const releases = await octokit.rest.repos.listReleases({
    owner,
    repo: repoName,
    prerelease,
  })
  return releases.data[0]
}

export async function createRelease(repo: string, tag: string, changelog: string, clientOrContext?: unknown) {
  const octokit = resolveOctokit(clientOrContext as any)
  const { owner, repo: repoName } = parseRepo(repo)
  return await octokit.rest.repos.createRelease({
    owner,
    repo: repoName,
    tag_name: tag,
    body: changelog,
  })
}