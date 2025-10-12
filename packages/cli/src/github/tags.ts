import { resolveOctokit } from "./types"
import { parseRepo } from "./repo-parser"
import { generateNyronReleaseTag } from "../core/tag-parser"
import simpleGit from "simple-git"

export async function pushNyronReleaseTag(repo: string, clientOrContext?: unknown) {
  const octokit = resolveOctokit(clientOrContext as any)
  const { owner, repo: repoName } = parseRepo(repo)
  const tag = generateNyronReleaseTag()
  const git = simpleGit()

  try {
    // Create the tag locally
    await git.addTag(tag)
    
    // Push the tag to remote
    await git.pushTags('origin')

    // Get the latest commit SHA from the default branch
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo: repoName,
    })

    const defaultBranch = repoData.default_branch

    if (!defaultBranch) {
      throw new Error(`Repository ${owner}/${repoName} has no default branch configured`)
    }

    // Verify the tag was created on GitHub (it should be from the push)
    const { data: tagData } = await octokit.rest.git.getRef({
      owner,
      repo: repoName,
      ref: `tags/${tag}`,
    })

    return tagData
  } catch (error: any) {
    // Handle specific GitHub API errors
    if (error.status === 404) {
      throw new Error(`Repository ${owner}/${repoName} not found or you don't have access to it`)
    } else if (error.status === 422 && error.message?.includes('Reference already exists')) {
      throw new Error(`Tag ${tag} already exists in ${owner}/${repoName}`)
    } else if (error.status === 422) {
      throw new Error(`Failed to create tag ${tag}: ${error.message || 'Invalid request'}`)
    }
    // Re-throw other errors
    throw error
  }
}