// Generate changelog from commits between two tags
// This is a utility function used by bump.ts before creating a new version

import { getLatestTag, getPreviousTag } from "../git/tags"
import { getCommitsBetween } from "../github/commits"
import { parseCommits, organizeForChangelog } from "../core/commits-parser"
import { parseTag } from "../core/tag-parser"
import { writeChangelog } from "../nyron/changelog/write"

export async function generateChangelog(prefix: string, repo: string) {
  const latest = await getLatestTag(prefix)
  if (!latest) {
    throw new Error(`No tag found for ${prefix}\n   → Create a tag with: nyron tag -p ${prefix} -v 0.0.1`)
  }
  
  const previous = await getPreviousTag(prefix)
  if (!previous) {
    throw new Error(`No previous tag found for ${prefix}\n   → Need at least two tags to generate a changelog`)
  }
  
  // Get commits between tags
  const commits = await getCommitsBetween(previous, latest, repo)
  if (commits.length === 0) {
    return { generated: false, reason: "No commits found between tags" }
  }
  
  // Parse commits into structured groups
  const parsedCommits = parseCommits(commits)
  
  // Extract version from latest tag
  const tagParts = parseTag(latest)
  if (!tagParts) {
    throw new Error(`Could not parse version from tag: ${latest}\n   → Tag format should be ${prefix}X.Y.Z`)
  }
  
  // Organize commits for changelog
  const { features, fixes, chores } = organizeForChangelog(parsedCommits)
  
  // Write changelog
  await writeChangelog({
    prefix,
    version: tagParts.version,
    features,
    fixes,
    chores,
  })
  
  return { 
    generated: true, 
    version: tagParts.version,
    commitCount: commits.length,
    from: previous,
    to: latest
  }
}

