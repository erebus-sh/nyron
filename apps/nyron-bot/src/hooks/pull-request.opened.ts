
import { Context } from "probot";
import { extractPrInfo } from "../utils/extractPrInfo.js";
import { getParsedNyronConfig } from "../utils/getParsedNyronConfig.js";
import { getChangedFolders } from "@nyron/cli/github/diff";

export async function pullRequestOpened(context: Context<"pull_request">) {
    const pr = extractPrInfo(context.payload.pull_request);
  
    const config = await getParsedNyronConfig(context, pr);
    const entries = Object.entries(config.projects);

    // Extract latest tags from prefixes
  
    // Extract current head tag
    for (const [name, project] of entries) {
      const diff = await getChangedFolders(project.tagPrefix, config.repo, context.octokit);
    }
  }
  