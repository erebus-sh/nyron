// Tag parser
// It parse prefixes and extract versions

import { simpleGit } from "simple-git"
import { NYRON_RELEASE_PREFIX, parseNyronReleaseTag } from "../core/tag-parser"

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
 * Returns the latest Nyron release tag based on date comparison.
 * Nyron release tags use date format: nyron-release@2024-01-15@14-30-25.123
 *
 * @returns {Promise<string|null>} The latest tag name or null if none exist.
 */
export async function getLatestNyronReleaseTag() {
  const tags = await getTags(NYRON_RELEASE_PREFIX)
  if (tags.length === 0) return null

  let bestTag: string | null = null
  let bestDate: Date | null = null

  for (const tag of tags) {
    const date = parseNyronReleaseTag(tag)
    
    // Skip invalid tags that don't parse to valid dates
    if (date === null) continue
    
    // Compare dates - later dates are "newer"
    if (bestDate === null || date > bestDate) {
      bestDate = date
      bestTag = tag
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