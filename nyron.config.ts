import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
  },
  autoChangelog: false,
  onPushReminder: false,
})
