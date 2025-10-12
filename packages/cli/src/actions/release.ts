// Mental Model:
//   nyron-release@date... ---- A ---- B ---- C ---- [changelog] ---- nyron-release@date... ---- D ---- E
//                              └──────┬──────┘                                                  └─────┬─────┘
//                              changelog for all versions                                 changelog for all versions
//

import { loadConfig } from "../config"
import { parseCommits } from "../core/commits-parser"
import { generateNyronReleaseTag } from "../core/tag-parser"
import { getLatestNyronReleaseTag } from "../git/tags"
import { getCommitsSince } from "../github/commits"
import type { ReleaseOptions } from "./types"
import { generateChangelogMarkdown } from "../changelog/generateChangelog"
import { getUpdatedVersions } from "../nyron/version"

export const release = async (options: ReleaseOptions) => {
    const { dryRun } = options
    const nyronReleaseTag = generateNyronReleaseTag()
    console.log(`🔖 Creating Nyron release tag: ${nyronReleaseTag}`)

    if (!dryRun) {
        const { config } = await loadConfig()
        const latest = await getLatestNyronReleaseTag()
        if (!latest) {
          throw new Error(`No nyron release tag found\n   → Make sure to push the tag with nyron tool`)
        }

        // Get commits between tags
        const commits = await getCommitsSince(latest, config.repo)
        if (commits.length === 0) {
          return { generated: false, reason: "No commits found between tags" }
        }
      
        // Parse commits into structured groups
        const parsedCommits = parseCommits(commits)

        // Extract versions from meta.json
        const versions = await getUpdatedVersions()

        // Generate changelog
        const changelog = await generateChangelogMarkdown(parsedCommits, versions)
        
    }
}