import { PullRequest } from "../types/pull-request.js";
import { Context } from "probot";

export async function extractNyronyComment(context: Context<'pull_request'>, pr: PullRequest) {
    // Extract Nyrony existing comment, and edit it, insted of creating a new one
    const comments = await context.octokit.rest.issues.listComments({
        owner: pr.owner,
        repo: pr.repo,
        issue_number: pr.number,
    });

    const nyronyComment = comments.data.find((comment) => comment.user?.login === "nyrony");
    if (!nyronyComment) {
        throw new Error("Nyrony's comment not found");
    }

    return nyronyComment;
}