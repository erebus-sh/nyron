// src/actions/bump.ts
// ------------------------------------------------------------
// Nyron: Smart version bumping workflow
// ------------------------------------------------------------
// Mental Model:
//   sdk@0.0.1 ---- A ---- B ---- C ---- [changelog] ---- sdk@0.0.2 ---- D ---- E
//                  └──────┬──────┘                                └─────┬─────┘
//                  changelog for 0.0.2                        changelog for 0.0.3
//
// When bumping from sdk@0.0.2 → sdk@0.0.3:
// 1. Get commits from sdk@0.0.2 to HEAD (includes D, E, and [changelog] commit)
// 2. Filter out meta commits (version bumps, changelog updates)
// 3. Generate changelog for 0.0.3 using only D, E (real work)
// 4. Commit the changelog
// 5. Create tag sdk@0.0.3 (includes the changelog commit)
//
// Key insight: We filter out "chore: bump" and "chore: update changelog" 
// commits so they don't pollute the changelogs. Users only want to see
// real features, fixes, and meaningful chores.
// ------------------------------------------------------------
// Phase 1: Validate and compute new version
// Phase 2: Generate changelog for NEW version (lastTag → HEAD, filtered)
// Phase 3: Commit the changelog
// Phase 4: Create tag, push, and update package.json
// ------------------------------------------------------------

import { loadConfig } from "../core/loadConfig"
import { type BumpOptions, type BumpResult } from "./types"
import { createTag, getLatestTag, pushTag, tagExists } from "../git/tags"
import { getCommitsSince, formatCommitsSinceLog } from "../utils/getCommitsSince"
import { bumpVersion } from "../core/semver"
import { validatePackage } from "../utils/validatePackage"
import { writePackageVersion } from "../package/write"
import { writeChangelog } from "../changelog/write"
import { parseCommits, organizeForChangelog } from "../git/commits-parser"
import { simpleGit } from "simple-git"
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
    throw new Error(`❌ No project found with prefix "${options.prefix}"\n   → Check your nyron.config.ts for available prefixes`)
  }
  const { tagPrefix, path } = project[1]
  console.log(`✅ Found project at: ${path}`)

  // 2) Check last tag and commits
  const lastTag = await getLatestTag(tagPrefix)
  if (!lastTag) {
    throw new Error(`❌ No previous tag found for ${tagPrefix}\n   → Create an initial tag with: nyron tag -p ${tagPrefix} -v 0.0.1`)
  }
  console.log(`✅ Latest tag: ${lastTag}`)

  const commitsResult = await getCommitsSince(lastTag, config.repo)
  const { realCommits } = commitsResult
  
  console.log(formatCommitsSinceLog(commitsResult))

  // 3) Verify package.json
  const packageJson = await validatePackage(path)
  if (!packageJson.valid) {
    throw new Error(`❌ ${packageJson.error || "Invalid package.json"}\n   → Ensure package.json exists at ${path} with a valid version field`)
  }
  console.log(`✅ Package validated`)

  // 4) Compute new version and check tag doesn't exist
  const version = lastTag.replace(tagPrefix, "")
  const newVersion = bumpVersion(version, options.type)
  const fullTag = `${tagPrefix}${newVersion}`
  
  if (await tagExists(fullTag)) {
    throw new Error(`❌ Tag ${fullTag} already exists\n   → This version has already been released`)
  }
  console.log(`✅ New version: ${newVersion} (${options.type} bump from ${version})`)

  return { tagPrefix, path, lastTag, realCommits, newVersion, fullTag, packagePath: packageJson.path }
}

// ------------------------------------------------------------
// Phase 2: Generate changelog for the NEW version
// ------------------------------------------------------------
const generateChangelogForNewVersion = async (data: Awaited<ReturnType<typeof validate>>) => {
  const { tagPrefix, realCommits, newVersion } = data
  
  console.log(`\n📝 Generating changelog for ${newVersion}...`)
  
  // Import the changelog generation utilities
  
  // Parse commits into structured groups
  const parsedCommits = parseCommits(realCommits)
  const { features, fixes, chores } = organizeForChangelog(parsedCommits)
  
  // Write changelog for the NEW version
  await writeChangelog({
    prefix: tagPrefix,
    version: newVersion,
    features,
    fixes,
    chores,
  })
  
  console.log(`✅ Changelog generated for ${newVersion} (${realCommits.length} commit${realCommits.length === 1 ? '' : 's'})`)
  return { generated: true, commitCount: realCommits.length }
}

// ------------------------------------------------------------
// Phase 3: Commit the changelog
// ------------------------------------------------------------
const commitChangelog = async (data: Awaited<ReturnType<typeof validate>>) => {
  const { tagPrefix, newVersion } = data
  const git = simpleGit()
  
  console.log(`\n📝 Committing changelog...`)
  
  // Stage the specific changelog file
  const changelogPath = buildChangelogPath(tagPrefix, newVersion)
  await git.add(changelogPath)
  
  // Check if there are changes to commit
  const status = await git.status()
  if (status.files.length === 0) {
    console.log(`⚠️  No changelog changes to commit`)
    return
  }
  
  // Commit the changelog
  await git.commit(`chore: update changelog for ${tagPrefix}${newVersion}`)
  console.log(`✅ Changelog committed`)
}

// ------------------------------------------------------------
// Phase 4: Execute (create tag and push)
// ------------------------------------------------------------
const execute = async (data: Awaited<ReturnType<typeof validate>>) => {
  const { tagPrefix, newVersion, fullTag, packagePath } = data

  console.log(`\n🚀 Executing version bump...`)
  
  console.log(`🏷️  Creating git tag: ${fullTag}`)
  await createTag(tagPrefix, newVersion)
  
  console.log(`⬆️  Pushing tag to remote...`)
  await pushTag(fullTag)
  
  console.log(`📦 Updating package.json version...`)
  writePackageVersion(packagePath, newVersion)
  
  console.log(`\n🎉 Successfully bumped to ${fullTag}!`)
}

// ------------------------------------------------------------
// Main bump action
// ------------------------------------------------------------
export const bump = async (options: BumpOptions): Promise<BumpResult> => {
  try {
    // Phase 1: Validate and compute new version
    const data = await validate(options)
    
    // Phase 2: Generate changelog for the NEW version
    const changelog = await generateChangelogForNewVersion(data)
    
    // Phase 3: Commit the changelog
    try {
      await commitChangelog(data)
    } catch (error) {
      console.log(`⚠️  Could not commit changelog: ${error instanceof Error ? error.message : String(error)}`)
      console.log(`   → Continuing anyway - changelog was written successfully`)
      // Continue anyway - changelog was written even if not committed
    }
    
    // Phase 4: Create tag, push, and update package.json
    await execute(data)
    return {
      success: true,
      prefix: data.tagPrefix,
      newVersion: data.newVersion,
      tag: data.fullTag,
      packagePath: data.packagePath,
      changelog,
    }
  } catch (error) {
    console.error(`\n❌ Bump failed:\n${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      prefix: options.prefix,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
