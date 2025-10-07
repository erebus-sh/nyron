// Tag parser
// It parse prefixes and extract versions

import { simpleGit } from "simple-git"
const git = simpleGit()
import { isNewer } from "../core/semver"

/**
 * Git tag utilities for local repositories.
 *
 * These helpers operate on the local Git repository using simple-git.
 * Tags are filtered by a required prefix and semantic comparisons are used
 * to determine the latest tag reliably.
 */
async function hasCommits(): Promise<boolean> {
  try {
    await git.revparse(["HEAD"])
    return true
  } catch {
    return false
  }
}

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
export async function getLatestTag(prefix: string) {
  const tags = await getTags(prefix)
  if (tags.length === 0) return null

  const baseline = "0.0.0"
  let bestTag: string | null = null
  let bestVersion: string = baseline

  for (const tag of tags) {
    const version = tag.slice(prefix.length)

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

export async function getPreviousTag(prefix: string): Promise<string | null> {
  const tags = await getTags(prefix)
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

/**
 * Looks up an exact tag name given a prefix and a semantic version.
 *
 * @param {string} prefix - Required tag prefix.
 * @param {string} version - Semantic version part (without prefix).
 * @returns {Promise<string|null>} Full tag name or null if not found.
 */
export async function getTag(prefix: string, version: string) {
  const tags = await getTags(prefix)
  return tags.find(t => t === `${prefix}${version}`) || null
}

/**
 * Checks if a tag name exists locally.
 *
 * @param {string} tag - Full tag name to check.
 * @returns {Promise<boolean>} True if the tag exists, otherwise false.
 */
export async function tagExists(tag: string) {
  const { all } = await git.tags()
  return all.includes(tag)
}

/**
 * Creates a lightweight tag locally on HEAD.
 *
 * @param {string} prefix - Required tag prefix.
 * @param {string} version - Semantic version to append to the prefix.
 * @returns {Promise<string>} The created tag name.
 */
export async function createTag(prefix: string, version: string) {
  const tag = `${prefix}${version}`
  
  // Check if repository has commits before creating tag
  if (!(await hasCommits())) {
    throw new Error("Cannot create tag: no commits in repository\n   → Make at least one commit before creating tags")
  }
  
  await git.addTag(tag)
  return tag
}

/**
 * Pushes a single tag to the remote origin.
 *
 * @param {string} tag - Full tag name to push.
 */
export async function pushTag(tag: string) {
  await git.push("origin", tag)
}