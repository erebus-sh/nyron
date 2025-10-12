// Tag parser
// It parse prefixes and extract versions

import { simpleGit } from "simple-git"
import { isNewer } from "../core/semver"
import { NYRON_RELEASE_PREFIX } from "../core/tag-parser"

const git = simpleGit()

/**
 * Returns all local Git tag names that begin with the provided prefix.
 *
 * @param {string} prefix - Required tag prefix (e.g., "app@").
 * @returns {Promise<string[]>} Array of matching tag names.
 */
export async function getTags(prefix: string) {
  const { all } = await git.tags()
  return all.filter(t => t.startsWith(prefix))
}

/**
 * Returns the highest semantic version tag that starts with the given prefix.
 * Uses semver comparison to guard against misordered or irregular tag lists.
 *
 * @param {string} prefix - Required tag prefix (e.g., "app@").
 * @returns {Promise<string|null>} The best tag name or null if none exist.
 */
export async function getLatestNyronReleaseTag() {
  const tags = await getTags(NYRON_RELEASE_PREFIX)
  if (tags.length === 0) return null

  const baseline = "0.0.0"
  let bestTag: string | null = null
  let bestVersion: string = baseline

  for (const tag of tags) {
    const version = tag.slice(NYRON_RELEASE_PREFIX.length)

    // Only consider candidates that are newer than baseline and current best
    if (isNewer(version, baseline) && (bestTag === null || isNewer(version, bestVersion))) {
      bestVersion = version
      bestTag = tag // Tag is already prefixed
    }
  }

  return bestTag
}

async function getFirstCommitHash(): Promise<string> {
  try {
    const result = await git.raw(['rev-list', '--max-parents=0', 'HEAD'])
    const hash = result.trim().split('\n')[0] // Get first line if multiple roots
    if (!hash) {
      throw new Error("No commits found in repository")
    }
    return hash
  } catch (error) {
    throw new Error("No commits found in repository\n   → Make your first commit before creating tags")
  }
}

export async function getPreviousNyronReleaseTag(): Promise<string | null> {
  const tags = await getTags(NYRON_RELEASE_PREFIX)
  const previousTag = tags.at(-2)
  
  if (previousTag) {
    return previousTag
  }
  
  // No previous tag found - use first commit as baseline
  try {
    const firstCommit = await getFirstCommitHash()
    console.log("ℹ️  No previous tag found, using first commit as baseline")
    return firstCommit
  } catch (error) {
    console.error(`⚠️  ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}