import nock from "nock"
import { Probot, ProbotOctokit } from "probot"
import myApp from "../src/index.js"
import pullRequestPayloadFixture from "./fixtures/pull_request.opened.json" with { type: "json" }
import { describe, beforeEach, afterEach, it, expect } from "vitest";


describe("pull_request.opened handler", () => {
  let probot

  beforeEach(() => {
    nock.disableNetConnect()
    probot = new Probot({
      githubToken: "test",
      Octokit: ProbotOctokit.defaults({ retry: { enabled: false }, throttle: { enabled: false } }),
    })
    myApp(probot)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it("reads nyron.config.ts and parses projects", async () => {
    // 1️⃣ Mock app installation token
    nock("https://api.github.com")
      .post("/app/installations/88979653/access_tokens")
      .reply(200, { token: "test" })

    // 2️⃣ Mock nyron.config.ts response
    const fakeConfig = `
      export default {
        projects: {
          core: { path: "packages/core", tagPrefix: "core@" },
          cli: { path: "packages/cli", tagPrefix: "cli@" }
        }
      }
    `
    const base64Config = Buffer.from(fakeConfig).toString("base64")

    nock("https://api.github.com")
      .get("/repos/v0id-user/nyron-1-test-repo/contents/nyron.config.ts")
      .reply(200, {
        content: base64Config,
        encoding: "base64",
      })


      // 4️⃣ Run webhook simulation
    await probot.receive({ name: "pull_request.opened", pullRequestPayloadFixture })
  })
})
