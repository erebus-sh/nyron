import { resolveOctokit } from "./types"
import { parseRepo } from "./repo-parser"
import { isNewer } from "../core/semver"

/**
 * Lists repository tags from GitHub filtered by a required prefix.
 *
 * Important: repo must be provided in the format "owner/repo" (e.g., "erebus-sh/nyron").
 * You can pass either an Octokit instance or a Probot Context to authenticate;
 * if omitted, a default client using GITHUB_TOKEN is used.
 *
 * @param {string} repo - The repository in "owner/repo" format.
 * @param {string} prefix - Only tags starting with this prefix are returned.
 * @param {unknown} [clientOrContext] - Optional Octokit or Probot Context.
 * @returns {Promise<string[]>} Array of tag names that start with the prefix.
 */
export async function getTags(repo: string, prefix: string, clientOrContext?: unknown): Promise<string[]> {
  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)
  const tags = await octokit.paginate(octokit.rest.repos.listTags, {
    owner,
    repo: repoName,
    per_page: 100,
  })
  return tags
    .map(t => t.name)
    .filter(name => name.startsWith(prefix))
}

/**
 * Returns the highest semantic version tag that starts with the given prefix.
 *
 * Important: repo must be provided in the format "owner/repo" (e.g., "erebus-sh/nyron").
 * Uses semver comparison to guard against misordered or irregular tags.
 *
 * @param {string} repo - The repository in "owner/repo" format.
 * @param {string} prefix - Required tag prefix (e.g., "app@").
 * @param {unknown} [clientOrContext] - Optional Octokit or Probot Context.
 * @returns {Promise<string|null>} The best tag name or null if none exist.
 */
export async function getLatestTag(repo: string, prefix: string, clientOrContext?: unknown): Promise<string | null> {
  const tags = await getTags(repo, prefix, clientOrContext)
  if (tags.length === 0) return null

  const baseline = "0.0.0"
  let bestTagName: string | null = null
  let bestVersion: string = baseline

  for (const tagName of tags) {
    const version = tagName.slice(prefix.length)

    if (isNewer(version, baseline) && (bestTagName === null || isNewer(version, bestVersion))) {
      bestVersion = version
      bestTagName = tagName
    }
  }

  return bestTagName
}

/**
 * Returns the previous (second-most recent) tag name for the given prefix.
 *
 * Important: repo must be provided in the format "owner/repo" (e.g., "erebus-sh/nyron").
 *
 * @param {string} repo - The repository in "owner/repo" format.
 * @param {string} prefix - Required tag prefix.
 * @returns {Promise<string|null>} The previous tag or null if not available.
 */
export async function getPreviousTag(repo: string, prefix: string): Promise<string | null> {
  const tags = await getTags(repo, prefix)
  return tags.at(-2) ?? null
}

/**
 * Finds an exact tag by prefix and version.
 *
 * Important: repo must be provided in the format "owner/repo" (e.g., "erebus-sh/nyron").
 *
 * @param {string} repo - The repository in "owner/repo" format.
 * @param {string} prefix - Required tag prefix.
 * @param {string} version - Semantic version part (without prefix).
 * @returns {Promise<string|null>} The full tag name or null if not found.
 */
export async function getTag(repo: string, prefix: string, version: string): Promise<string | null> {
  const tags = await getTags(repo, prefix)
  return tags.find(t => t === `${prefix}${version}`) || null
}

/**
 * Checks if the tag name exists on GitHub.
 *
 * Important: repo must be provided in the format "owner/repo" (e.g., "erebus-sh/nyron").
 *
 * @param {string} repo - The repository in "owner/repo" format.
 * @param {string} tag - Full tag name to check.
 * @param {unknown} [clientOrContext] - Optional Octokit or Probot Context.
 * @returns {Promise<boolean>} True if the tag exists, otherwise false.
 */
export async function tagExists(repo: string, tag: string, clientOrContext?: unknown): Promise<boolean> {
  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)
  const allTags = await octokit.paginate(octokit.rest.repos.listTags, {
    owner,
    repo: repoName,
    per_page: 100,
  })
  return allTags.some(t => t.name === tag)
}

/**
 * Creates a lightweight tag on the default branch HEAD.
 *
 * Important: repo must be provided in the format "owner/repo" (e.g., "erebus-sh/nyron").
 *
 * @param {string} repo - The repository in "owner/repo" format.
 * @param {string} tag - Full tag name to create.
 * @param {unknown} [clientOrContext] - Optional Octokit or Probot Context.
 * @returns {Promise<string>} The created tag name.
 */
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

/**
 * No-op placeholder for symmetry with git-based tag pushes.
 *
 * Tag references created via GitHub API are immediately present on the server,
 * so no explicit push is required.
 */
export async function pushTag() {
  // No-op for GitHub API; push is implicit
}


