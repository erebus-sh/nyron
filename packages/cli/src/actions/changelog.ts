// Get current tag, diff it with the previous tag and generate a changelog based on the commits

import { loadConfig } from "../core/loadConfig"
import { getLatestTag, getPreviousTag } from "../git/tags"
import type { ChangelogOptions } from "./types"
import { parseRepo } from "../github/repo-parser"
import { getPRsBetweenTags } from "../github/pull-requests"

export async function changelog(options: ChangelogOptions) {
  if (!options.prefix) {
    console.log("⚠️  Prefix is required for changelog generation")
    return
  }
  
  console.log("🔍 Running Nyron changelog...")
  const config = await loadConfig()
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
  const repo = parseRepo(config.repo)
  const prs = await getPRsBetweenTags(repo, previous, latest)
  // TODO: Generate changelog based on PRs and check the workflow
  console.log(prs)
  // get PRs between Prev and Current
}