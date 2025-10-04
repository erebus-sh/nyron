import { defineConfig } from "@nyron/cli/config"

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
