// Get changed files since a tag and diff stuff

import { simpleGit } from "simple-git"
const git = simpleGit()

export async function getChangedFilesSince(tag: string) {
  const diff = await git.diff(["--name-only", `${tag}..HEAD`])
  return diff.split("\n").filter(Boolean)
}

export async function getChangedFolders(from: string, to: string) {
  // Get changed files between from and to
  const diff = await git.diff(["--name-only", from, to]);
  return diff
    .split("\n")
    .filter(Boolean)
    .map((file) => {
      const parts = file.split("/");
      // If file is at root, return the file itself as the "folder"
      if (parts.length === 1) return parts[0];
      // Otherwise, return the top-level folder (or top two levels for monorepos, etc.)
      return parts.slice(0, 2).join("/");
    })
    .filter(Boolean)
    .sort()
    .filter((folder, idx, arr) => folder && (idx === 0 || folder !== arr[idx - 1]));
}