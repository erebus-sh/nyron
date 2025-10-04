// Get changed files since a tag and diff stuff

import { simpleGit } from "simple-git"
const git = simpleGit()

export async function getChangedFilesSince(tag: string) {
  const diff = await git.diff(["--name-only", `${tag}..HEAD`])
  return diff.split("\n").filter(Boolean)
}
