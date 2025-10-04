import { loadConfig } from "../core/loadConfig"
import { getLatestTag } from "../git/tags"
import { getCommitsSince } from "../git/commits"
import type { DiffOptions } from "./types"

export async function diff(options: DiffOptions) {
  console.log("🔍 Running Nyron diff...")

  const config = await loadConfig()
  for (const [name, project] of Object.entries(config.projects)) {
    if (options.prefix && !project.tagPrefix.startsWith(options.prefix)) continue

    const latest = await getLatestTag(project.tagPrefix)
    if (!latest) {
      console.log(`⚠️ No tag found for ${name}`)
      continue
    }

    const commits = await getCommitsSince(latest)
    console.log(`\n📦 ${name} (${latest})`)
    commits.length
      ? commits.forEach(c => console.log("  -", c))
      : console.log("  No changes since last tag.")
  }
}
