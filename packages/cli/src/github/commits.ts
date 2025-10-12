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

  // Fetch detailed commit information for each commit to get the files
  // TODO: this might spam the hell out of github api so we might defalute
  //       to simple-git later
  const commitsWithFiles = await Promise.all(
    comparison.commits.map(async (commit) => {
      const { data: detailedCommit } = await octokit.rest.repos.getCommit({
        owner,
        repo: repoName,
        ref: commit.sha,
      })
      return detailedCommit
    })
  )

  return commitsWithFiles.map((commit) => {
    // Extract author in git format: "John Doe <john.doe@example.com>"
    const authorName = commit.commit.author?.name || "unknown";
    const authorEmail = commit.commit.author?.email || "unknown";
    const gitFormatAuthor = `${authorName} <${authorEmail}>`;

    // Extract affected folders using the same mechanism as in diff.ts
    const affectedFolders = (commit.files || [])
      .map((file) => file.filename)
      .filter((f): f is string => Boolean(f))
      .map((filename) => {
        const parts = filename.split("/");
        // If file is at root, return the file itself as the "folder"
        if (parts.length === 1) return parts[0];
        // Otherwise, return the top-level folder (or top two levels for monorepos, etc.)
        return parts.slice(0, 2).join("/");
      })
      .filter((f): f is string => Boolean(f))
      .sort()
      .filter((folder, idx, arr) => idx === 0 || folder !== arr[idx - 1]);

    return {
      hash: commit.sha,
      message: commit.commit.message,
      author: gitFormatAuthor,
      repo,
      githubUser: commit.author?.login!,
      avatar: commit.author?.avatar_url,
      url: commit.html_url,
      affectedFolders,
    };
  });
}

export async function getCommitsBetween(fromTag: string, toTag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  return fetchCommitsFromComparison(fromTag, toTag, repo, clientOrContext)
}

export async function getCommitsSince(releaseTag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  return getCommitsBetween(releaseTag, "HEAD", repo, clientOrContext)
}