// src/actions/bump.ts
// ------------------------------------------------------------
// Nyron: Smart version bumping workflow
// ------------------------------------------------------------
// 1) Detect latest tag for the given prefix
// 2) Collect commits since that tag
// 3) Verify changelog existence (or prompt user)
// 4) Bump version using semantic rules
// 5) Create and push new tag
// 6) Generate new changelog (optional, next step)
// ------------------------------------------------------------

import { loadConfig } from "../core/loadConfig"
import { type BumpOptions } from "./types"
import { createTag, getLatestTag, pushTag } from "../git/tags"
import { getCommitsSince } from "../git/commits"
import { fileExists } from "../core/files"
import { ask } from "../core/prompts"
import { bumpVersion } from "../core/semver"
import type { BumpType } from "../core/types"

// Determine bump type from options
const getType = (options: BumpOptions): BumpType => {
  if (options.major) return "major"
  if (options.minor) return "minor"
  if (options.patch) return "patch"
  if (options.prerelease) return "prerelease"
  return "patch"
}

// ------------------------------------------------------------
// Main bump action
// ------------------------------------------------------------
export const bump = async (options: BumpOptions) => {
  const config = await loadConfig()
  const type = getType(options)

  // 1) Find the target project
  const project = Object.entries(config.projects).find(
    ([, v]) => v.tagPrefix === options.prefix
  )

  if (!project) {
    console.error(`Error: No project found with prefix ${options.prefix}`)
    process.exit(1)
  }

  const { tagPrefix, path } = project[1]

  // 2) Detect last tag and commits
  const lastTag = await getLatestTag(tagPrefix)
  if (!lastTag) {
    console.log(`No previous tag found for ${tagPrefix} (initial release).`)
    return
  }

  const commitsSince = await getCommitsSince(lastTag)
  console.log(`Found ${commitsSince.length} commits since ${lastTag}`)
  if (commitsSince.length === 0) {
    console.log(`No new commits since last release. Aborting.`)
    return
  }

  // 3) Verify changelog presence
  const safeTag = lastTag.replace(/[@/]/g, "_")
  const changelogPath = `.nyron/${path}/CHANGELOG-${safeTag}.md`
  if (!(await fileExists(changelogPath))) {
    const confirm = await ask(
      `No changelog found for ${path}. Continue version bump anyway? [y/N] `
    )
    if (confirm.toLowerCase() !== "y") {
      console.log("Bump aborted.")
      return
    }
  }

  // 4) Compute next version
  const version = lastTag.replace(tagPrefix, "")
  const newVersion = bumpVersion(version, type)
  const fullTag = `${tagPrefix}${newVersion}`

  // 5) Create and push tag
  console.log(`Creating new tag ${fullTag}...`)
  await createTag(tagPrefix, newVersion)
  await pushTag(fullTag)
  console.log(`Version bumped to ${newVersion} successfully.`)

}
