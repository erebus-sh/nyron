import { resolve } from "path"
import { pathToFileURL } from "url"
import { existsSync } from "fs"
import type { NyronConfig } from "./config"

export async function loadConfig(): Promise<NyronConfig> {
  const configFile = resolve(process.cwd(), "nyron.config.ts")
  
  if (!existsSync(configFile)) {
    console.error("❌ nyron.config.ts not found in current directory.")
    process.exit(1)
  }

  try {
    const configModule = await import(pathToFileURL(configFile).href)
    const config = configModule.default as NyronConfig

    if (!config || !config.projects) {
      console.error("❌ Invalid nyron.config.ts — missing 'projects' field.")
      process.exit(1)
    }

    // Validate each project for tagPrefix and path
    for (const [name, project] of Object.entries(config.projects)) {
      if (!project.tagPrefix || !project.path) {
        console.error(
          `❌ Invalid nyron.config.ts — project "${name}" is missing required 'tagPrefix' or 'path' field.`
        )
        throw new Error(
          `Project "${name}" in nyron.config.ts must have both 'tagPrefix' and 'path' fields.`
        )
      }
    }

    console.log("✅ Loaded nyron config")
    return config
  } catch (err) {
    console.error("❌ Failed to load nyron.config.ts:", err)
    process.exit(1)
  }
}
