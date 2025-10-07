import { parseConfig } from "@nyron/cli/config";
import { Context } from "probot";

export async function getParsedNyronConfig(context: Context<'pull_request'>, pr: { owner: string; repo: string }) {
    // (1) Read nyron.config.ts file
    const nyronConfig = await context.octokit.repos.getContent({
      owner: pr.owner,
      repo: pr.repo,
      path: "nyron.config.ts",
    });
  
    // (2) Validate
    if (!("content" in nyronConfig.data) || typeof nyronConfig.data.content !== "string") {
      throw new Error("nyron.config.ts not found or is not a file");
    }
  
    // (3) Parse config file
    return parseConfig(nyronConfig.data.content, false);
  }