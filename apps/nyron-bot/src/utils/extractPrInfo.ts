import { PullRequest as PullRequestGithub } from "@octokit/webhooks-types";
import { PullRequest } from "../types/pull-request.js";

/**
 * Extracts and normalizes essential pull request information from GitHub webhook payloads.
 * 
 * This utility function intelligently parses GitHub webhook payloads to extract critical
 * pull request metadata while handling various payload structures and preventing self-triggering
 * bot events. It serves as a robust abstraction layer between GitHub's webhook format and
 * our internal data structures.
 * 
 * @param pull_request - The GitHub webhook payload containing pull request data. Can include
 *                       additional properties beyond the standard @octokit/webhooks-types schema.
 *                       The function expects either a full webhook payload with repository context
 *                       or a pull request object with base repository information.
 * 
 * @returns A normalized {@link PullRequest} object containing:
 *          - `owner`: Repository owner's GitHub username
 *          - `repo`: Repository name
 *          - `number`: Pull request number
 *          - `title`: Pull request title
 *          - `body`: Pull request description (empty string if null)
 *          - `user`: Author's GitHub username
 * 
 * @throws {Error} When repository owner/name cannot be determined from the payload structure
 * @throws {Error} When the pull request author is identified as a Nyron bot (prevents self-triggering)
 * 
 * @example
 * ```typescript
 * // From a GitHub webhook payload
 * const webhookPayload = { pull_request: {...}, repository: {...} };
 * const prInfo = extractPrInfo(webhookPayload.pull_request);
 * console.log(`Processing PR #${prInfo.number} in ${prInfo.owner}/${prInfo.repo}`);
 * ```
 * 
 * @example
 * ```typescript
 * // From a pull request object with base repository info
 * const pullRequest = { 
 *   number: 123, 
 *   title: "Fix bug", 
 *   base: { repo: { owner: { login: "user" }, name: "repo" } } 
 * };
 * const prInfo = extractPrInfo(pullRequest);
 * ```
 * 
 * @category GitHub Integration
 */
export function extractPrInfo(pull_request: PullRequestGithub & { [key: string]: any }): PullRequest {
    // Extract repository information with intelligent fallback strategy
    // GitHub webhook payloads can vary in structure depending on the event source
    // and payload completeness, so we implement multiple extraction strategies
    let owner: string, repo: string;
    
    if ("repository" in pull_request && pull_request.repository && pull_request.repository.owner && pull_request.repository.name) {
        // Primary strategy: Direct repository reference (most common in full webhook payloads)
        owner = pull_request.repository.owner.login;
        repo = pull_request.repository.name;
    } else if ("base" in pull_request && pull_request.base && pull_request.base.repo) {
        // Fallback strategy: Extract from pull request's base branch repository
        owner = pull_request.base.repo.owner.login;
        repo = pull_request.base.repo.name;
    } else {
        // If neither strategy succeeds, the payload is malformed or incomplete
        throw new Error("Cannot extract repository owner and name from pull_request payload");
    }

    // Extract core pull request metadata with safe defaults
    const number = pull_request.number;
    const title = pull_request.title;
    const body = pull_request.body ?? ""; // Ensure body is never null
    const user = pull_request.user.login;

    // Self-triggering prevention mechanism
    // This prevents the bot from processing its own pull requests, which would
    // create infinite loops and unnecessary API calls
    if (user.toLowerCase().includes("nyron")) {
        throw new Error(
            `Self-triggering prevention: PR author "${user}" appears to be a Nyron bot. Refusing to process this pull request to avoid infinite loops.`
        );
    }

    return { owner, repo, number, title, body, user };
}