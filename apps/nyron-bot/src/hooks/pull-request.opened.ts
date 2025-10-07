
import { Context } from "probot";
import { extractPrInfo } from "../utils/extractPrInfo.js";
import { getParsedNyronConfig } from "../utils/getParsedNyronConfig.js";
import { getChangedFolders } from "@nyron/cli/github/diff";
import { getLatestTag } from "@nyron/cli/github/tags";

export async function pullRequestOpened(context: Context<"pull_request">) {
  const pr = extractPrInfo(context.payload.pull_request);

  const config = await getParsedNyronConfig(context, pr);
  const entries = Object.entries(config.projects);


  // Extract current head tag
  for (const [, project] of entries) {
    const latestTag = await getLatestTag(config.repo, project.tagPrefix, context.octokit);
    if (!latestTag) continue; // For now the behavior is to skip if no tag is found

    const diff = await getChangedFolders(latestTag, config.repo, context.octokit);

    const message = diff.length > 0
      ? `Changed folders since latest tag (${latestTag}): ${diff.join(", ")}`
      : `No folder changes detected since latest tag (${latestTag}).`;

    await context.octokit.rest.issues.createComment({
      owner: pr.owner,
      repo: config.repo,
      issue_number: pr.number,
      body: message,
    });
  }
}
