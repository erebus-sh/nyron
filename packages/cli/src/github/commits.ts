// Parse commits and group them by type
// For example a all "fix:" prefixed commits -> Bug fixes
// a all "feat:" prefixed commits -> Features
// etc...

import type { CommitDiff } from "../git/types"
import { parseRepo } from "./repo-parser"
import { resolveOctokit } from "./types"

export async function getCommitsSince(tag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)
  
  const { data: comparison } = await octokit.rest.repos.compareCommits({
    owner,
    repo: repoName,
    base: tag,
    head: "HEAD",
  })

  return await Promise.all(
    comparison.commits.map(async (commit) => {
      const commitData: CommitDiff = {
        hash: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.email || commit.commit.author?.name || "unknown",
        repo: repo,
        githubUser: commit.author?.login,
        avatar: commit.author?.avatar_url,
        url: commit.html_url,
      }
      return commitData
    })
  )
}

export async function getCommitsBetween(fromTag: string, toTag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)
  
  const { data: comparison } = await octokit.rest.repos.compareCommits({
    owner,
    repo: repoName,
    base: fromTag,
    head: toTag,
  })

  return await Promise.all(
    comparison.commits.map(async (commit) => {
      const commitData: CommitDiff = {
        hash: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.email || commit.commit.author?.name || "unknown",
        repo: repo,
        githubUser: commit.author?.login,
        avatar: commit.author?.avatar_url,
        url: commit.html_url,
      }
      return commitData
    })
  )
}
