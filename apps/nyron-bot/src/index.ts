import { Probot } from "probot";
import { pullRequestOpened } from "./hooks/pull-request.opened.js";
import { pullRequestSynchronize } from "./hooks/pull-request.synchronize.js";

export default (app: Probot) => {
  app.on("pull_request.opened", async (context) => pullRequestOpened(context));
  app.on("pull_request.synchronize", async (context) => pullRequestSynchronize(context));
};
