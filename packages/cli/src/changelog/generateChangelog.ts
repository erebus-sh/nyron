import { getLatestNyronReleaseTag, getPreviousNyronReleaseTag } from "../git/tags"
import { getCommitsSince } from "../github/commits"
import { parseCommits, organizeForChangelog } from "../core/commits-parser"
import { parseTag } from "../core/tag-parser"
import { renderTemplate } from "../utils/renderTemplate"

export async function generateChangelogMarkdown(prefix: string, repo: string) {
  const latest = await getLatestNyronReleaseTag()
  if (!latest) {
    throw new Error(`No tag found for ${prefix}\n   → Create a tag with: nyron tag -p ${prefix} -v 0.0.1`)
  }

  const previous = await getPreviousNyronReleaseTag()
  if (!previous) {
    throw new Error(`No previous tag found for ${prefix}\n   → Need at least two tags to generate a changelog`)
  }

  // Get commits between tags
  const commits = await getCommitsSince(previous, repo)
  if (commits.length === 0) {
    return { generated: false, reason: "No commits found between tags" }
  }

  // Parse commits into structured groups
  const parsedCommits = parseCommits(commits)

  // Extract version from latest tag
  // TODO: parse tags from meta.json duh...
  const tagParts = parseTag(latest)
  if (!tagParts) {
    throw new Error(`Could not parse version from tag: ${latest}\n   → Tag format should be ${prefix}X.Y.Z`)
  }

  // Organize commits for changelog
  const { features, fixes, chores } = organizeForChangelog(parsedCommits)

  const content = renderTemplate("default", {
    package: prefix,
    version: tagParts.version,
    features: features,
    fixes: fixes,
    chores: chores,
  })


  return content
}

