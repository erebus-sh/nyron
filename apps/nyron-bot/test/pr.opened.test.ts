import nock from "nock"
import { Probot, ProbotOctokit } from "probot"
import myApp from "../src/index.js"
import payload from "./fixtures/pull_request.opened.json" with { type: "json" }
import { describe, beforeEach, afterEach, it, expect } from "vitest";

// TODO: Complete the tests
describe("pull_request.opened event", () => {
  let probot

  beforeEach(() => {
    nock.disableNetConnect()

    probot = new Probot({
      githubToken: "test",
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    })

    myApp(probot)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it("should comment on PR when opened", async () => {
    // Mock access token exchange
    nock("https://api.github.com")
      .post("/app/installations/2/access_tokens")
      .reply(200, { token: "test" })

    // Mock expected GitHub API call
    nock("https://api.github.com")
      .post("/repos/v0id-user/nyron-test-repo/issues/1/comments", (body) => {
        expect(body).toMatchObject({
          body: expect.stringContaining("Thanks for opening this PR"),
        })
        return true
      })
      .reply(200)

    // Simulate webhook event
    await probot.receive({
      name: "pull_request.opened",
      payload,
    })
  })
})
