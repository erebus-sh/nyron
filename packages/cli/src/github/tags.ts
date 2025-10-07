import { resolveOctokit } from "./types"
import { parseRepo } from "./repo-parser"

export async function getTags(repo: string, clientOrContext?: unknown) {
  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)
  const tags = await octokit.paginate(octokit.rest.repos.listTags, {
    owner,
    repo: repoName,
    per_page: 100,
  })
  return tags.map(t => t.name)
}

export async function getLatestTag(repo: string, prefix?: string, clientOrContext?: unknown) {
  const tags = await getTags(repo, clientOrContext)
  const filtered = prefix ? tags.filter(t => t.startsWith(prefix)) : tags
  return filtered.at(-1) || null
}

export async function getPreviousTag(repo: string, prefix: string) {
  const tags = await getTags(repo)
  const filtered = tags.filter(t => t.startsWith(prefix))
  return filtered.at(-2) ?? null
}

export async function getTag(repo: string, prefix: string, version: string) {
  const tags = await getTags(repo)
  return tags.find(t => t === `${prefix}${version}`) || null
}

export async function tagExists(repo: string, tag: string) {
  const tags = await getTags(repo)
  return tags.includes(tag)
}

export async function createTag(repo: string, tag: string, clientOrContext?: unknown) {
  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)
  await octokit.rest.git.createRef({
    owner,
    repo: repoName,
    ref: `refs/tags/${tag}`,
    sha: (await octokit.rest.repos.get({ owner, repo: repoName })).data.default_branch
      ? (await octokit.rest.repos.getBranch({ owner, repo: repoName, branch: (await octokit.rest.repos.get({ owner, repo: repoName })).data.default_branch })).data.commit.sha
      : (await octokit.rest.repos.getCommit({ owner, repo: repoName, ref: 'HEAD' })).data.sha,
  })
  return tag
}

export async function pushTag() {
  // No-op for GitHub API; push is implicit
}


