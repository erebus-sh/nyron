// Tag parser
// It parse prefixes and extract versions

import { simpleGit } from "simple-git"
const git = simpleGit()

export async function getTags(prefix?: string) {
  const { all } = await git.tags()
  return prefix ? all.filter(t => t.startsWith(prefix)) : all
}

export async function getLatestTag(prefix?: string) {
  const tags = await getTags(prefix)
  return tags.at(-1) || null
}

export async function getTag(prefix: string, version: string) {
  const tags = await getTags(prefix)
  return tags.find(t => t === `${prefix}${version}`) || null
}

export async function createTag(prefix: string, version: string) {
  const tag = `${prefix}${version}`
  await git.addTag(tag)
  return tag
}

export async function pushTag(tag: string) {
  await git.push("origin", tag)
}