import { resolveOctokit } from "./types"
import { parseRepo } from "./repo-parser"
import { parseNyronReleaseTag } from "../core/tag-parser"

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

const getTitleRelease = (nyronReleaseTag: string) => {
  const parsedTag = parseNyronReleaseTag(nyronReleaseTag)
  if (!parsedTag) {
    throw new Error("Invalid nyronReleaseTag: unable to parse date")
  }
  const version = `v${parsedTag.getUTCFullYear()}.${String(parsedTag.getUTCMonth() + 1).padStart(2, "0")}.${String(parsedTag.getUTCDate()).padStart(2, "0")}.${String(parsedTag.getUTCHours()).padStart(2, "0")}${String(parsedTag.getUTCMinutes()).padStart(2, "0")}${String(parsedTag.getUTCSeconds()).padStart(2, "0")}`
  return version
}

export async function createRelease(repo: string, nyronReleaseTag: string, changelog: string, clientOrContext?: unknown) {
  const octokit = resolveOctokit(clientOrContext as any)
  const { owner, repo: repoName } = parseRepo(repo)
  const titleRelease = getTitleRelease(nyronReleaseTag)
  
  return await octokit.rest.repos.createRelease({
    owner,
    repo: repoName,
    tag_name: nyronReleaseTag,
    name: titleRelease,
    body: changelog,
  })
}