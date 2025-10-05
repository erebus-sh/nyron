// Get current tag, diff it with the previous tag and generate a changelog based on the commits

import { getLatestTag, getPreviousTag } from "../git/tags"
import { getCommitsBetween } from "../git/commits"
import { parseCommits, organizeForChangelog } from "../git/commits-parser"
import { parseTag } from "../git/tag-parser"
import { writeChangelog } from "../changelog/write"
import type { ChangelogOptions } from "./types"

export async function changelog(options: ChangelogOptions) {
  console.log("🔍 Running Nyron changelog...")
  
  const latest = await getLatestTag(options.prefix)
  if (!latest) {
    console.log(`⚠️ No tag found for ${options.prefix}`)
    console.log("You can create a tag with `nyron tag <version> <prefix>`")
    return
  }
  
  const previous = await getPreviousTag(options.prefix)
  if (!previous) {
    console.log(`⚠️ No previous tag found for ${options.prefix}`)
    console.log("You can create a tag with `nyron tag <version> <prefix>`")
    return
  }
  
  console.log(`📝 Generating changelog from ${previous} to ${latest}`)
  
  // Get commits between tags
  const commits = await getCommitsBetween(previous, latest)
  if (commits.length === 0) {
    console.log("⚠️ No commits found between tags")
    return
  }
  
  console.log(`📊 Found ${commits.length} commits`)
  
  // Parse commits into structured groups
  const parsedCommits = parseCommits(commits)
  
  // Extract version from latest tag
  const tagParts = parseTag(latest)
  if (!tagParts) {
    console.log(`⚠️ Could not parse version from tag: ${latest}`)
    return
  }
  
  // Organize commits for changelog
  const { features, fixes, chores } = organizeForChangelog(parsedCommits)
  
  // Write changelog
  await writeChangelog({
    prefix: options.prefix,
    version: tagParts.version,
    features,
    fixes,
    chores,
  })
  
  console.log(`🎉 Changelog generated successfully!`)
}