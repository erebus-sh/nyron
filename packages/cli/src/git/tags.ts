// Tag parser
// It parse prefixes and extract versions

import { simpleGit } from "simple-git"
const git = simpleGit()

async function hasCommits(): Promise<boolean> {
  try {
    await git.revparse(["HEAD"])
    return true
  } catch {
    return false
  }
}

export async function getTags(prefix?: string) {
  const { all } = await git.tags()
  return prefix ? all.filter(t => t.startsWith(prefix)) : all
}

export async function getLatestTag(prefix?: string) {
  const tags = await getTags(prefix)
  return tags.at(-1) || null
}

async function getFirstCommitHash(): Promise<string> {
  try {
    const result = await git.raw(['rev-list', '--max-parents=0', 'HEAD'])
    const hash = result.trim().split('\n')[0] // Get first line if multiple roots
    if (!hash) {
      throw new Error("No commits found in this repository.")
    }
    return hash
  } catch (error) {
    throw new Error("⚠️ No commits found in this repository. Please make your first commit before tagging.")
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
    console.log("ℹ️  No previous tag found. Using first commit as baseline.")
    return firstCommit
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return null
  }
}

export async function getTag(prefix: string, version: string) {
  const tags = await getTags(prefix)
  return tags.find(t => t === `${prefix}${version}`) || null
}

export async function tagExists(tag: string) {
  const tags = await getTags()
  return tags.includes(tag)
}

export async function createTag(prefix: string, version: string) {
  const tag = `${prefix}${version}`
  
  // Check if repository has commits before creating tag
  if (!(await hasCommits())) {
    throw new Error("Cannot create tag: repository has no commits yet. Please make at least one commit first.")
  }
  
  await git.addTag(tag)
  return tag
}

export async function pushTag(tag: string) {
  await git.push("origin", tag)
}