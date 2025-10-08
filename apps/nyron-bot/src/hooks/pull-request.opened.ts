
import { Context } from "probot";
import { extractPrInfo } from "../utils/extractPrInfo.js";
import { getParsedNyronConfig } from "../utils/getParsedNyronConfig.js";
import { getChangedFolders } from "@nyron/cli/github/diff";
import { getLatestTag } from "@nyron/cli/github/tags";
import { ProjectChange } from "./types.js";

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

  // Create a single beautiful comment with all project changes
  const commentBody = createProjectChangesComment(projectChanges);
  
  await context.octokit.rest.issues.createComment({
    owner: pr.owner,
    repo: pr.repo,
    issue_number: pr.number,
    body: commentBody,
  });
}

/**
 * Creates a beautifully formatted comment showing folder changes for all projects
 */
function createProjectChangesComment(projectChanges: Array<ProjectChange>): string {
  const header = "## 📁 Folder Changes Analysis\n\n";
  
  const sections = projectChanges.map(({ projectName, latestTag, changedFolders }) => {
    const projectHeader = `### 🔍 **${projectName}**\n`;
    
    let tagInfo: string;
    let changeInfo: string;
    
    if (latestTag) {
      tagInfo = `**Latest Tag:** \`${latestTag}\`\n`;
      
      if (changedFolders.length > 0) {
        changeInfo = `**Changed Folders:**\n${changedFolders.map(folder => `- \`${folder}\``).join('\n')}\n`;
      } else {
        changeInfo = `**Status:** ✅ No folder changes detected since last release\n`;
      }
    } else {
      tagInfo = `**Latest Tag:** ⚠️ No tags found with prefix\n`;
      changeInfo = `**Status:** 🆕 New project or no releases yet - cannot determine changes\n`;
    }
    
    return `${projectHeader}${tagInfo}${changeInfo}`;
  }).join('\n');

  const footer = "\n---\n*This analysis compares the current pull request against the latest tags for each project. Projects without tags cannot be compared to a baseline.*";
  
  return header + sections + footer;
}
