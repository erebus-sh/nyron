// src/actions/bump.ts
// ------------------------------------------------------------
// Nyron: Smart version bumping workflow
// ------------------------------------------------------------
// Mental Model:
//   sdk@0.0.1 ---- A ---- B ---- C ---- [changelog commit] ---- sdk@0.0.2
//                  └──────┬──────┘              │
//                    changelog                  ▼
//                                         included in tag
//
// When bumping from sdk@0.0.1 → sdk@0.0.2:
// 1. Generate changelog from commits A, B, C (since sdk@0.0.1)
// 2. Commit the changelog 
// 3. Create tag sdk@0.0.2 (includes the changelog commit)
// This ensures the changelog commit is part of the tagged release.
// ------------------------------------------------------------
// Phase 1: Validate and compute new version
// Phase 2: Generate changelog for NEW version (lastTag → HEAD)
// Phase 3: Commit the changelog
// Phase 4: Create tag, push, and update package.json
// ------------------------------------------------------------

import { loadConfig } from "../core/loadConfig"
import { type BumpOptions } from "./types"
import { createTag, getLatestTag, pushTag, tagExists } from "../git/tags"
import { getCommitsSince } from "../git/commits"
import { ask } from "../core/prompts"
import { bumpVersion } from "../core/semver"
import { validatePackage } from "../utils/validatePackage"
import { writePackageVersion } from "../package/write"

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

  return { tagPrefix, path, lastTag, commitsSince, newVersion, fullTag, packagePath: packageJson.path }
}

// ------------------------------------------------------------
// Phase 2: Generate changelog for the NEW version
// ------------------------------------------------------------
const generateChangelogForNewVersion = async (data: Awaited<ReturnType<typeof validate>>) => {
  const { tagPrefix, lastTag, commitsSince, newVersion } = data
  
  console.log(`\n📝 Generating changelog for version ${newVersion}...`)
  
  if (commitsSince.length === 0) {
    console.log(`⚠️  No commits to include in changelog`)
    return { generated: false }
  }
  
  // Import the changelog generation utilities
  const { parseCommits, organizeForChangelog } = await import("../git/commits-parser")
  const { writeChangelog } = await import("../changelog/write")
  
  // Parse commits into structured groups
  const parsedCommits = parseCommits(commitsSince)
  const { features, fixes, chores } = organizeForChangelog(parsedCommits)
  
  // Write changelog for the NEW version
  await writeChangelog({
    prefix: tagPrefix,
    version: newVersion,
    features,
    fixes,
    chores,
  })
  
  console.log(`✓ Changelog generated: ${commitsSince.length} commits (${lastTag} → HEAD)`)
  return { generated: true, commitCount: commitsSince.length }
}

// ------------------------------------------------------------
// Phase 3: Commit the changelog
// ------------------------------------------------------------
const commitChangelog = async (data: Awaited<ReturnType<typeof validate>>) => {
  const { tagPrefix, newVersion } = data
  const { simpleGit } = await import("simple-git")
  const git = simpleGit()
  
  console.log(`📝 Committing changelog...`)
  
  // Stage the changelog directory
  await git.add(`changelogs/${tagPrefix}*`)
  
  // Check if there are changes to commit
  const status = await git.status()
  if (status.files.length === 0) {
    console.log(`⚠️  No changelog changes to commit`)
    return
  }
  
  // Commit the changelog
  await git.commit(`chore: update changelog for ${tagPrefix}${newVersion}`)
  console.log(`✓ Changelog committed`)
}

// ------------------------------------------------------------
// Phase 4: Execute (create tag and push)
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
    // Phase 1: Validate and compute new version
    const data = await validate(options)
    
    // Phase 2: Generate changelog for the NEW version (from lastTag to HEAD)
    try {
      await generateChangelogForNewVersion(data)
    } catch (error) {
      console.log(`⚠️  Could not generate changelog: ${error instanceof Error ? error.message : String(error)}`)
      const confirm = await ask(`Continue with bump anyway? [y/N] `)
      if (confirm.toLowerCase() !== "y") {
        throw new Error("❌ Bump cancelled by user")
      }
    }
    
    // Phase 3: Commit the changelog
    try {
      await commitChangelog(data)
    } catch (error) {
      console.log(`⚠️  Could not commit changelog: ${error instanceof Error ? error.message : String(error)}`)
      // Continue anyway - changelog was written even if not committed
    }
    
    // Phase 4: Create tag, push, and update package.json
    await execute(data)
  } catch (error) {
    console.error(`\n${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}
