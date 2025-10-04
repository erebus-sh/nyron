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
