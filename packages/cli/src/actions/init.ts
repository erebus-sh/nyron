import { existsSync, writeFileSync } from "fs"
import path from "path"
import type { InitOptions } from "./types"

export async function init(options: InitOptions) {
  const filename = options.json ? "nyron.config.json" : "nyron.config.ts"
  const filepath = path.resolve(process.cwd(), filename)

  if (existsSync(filepath) && !options.force) {
    console.log(`⚠️ ${filename} already exists. Use --force to overwrite.`)
    return
  }

  const sample = options.json
    ? JSON.stringify(
        {
          projects: {
            "sdk": {
              tagPrefix: "@erebus-sh/sdk@",
              path: "packages/sdk",
            },
            "service": {
              tagPrefix: "@erebus-sh/service@",
              path: "apps/service",
            },
          },
          autoChangelog: true,
          onPushReminder: true,
        },
        null,
        2
      )
    : `import { defineConfig } from "@nyron/cli"

export default defineConfig({
  projects: {
    sdk: {
      tagPrefix: "@erebus-sh/sdk@",
      path: "packages/sdk",
    },
    service: {
      tagPrefix: "@erebus-sh/service@",
      path: "apps/service",
    },
  },
  autoChangelog: true,
  onPushReminder: true,
})`

  writeFileSync(filepath, sample, "utf-8")
  console.log(`✅ Created ${filename} at ${filepath}`)
}
