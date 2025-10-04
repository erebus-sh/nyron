import { Octokit } from "octokit"
import type { Repo } from "./types"

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] })

export async function getPRsBetweenTags(repo: Repo, fromTag: string, toTag: string) {
  // Step 1: get commits for tags
  const [fromCommit, toCommit] = await Promise.all([
    octokit.rest.repos.getCommit({ owner: repo.owner, repo: repo.repo, ref: fromTag }),
    octokit.rest.repos.getCommit({ owner: repo.owner, repo: repo.repo, ref: toTag }),
  ]);

  const fromDate = fromCommit.data.commit.committer?.date;
  const toDate = toCommit.data.commit.committer?.date;

  // If either date is missing, return empty array
  if (!fromDate || !toDate) {
    return [];
  }

  // Step 2: get PRs closed in that range
  const prs = await octokit.paginate(octokit.rest.pulls.list, {
    owner: repo.owner,
    repo: repo.repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
    per_page: 100,
  });

  // Step 3: filter merged PRs in range
  return prs.filter(pr => {
    if (!pr.merged_at) return false;
    // pr.merged_at is string | null, but we already checked for falsy above
    return (
      new Date(pr.merged_at) >= new Date(fromDate) &&
      new Date(pr.merged_at) <= new Date(toDate)
    );
  });
}
