import { existsSync, writeFileSync } from "fs"
import path from "path"
import type { InitOptions, InitResult } from "./types"
import { detectEnvironmentAndOfferInstall } from "../utils/detectEnvironment"
import { createNyronDirectory } from "../nyron/creator"

export async function init(options: InitOptions): Promise<InitResult> {
  const filename = "nyron.config.ts"
  const filepath = path.resolve(process.cwd(), filename)

  if (existsSync(filepath) && !options.force) {
    console.log(`⚠️  Configuration already exists: ${filename}`)
    console.log(`   → Use --force to overwrite`)
    return { created: false, filepath, overwritten: false }
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
})
`

  writeFileSync(filepath, sample, "utf-8")
  console.log(`✅ Created ${filename}`)
  console.log(`   → Edit the file to configure your projects`)

  // Create a .nyron/ directory
  await createNyronDirectory()


  return { created: true, filepath, overwritten: existsSync(filepath) && !!options.force }
}
