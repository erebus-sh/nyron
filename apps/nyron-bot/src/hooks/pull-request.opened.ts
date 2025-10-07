import { parseConfig } from "@nyron/cli/config";
import { Context } from "probot";
import { extractPrInfo } from "../utils/extractPrInfo.js";

export async function pullRequestOpened(context: Context<"pull_request.opened">) {
    const pr = extractPrInfo(context.payload);
  
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
    const config = parseConfig(nyronConfig.data.content, false);
  
    const entries = Object.entries(config.projects);
  
    for (const [name, project] of entries) {
      const path = project.path;
      const prefix = project.tagPrefix;
      console.log(`Project: ${name}, Path: ${path}, Prefix: ${prefix}`);
    }
  }
  