
import { Context } from "probot";
import { extractPrInfo } from "../utils/extractPrInfo.js";
import { getParsedNyronConfig } from "../utils/getParsedNyronConfig.js";


export async function pullRequestSynchronize(context: Context<"pull_request">) {
  const pr = extractPrInfo(context.payload.pull_request);

  const config = await getParsedNyronConfig(context, pr);

  const entries = Object.entries(config.projects);

  for (const [name, project] of entries) {
    const path = project.path;
    const prefix = project.tagPrefix;
    console.log(`Project: ${name}, Path: ${path}, Prefix: ${prefix}`);
  }
}
