
import { Context } from "probot";
import { extractPrInfo } from "../utils/extractPrInfo.js";
import { getParsedNyronConfig } from "../utils/getParsedNyronConfig.js";
import { getChangedFolders } from "@nyron/cli/github/diff";
import { getLatestTag } from "@nyron/cli/github/tags";
import { ProjectChange } from "./types.js";
import { buildProjectChangesComment } from "../utils/buildProjectChangesComment.js";

export async function pullRequestOpened(context: Context<"pull_request">) {
  const pr = extractPrInfo(context.payload.pull_request);

  const config = await getParsedNyronConfig(context, pr);
  const entries = Object.entries(config.projects);

  // Collect all project change information
  const projectChanges: Array<ProjectChange> = [];

  // Extract current head tag for each project
  for (const [projectName, project] of entries) {
    const latestTag = await getLatestTag(config.repo, project.tagPrefix, context.octokit);
    
    let changedFolders: string[] = [];
    let hasChanges = false;
    
    if (latestTag) {
      // If we have a tag, get the diff since that tag
      changedFolders = await getChangedFolders(latestTag, config.repo, context.octokit);
      hasChanges = true;
    } else {
      // If no tag exists, we can't determine changes since a baseline
      // This could mean it's a new project or no releases yet
      changedFolders = [];
      hasChanges = false;
    }

    projectChanges.push({
      projectName,
      latestTag,
      changedFolders,
      hasChanges,
    });
  }

  // Build a formal GitHub-flavored Markdown comment summarizing changes
  const commentBody = buildProjectChangesComment(projectChanges, {
    owner: pr.owner,
    repo: pr.repo,
    headSha: context.payload.pull_request.head.sha,
  });
  
  await context.octokit.rest.issues.createComment({
    owner: pr.owner,
    repo: pr.repo,
    issue_number: pr.number,
    body: commentBody,
  });
}

 
