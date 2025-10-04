import { defineConfig } from "@nyron/cli/src/config"

export default defineConfig({
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
  },
  autoChangelog: true,
  onPushReminder: true,
})
