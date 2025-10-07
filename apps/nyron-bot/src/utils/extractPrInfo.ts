import { PullRequest as PullRequestGithub } from "@octokit/webhooks-types";
import { PullRequest } from "../types/pull-request.js";

export function extractPrInfo(pull_request: PullRequestGithub & { [key: string]: any }): PullRequest {
    // Extract correct info from the pull_request object
    // The GitHub webhook payload for pull_request events includes the repository info at the root level,
    // but the PullRequest type from @octokit/webhooks-types does not include repository.
    // So, we expect the caller to pass the full payload or augment the type accordingly.

    // Try to get repository info from the parent object if available
    let owner: string, repo: string;
    if ("repository" in pull_request && pull_request.repository && pull_request.repository.owner && pull_request.repository.name) {
        owner = pull_request.repository.owner.login;
        repo = pull_request.repository.name;
    } else if ("base" in pull_request && pull_request.base && pull_request.base.repo) {
        owner = pull_request.base.repo.owner.login;
        repo = pull_request.base.repo.name;
    } else {
        throw new Error("Cannot extract repository owner and name from pull_request payload");
    }

    const number = pull_request.number;
    const title = pull_request.title;
    const body = pull_request.body ?? "";
    const user = pull_request.user.login;

    return { owner, repo, number, title, body, user };
}