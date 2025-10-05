// src/actions/bump.ts
// ------------------------------------------------------------
// Nyron: Smart version bumping workflow (dry-run then execute)
// ------------------------------------------------------------
// Phase 1: Validate everything (dry run)
// Phase 2: Execute all changes atomically
// ------------------------------------------------------------

import { loadConfig } from "../core/loadConfig"
import { type BumpOptions } from "./types"
import { createTag, getLatestTag, pushTag, tagExists } from "../git/tags"
import { getCommitsSince } from "../git/commits"
import { fileExists } from "../core/files"
import { ask } from "../core/prompts"
import { bumpVersion } from "../core/semver"
import { validatePackage } from "../utils/validatePackage"
import { writePackageVersion } from "../package/write"
import { buildChangelogPath } from "../changelog/file-parser"

// ------------------------------------------------------------
// Phase 1: Validate (dry run)
// ------------------------------------------------------------
const validate = async (options: BumpOptions) => {
  const config = await loadConfig()

  console.log(`🔍 Validating bump for prefix: ${options.prefix}`)

  // 1) Find project
  const project = Object.entries(config.projects).find(
    ([, v]) => v.tagPrefix === options.prefix
  )
  if (!project) {
    throw new Error(`❌ No project found with prefix "${options.prefix}"`)
  }
  const { tagPrefix, path } = project[1]
  console.log(`✓ Found project at: ${path}`)

  // 2) Check last tag and commits
  const lastTag = await getLatestTag(tagPrefix)
  if (!lastTag) {
    throw new Error(`❌ No previous tag found for ${tagPrefix}`)
  }
  console.log(`✓ Latest tag: ${lastTag}`)

  const commitsSince = await getCommitsSince(lastTag)
  if (commitsSince.length === 0) {
    throw new Error("❌ No new commits since last release")
  }
  console.log(`✓ Found ${commitsSince.length} commits since ${lastTag}`)

  // 3) Verify package.json
  const packageJson = await validatePackage(path)
  if (!packageJson.valid) {
    throw new Error(`❌ ${packageJson.error || "Invalid package.json"}`)
  }
  console.log(`✓ Package.json validated`)

  // 4) Compute new version and check tag doesn't exist
  const version = lastTag.replace(tagPrefix, "")
  const newVersion = bumpVersion(version, options.type)
  const fullTag = `${tagPrefix}${newVersion}`
  
  if (await tagExists(fullTag)) {
    throw new Error(`❌ Tag ${fullTag} already exists`)
  }
  console.log(`✓ New version: ${newVersion} (${options.type} bump)`)

  // 5) Check changelog (with user prompt)
  const changelogPath = buildChangelogPath(tagPrefix, version)
  if (!(await fileExists(changelogPath))) {
    console.log(`⚠️  No changelog found for ${path}`)
    const confirm = await ask(
      `Continue version bump anyway? [y/N] `
    )
    if (confirm.toLowerCase() !== "y") {
      throw new Error("❌ Bump cancelled by user")
    }
  } else {
    console.log(`✓ Changelog found`)
  }

  return { tagPrefix, path, lastTag, commitsSince, newVersion, fullTag, packagePath: packageJson.path }
}

// ------------------------------------------------------------
// Phase 2: Execute (apply changes)
// ------------------------------------------------------------
const execute = async (data: Awaited<ReturnType<typeof validate>>) => {
  const { tagPrefix, newVersion, fullTag, packagePath } = data

  console.log(`\n🚀 Executing version bump...`)
  
  console.log(`📝 Creating git tag: ${fullTag}`)
  await createTag(tagPrefix, newVersion)
  
  console.log(`⬆️  Pushing tag to remote...`)
  await pushTag(fullTag)
  
  console.log(`📦 Updating package.json version...`)
  writePackageVersion(packagePath, newVersion)
  
  console.log(`\n🎉 Successfully bumped to version ${newVersion}!`)
}

// ------------------------------------------------------------
// Main bump action
// ------------------------------------------------------------
export const bump = async (options: BumpOptions) => {
  try {
    // 1. Validate
    const data = await validate(options)
    
    // 2. Execute
    await execute(data)
  } catch (error) {
    console.error(`\n${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}
