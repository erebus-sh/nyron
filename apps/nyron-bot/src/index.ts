import { Probot } from "probot";
import { pullRequestOpened } from "./hooks/pull-request.opened.js";

export default (app: Probot) => {
  app.on("pull_request.opened", async (context) => pullRequestOpened(context));
};
