import { buildTag } from "../git/tag-parser"
import { loadConfig } from "../core/loadConfig"
import type { TagOptions, TagResult } from "./types"
import { getTag, createTag, pushTag } from "../git/tags"

export async function tag(options: TagOptions): Promise<TagResult> {
  const config = await loadConfig()
  const tagName = buildTag(options.prefix, options.version)

  // 1. Check if tag already exists
  const existing = await getTag(options.prefix, options.version)
  if (existing) {
    console.log(`⚠️  Tag already exists: ${tagName}`)
    console.log(`   → This version has already been tagged`)
    return { created: false, pushed: false, tagName, alreadyExists: true }
  }

  // 2. Create the tag
  console.log(`🏷️  Creating tag ${tagName}...`)
  try {
    await createTag(options.prefix, options.version)
  } catch (error) {
    if (error instanceof Error && error.message.includes("no commits")) {
      console.error(`❌ Cannot create tag: ${error.message}`)
      process.exit(1)
    }
    throw error
  }

  // 3. Push the tag to origin (optional, but smart)
  let pushed = false
  try {
    await pushTag(tagName)
    pushed = true
    console.log(`✅ Tag created and pushed: ${tagName}`)
  } catch {
    console.log(`⚠️  Tag created locally but failed to push`)
    console.log(`   → Check remote permissions or push manually with: git push origin ${tagName}`)
  }

  // 4. Log mapping (optional)
  const project = Object.entries(config.projects).find(
    ([, v]) => v.tagPrefix === options.prefix
  )
  if (project) {
    console.log(`📦 Associated with project: ${project[0]}`)
    return { created: true, pushed, tagName, alreadyExists: false, associatedProjectName: project[0] }
  } else {
    console.log(`⚠️  No project found with prefix ${options.prefix} in nyron.config.ts`)
    console.log(`   → Consider adding this prefix to your config`)
    return { created: true, pushed, tagName, alreadyExists: false }
  }
}
