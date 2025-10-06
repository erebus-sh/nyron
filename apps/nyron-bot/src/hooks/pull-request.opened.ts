import { Context } from "probot";
import { extractPrInfo } from "../utils/extractPrInfo.js";
import { parseConfig } from "@nyron/cli/config";

export async function pullRequestOpened(context: Context<"pull_request.opened">) {
    const pr = extractPrInfo(context.payload);

    // 1) Open the nyron.config.ts file
    const nyronConfig = await context.octokit.repos.getContent({
        owner: pr.owner,
        repo: pr.repo,
        path: "nyron.config.ts",
    });

    // nyronConfig.data can be an object (file) or array (dir listing)
    if (!("content" in nyronConfig.data) || typeof nyronConfig.data.content !== "string") {
        throw new Error("nyron.config.ts not found or is not a file");
    }

    const config = parseConfig(nyronConfig.data.content, true);

    const entries = Object.entries(config.projects);

    for (const [name, project] of entries) {
        const path = project.path;
        const prefix = project.tagPrefix;
    }
}