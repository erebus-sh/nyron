// Parse commits and group them by type
// For example a all "fix:" prefixed commits -> Bug fixes
// a all "feat:" prefixed commits -> Features
// etc...

import { simpleGit } from "simple-git"
import type { CommitDiff } from "./types"

const git = simpleGit()

export async function getCommitsSince(tag: string): Promise<CommitDiff[]> {
  const { all } = await git.log({ from: tag, to: "HEAD" })
  return all.map(c => ({
    hash: c.hash,
    message: c.message,
    author: c.author_name,
  }))
}

export async function getCommitsBetween(fromTag: string, toTag: string): Promise<CommitDiff[]> {
  const { all } = await git.log({ from: fromTag, to: toTag })
  return all.map(c => ({
    hash: c.hash,
    message: c.message,
    author: c.author_name,
  }))
}
