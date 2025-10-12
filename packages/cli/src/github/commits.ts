// Parse commits and group them by type
// For example a all "fix:" prefixed commits -> Bug fixes
// a all "feat:" prefixed commits -> Features
// etc...

import { parseRepo } from "./repo-parser"
import { resolveOctokit, type CommitDiff } from "./types"

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



  return comparison.commits.map((commit) => {
    // Extract author in git format: "John Doe <john.doe@example.com>"
    const authorName = commit.commit.author?.name || "unknown";
    const authorEmail = commit.commit.author?.email || "unknown";
    const gitFormatAuthor = `${authorName} <${authorEmail}>`;

    return ({
      hash: commit.sha,
      message: commit.commit.message,
      author: gitFormatAuthor,
      repo,
      githubUser: commit.author?.login,
      avatar: commit.author?.avatar_url,
      url: commit.html_url,
    })
  });
}

export async function getCommitsBetween(fromTag: string, toTag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  return fetchCommitsFromComparison(fromTag, toTag, repo, clientOrContext)
}

export async function getCommitsSince(releaseTag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  return getCommitsBetween(releaseTag, "HEAD", repo, clientOrContext)
}