import { getCommitsSince as getCommitsSinceFromGitHub } from "../github/commits"
import { filterMetaCommits } from "../git/commits-parser"
import type { CommitDiff } from "../git/types"

export interface CommitsSinceResult {
  commitsSince: CommitDiff[]
  realCommits: CommitDiff[]
  lastTag: string
}

/**
 * Get commits since the last tag, filter out meta commits, and validate the results.
 * This utility handles the common pattern of:
 * 1. Fetching commits since a tag
 * 2. Filtering out version bump and changelog commits
 * 3. Validating that there are meaningful commits to release
 * 
 * @param lastTag - The last git tag to get commits since
 * @param repo - The repository configuration
 * @returns Object containing the raw commits, filtered commits, and last tag
 * @throws Error if no commits found or no meaningful commits after filtering
 */
export async function getCommitsSince(lastTag: string, repo: string): Promise<CommitsSinceResult> {
  // Get all commits since the last tag
  const commitsSince = await getCommitsSinceFromGitHub(lastTag, repo)
  if (commitsSince.length === 0) {
    throw new Error(`❌ No new commits since last release\n   → Make some changes and commit them before bumping`)
  }
  
  // Filter out meta commits (version bumps, changelog updates)
  const realCommits = filterMetaCommits(commitsSince)
  
  if (realCommits.length === 0) {
    throw new Error(`❌ No substantive commits to release\n   → Only version bump and changelog commits found since ${lastTag}\n   → Add feature, fix, or other meaningful commits before bumping`)
  }
  
  return {
    commitsSince,
    realCommits,
    lastTag
  }
}

/**
 * Generate a formatted log message for commits since validation.
 * 
 * @param result - The result from getCommitsSince
 * @returns Formatted log message
 */
export function formatCommitsSinceLog(result: CommitsSinceResult): string {
  const { realCommits, commitsSince, lastTag } = result
  const metaCommitCount = commitsSince.length - realCommits.length
  const metaCommitText = metaCommitCount > 0 
    ? ` (filtered ${metaCommitCount} meta commit${metaCommitCount === 1 ? '' : 's'})` 
    : ''
  
  return `✅ Found ${realCommits.length} commit${realCommits.length === 1 ? '' : 's'} since ${lastTag}${metaCommitText}`
}
