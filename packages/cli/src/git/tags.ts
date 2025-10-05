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

export async function getPreviousTag(prefix?: string) {
  const tags = await getTags(prefix)
  return tags.at(-2) || null
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