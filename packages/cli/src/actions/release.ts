/**
 * # Nyron Release System
 * 
 * ## Overview
 * The release command creates GitHub releases with auto-generated changelogs based on commits
 * between Nyron release tags.
 * 
 * ## Mental Model
 * ```
 * nyron-release@date... ---- A ---- B ---- C ---- [changelog] ---- nyron-release@date... ---- D ---- E
 *                            └──────┬──────┘                                                  └─────┬─────┘
 *                            changelog for all versions                                 changelog for all versions
 * ```
 * 
 * ## How It Works
 * 
 * ### 1. Tag Discovery
 * - Finds the latest `nyron-release@<timestamp>` tag in the repository
 * - This tag marks the last release point and serves as the starting point for changelog generation
 * 
 * ### 2. Commit Extraction
 * - Fetches all commits between the latest tag and HEAD using GitHub API
 * - Each commit contains: message, author, SHA, and metadata
 * - If no commits found, the release is skipped (nothing new to release)
 * 
 * ### 3. Commit Parsing
 * - Parses commit messages using conventional commit format (feat:, fix:, etc.)
 * - Groups commits by type (features, fixes, breaking changes, etc.)
 * - Extracts package scopes from commit messages (e.g., `feat(cli): add feature`)
 * 
 * ### 4. Version Detection
 * - Reads version information from meta.json (generated during tag/bump)
 * - Contains package names, old versions, and new versions
 * - Used to show which packages were updated and by how much
 * 
 * ### 5. Changelog Generation
 * - Generates markdown changelog from parsed commits and version data
 * - Formats into sections: Breaking Changes, Features, Bug Fixes, etc.
 * - Includes package version updates and commit details
 * 
 * ### 6. GitHub Release Creation
 * - Creates a GitHub release with the generated changelog as body
 * - Tags the release with the nyron-release tag
 * - Publishes to the repository's releases page
 * 
 * ## Dry Run vs Wet Run
 * - **Dry Run**: Generates changelog and prints to console (no GitHub release created)
 * - **Wet Run**: Generates changelog and creates actual GitHub release
 */

import { loadConfig } from "../config"
import { parseCommits } from "../core/commits-parser"
import { getLatestNyronReleaseTag } from "../git/tags"
import { getCommitsSince } from "../github/commits"
import type { ReleaseOptions } from "./types"
import { generateChangelogMarkdown } from "../changelog/generateChangelog"
import { getUpdatedVersions } from "../nyron/version"
import { createRelease } from "../github/release"
import { generateNyronReleaseTag } from "../core/tag-parser"

/**
 * Creates a GitHub release with an auto-generated changelog.
 * 
 * @param options - Release configuration options
 * @param options.dryRun - If true, prints changelog without creating release
 * 
 * @returns Promise<void | { generated: false, reason: string }> - Returns void on success, or error object if no commits found
 * 
 * @throws {Error} If no nyron release tag found
 * 
 * @example
 * ```ts
 * // Create a real release
 * await release({ dryRun: false })
 * 
 * // Preview changelog without releasing
 * await release({ dryRun: true })
 * ```
 */
export const release = async (options: ReleaseOptions) => {
    const { dryRun } = options
    
    console.log(`\n🚀 Starting release process (${dryRun ? 'DRY RUN' : 'WET RUN'})...`)
    
    const { config } = await loadConfig()
    console.log(`✓ Config loaded for repo: ${config.repo}`)
    
    if (!dryRun) {
        console.log('\n📍 Step 1: Finding latest release tag...')
        let latestTag: string | null = null
        if (!options.newTag) {
          latestTag = await getLatestNyronReleaseTag()
        }else{
          // get the version pre the latest tag

        }
        if (!latestTag) {
          throw new Error(`No nyron release tag found\n   → Make sure to push the tag with nyron tool`)
        }
        console.log(`✓ Found tag: ${latestTag}`)

        // Get commits between tags
        console.log('\n📍 Step 2: Fetching commits since last release...')
        const commits = await getCommitsSince(latestTag, config.repo)
        if (commits.length === 0) {
          console.log('⚠️  No commits found between tags - skipping release')
          return { generated: false, reason: "No commits found between tags" }
        }
        console.log(`✓ Found ${commits.length} commit(s)`)
      
        // Parse commits into structured groups
        console.log('\n📍 Step 3: Parsing commits...')
        const parsedCommits = parseCommits(commits)
        console.log(`✓ Parsed commits into groups (features, fixes, etc.)`)

        // Extract versions from meta.json
        console.log('\n📍 Step 4: Reading version information...')
        const versions = await getUpdatedVersions()
        console.log(`✓ Loaded version data for ${versions.length} package(s)`)

        // Generate changelog
        console.log('\n📍 Step 5: Generating changelog...')
        const changelog = await generateChangelogMarkdown(parsedCommits, versions)
        console.log(`✓ Changelog generated (${changelog.length} characters)`)

        // Release the changelog
        let newNyronReleaseTag: string = latestTag
        if (options.newTag) {
          // Generate the new nyron release tag
          console.log('\n📍 Step 6: Generating new nyron release tag...')
          newNyronReleaseTag = generateNyronReleaseTag()
          console.log(`✓ New nyron release tag: ${newNyronReleaseTag}`)
        }        
        // Use the new nyron release tag
        console.log('\n📍 Step 6: Creating GitHub release...')
        await createRelease(config.repo, newNyronReleaseTag, changelog)
        console.log(`✅ Release created successfully!\n`)

        return
    }else {
        console.log('\n📍 Step 1: Finding latest release tag...')
        const latest = await getLatestNyronReleaseTag()
        if (!latest) {
          throw new Error(`No nyron release tag found\n   → Make sure to push the tag with nyron tool`)
        }
        console.log(`✓ Found tag: ${latest}`)

        // Get commits between tags
        console.log('\n📍 Step 2: Fetching commits since last release...')
        const commits = await getCommitsSince(latest, config.repo)
        if (commits.length === 0) {
          console.log('⚠️  No commits found between tags - skipping release')
          return { generated: false, reason: "No commits found between tags" }
        }
        console.log(`✓ Found ${commits.length} commit(s)`)
      
        // Parse commits into structured groups
        console.log('\n📍 Step 3: Parsing commits...')
        const parsedCommits = parseCommits(commits)
        console.log(`✓ Parsed commits into groups (features, fixes, etc.)`)

        // Extract versions from meta.json
        console.log('\n📍 Step 4: Reading version information...')
        const versions = await getUpdatedVersions()
        console.log(`✓ Loaded version data for ${versions.length} package(s)`)

        // Generate changelog
        console.log('\n📍 Step 5: Generating changelog...')
        const changelog = await generateChangelogMarkdown(parsedCommits, versions)
        console.log(`✓ Changelog generated (${changelog.length} characters)`)

        console.log('\n📍 Step 6: Preview (DRY RUN - no release created)')
        console.log('\n' + '='.repeat(80))
        console.log(changelog)
        console.log('='.repeat(80) + '\n')
        console.log('✅ Dry run completed - no release was created\n')
        return
    }
}