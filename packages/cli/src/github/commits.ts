// Parse commits and group them by type
// For example a all "fix:" prefixed commits -> Bug fixes
// a all "feat:" prefixed commits -> Features
// etc...

import type { CommitDiff } from "../git/types"
import { Octokit } from "octokit"
import { parseRepo } from "./repo-parser"

if (!process.env['GITHUB_TOKEN']) {
  throw new Error(
    [
      '❌ GitHub authentication failed: GITHUB_TOKEN is not set.',
      '',
      'To fix this, set the GITHUB_TOKEN environment variable with a valid GitHub personal access token.',
      '',
      'Example:',
      '  export GITHUB_TOKEN=ghp_xxxYourTokenHerexxx',
      '',
      'You can create a token at: https://github.com/settings/tokens',
      'Required scopes: "repo" (for private repos) or "public_repo" (for public repos).',
      '',
      'Tip: You can also add GITHUB_TOKEN to your .env file for local development.'
    ].join('\n')
  )
}

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] })

export async function getCommitsSince(tag: string, repo: string): Promise<CommitDiff[]> {
  const { owner, repo: repoName } = parseRepo(repo)
  
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

export async function getCommitsBetween(fromTag: string, toTag: string, repo: string): Promise<CommitDiff[]> {
  const { owner, repo: repoName } = parseRepo(repo)
  
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
