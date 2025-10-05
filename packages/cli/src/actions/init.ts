import { existsSync, writeFileSync } from "fs"
import path from "path"
import type { InitOptions } from "./types"
import { detectEnvironmentAndOfferInstall } from "../utils/detectEnvironment"

export async function init(options: InitOptions) {
  const filename = options.json ? "nyron.config.json" : "nyron.config.ts"
  const filepath = path.resolve(process.cwd(), filename)

  if (existsSync(filepath) && !options.force) {
    console.log(`⚠️ ${filename} already exists. Use --force to overwrite.`)
    return
  }

  // Detect environment and offer to install @nyron/cli
  await detectEnvironmentAndOfferInstall()

  const sample = options.json
    ? JSON.stringify(
        {
          projects: {
            "sdk": {
              tagPrefix: "@my-package/sdk@",
              path: "packages/sdk",
            },
            "service": {
              tagPrefix: "@my-package/service@",
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
      tagPrefix: "@my-package/sdk@",
      path: "packages/sdk",
    },
    service: {
      tagPrefix: "@my-package/service@",
      path: "apps/service",
    },
  },
  autoChangelog: true,
  onPushReminder: true,
})`

  writeFileSync(filepath, sample, "utf-8")
  console.log(`✅ Created ${filename} at ${filepath}`)
}
