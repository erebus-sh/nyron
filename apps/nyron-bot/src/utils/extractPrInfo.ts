import { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { PullRequest } from "../types/pull-request.js";

export function extractPrInfo(payload: PullRequestOpenedEvent): PullRequest {
    // todo: create a type for the payload
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;

    const number = payload.pull_request.number;
    const title = payload.pull_request.title;
    const body = payload.pull_request.body;
    const user = payload.pull_request.user.login;

    return { owner, repo, number, title, body, user };
}