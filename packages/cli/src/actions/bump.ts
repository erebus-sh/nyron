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
import type { BumpType } from "../core/types"
import { validatePackage } from "../utils/validatePackage"
import { writePackageVersion } from "../package/write"

const getType = (options: BumpOptions): BumpType => {
  if (options.major) return "major"
  if (options.minor) return "minor"
  if (options.patch) return "patch"
  if (options.prerelease) return "prerelease"
  return "patch"
}

// ------------------------------------------------------------
// Phase 1: Validate (dry run)
// ------------------------------------------------------------
const validate = async (options: BumpOptions) => {
  const config = await loadConfig()
  const type = getType(options)

  // 1) Find project
  const project = Object.entries(config.projects).find(
    ([, v]) => v.tagPrefix === options.prefix
  )
  if (!project) {
    throw new Error(`No project found with prefix ${options.prefix}`)
  }
  const { tagPrefix, path } = project[1]

  // 2) Check last tag and commits
  const lastTag = await getLatestTag(tagPrefix)
  if (!lastTag) {
    throw new Error(`No previous tag found for ${tagPrefix}`)
  }

  const commitsSince = await getCommitsSince(lastTag)
  if (commitsSince.length === 0) {
    throw new Error("No new commits since last release")
  }

  // 3) Verify package.json
  const packageJson = await validatePackage(path)
  if (!packageJson.valid) {
    throw new Error(packageJson.error || "Invalid package.json")
  }

  // 4) Compute new version and check tag doesn't exist
  const version = lastTag.replace(tagPrefix, "")
  const newVersion = bumpVersion(version, type)
  const fullTag = `${tagPrefix}${newVersion}`
  
  if (await tagExists(fullTag)) {
    throw new Error(`Tag ${fullTag} already exists`)
  }

  // 5) Check changelog (with user prompt)
  const safeTag = lastTag.replace(/[@/]/g, "_")
  const changelogPath = `.nyron/${path}/CHANGELOG-${safeTag}.md`
  if (!(await fileExists(changelogPath))) {
    const confirm = await ask(
      `No changelog found for ${path}. Continue anyway? [y/N] `
    )
    if (confirm.toLowerCase() !== "y") {
      throw new Error("Bump cancelled by user")
    }
  }

  return { tagPrefix, path, lastTag, commitsSince, newVersion, fullTag, packagePath: packageJson.path }
}

// ------------------------------------------------------------
// Phase 2: Execute (apply changes)
// ------------------------------------------------------------
const execute = async (data: Awaited<ReturnType<typeof validate>>) => {
  const { tagPrefix, newVersion, fullTag, packagePath } = data

  await createTag(tagPrefix, newVersion)
  await pushTag(fullTag)
  writePackageVersion(packagePath, newVersion)
  
  console.log(`✓ Version bumped to ${newVersion}`)
}

// ------------------------------------------------------------
// Main bump action
// ------------------------------------------------------------
export const bump = async (options: BumpOptions) => {
  try {
    console.log("Validating...")
    const data = await validate(options)
    
    console.log(`Found ${data.commitsSince.length} commits since ${data.lastTag}`)
    console.log(`Creating tag ${data.fullTag}...`)
    
    await execute(data)
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}
