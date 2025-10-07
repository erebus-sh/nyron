import { loadConfig } from "../config"
import { getLatestTag } from "../git/tags"
import { getCommitsSince } from "../github/commits"
import type { DiffOptions, DiffResult, ProjectDiffResult } from "./types"

export async function diff(options: DiffOptions): Promise<DiffResult> {
  console.log("🔍 Analyzing changes since last release...\n")

  const { config } = await loadConfig()
  const projects = Object.entries(config.projects)
  
  if (projects.length === 0) {
    console.log("⚠️  No projects found in nyron.config.ts")
    return { results: [], totalProjectsAnalyzed: 0 }
  }
  
  const results: ProjectDiffResult[] = []

  for (const [name, project] of projects) {
    if (options.prefix && !project.tagPrefix.startsWith(options.prefix)) continue

    const latest = await getLatestTag(project.tagPrefix)
    if (!latest) {
      console.log(`⚠️  ${name}: No tags found`)
      console.log(`   → Create an initial tag with: nyron tag -p ${project.tagPrefix} -v 0.0.1\n`)
      results.push({
        name,
        tagPrefix: project.tagPrefix,
        latestTag: undefined,
        commitsSinceLatest: 0,
        commitMessages: [],
        needsInitialTag: true,
      })
      continue
    }

    const commits = await getCommitsSince(latest, config.repo)
    console.log(`📦 ${name} (${latest})`)
    if (commits.length > 0) {
      commits.forEach(c => console.log(`   • ${c.message.split('\n')[0]}`))
      console.log(`   → ${commits.length} commit${commits.length === 1 ? '' : 's'} since last release\n`)
    } else {
      console.log(`   ✅ No changes since last release\n`)
    }

    const commitMessages: string[] = commits.map(c => c.message)

    results.push({
      name,
      tagPrefix: project.tagPrefix,
      latestTag: latest,
      commitsSinceLatest: commits.length,
      commitMessages,
      needsInitialTag: false,
    })
  }

  return { results, totalProjectsAnalyzed: results.length }
}
