// Parse commits and group them by type
// For example a all "fix:" prefixed commits -> Bug fixes
// a all "feat:" prefixed commits -> Features
// etc...

import type { CommitDiff } from "../git/types"
import { parseRepo } from "./repo-parser"
import { resolveOctokit } from "./types"

async function fetchCommitsFromComparison(
  base: string, 
  head: string, 
  repo: string, 
  clientOrContext?: unknown
): Promise<CommitDiff[]> {
  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)
  
  const { data: comparison } = await octokit.rest.repos.compareCommits({
    owner,
    repo: repoName,
    base,
    head,
  })

  return comparison.commits.map((commit) => ({
    hash: commit.sha,
    message: commit.commit.message,
    author: commit.commit.author?.email || commit.commit.author?.name || "unknown",
    repo,
    githubUser: commit.author?.login,
    avatar: commit.author?.avatar_url,
    url: commit.html_url,
  }))
}

export async function getCommitsBetween(fromTag: string, toTag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  return fetchCommitsFromComparison(fromTag, toTag, repo, clientOrContext)
}

export async function getCommitsSince(releaseTag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  return getCommitsBetween(releaseTag, "HEAD", repo, clientOrContext)
}