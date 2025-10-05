import { existsSync, writeFileSync } from "fs"
import path from "path"
import type { InitOptions } from "./types"
import { detectEnvironmentAndOfferInstall } from "../utils/detectEnvironment"

export async function init(options: InitOptions) {
  // TODO: Add json option and handle it
  const filename = "nyron.config.ts"
  const filepath = path.resolve(process.cwd(), filename)

  if (existsSync(filepath) && !options.force) {
    console.log(`⚠️  Configuration already exists: ${filename}`)
    console.log(`   → Use --force to overwrite`)
    return
  }

  // Detect environment and offer to install @nyron/cli
  await detectEnvironmentAndOfferInstall()

  const sample = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "owner/repo",
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
  console.log(`✅ Created ${filename}`)
  console.log(`   → Edit the file to configure your projects`)
}
