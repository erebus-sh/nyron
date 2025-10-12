import { renderTemplate } from "../utils/renderTemplate"
import { organizCommitsForChangelog } from "../core/commits-parser"
import type { ParsedCommits } from "../core/types"

export async function generateChangelogMarkdown(parsedCommits: ParsedCommits, versions: string[]) {
  // Organize commits for changelog
  const { features, fixes, chores } = organizCommitsForChangelog(parsedCommits)

  const content = renderTemplate({
    versions: versions,
    features: features,
    fixes: fixes,
    chores: chores,
  })

  return content
}

