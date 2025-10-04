import { buildTag } from "../git/tag-parser"
import { loadConfig } from "../core/loadConfig"
import type { TagOptions } from "./types"
import { getTag, createTag, pushTag } from "../git/tags"

export async function tag(options: TagOptions) {
  const config = await loadConfig()
  const tagName = buildTag(options.prefix, options.version)

  // 1. Check if tag already exists
  const existing = await getTag(options.prefix, options.version)
  if (existing) {
    console.log(`⚠️ Tag "${tagName}" already exists. Skipping creation.`)
    return
  }

  // 2. Create the tag
  console.log(`🏷️  Creating tag ${tagName}...`)
  await createTag(options.prefix, options.version)

  // 3. Push the tag to origin (optional, but smart)
  try {
    await pushTag(tagName)
    console.log(`🚀 Tag pushed: ${tagName}`)
  } catch {
    console.log(`⚠️ Tag created locally but failed to push. Check remote permissions.`)
  }

  // 4. Log mapping (optional)
  const project = Object.entries(config.projects).find(
    ([, v]) => v.tagPrefix === options.prefix
  )
  if (project) {
    console.log(`📦 Recorded tag under project: ${project[0]}`)
  } else {
    console.log(`⚠️ No project with prefix ${options.prefix} found in config.`)
  }
}
