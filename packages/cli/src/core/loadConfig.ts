import { resolve } from "path"
import { pathToFileURL } from "url"
import { existsSync } from "fs"
import type { NyronConfig } from "./config"

export async function loadConfig(): Promise<NyronConfig> {
  const configFile = resolve(process.cwd(), "nyron.config.ts")
  
  if (!existsSync(configFile)) {
    console.error("❌ Configuration file not found: nyron.config.ts")
    console.error("   → Run 'nyron init' to create a configuration file")
    process.exit(1)
  }

  try {
    const configModule = await import(pathToFileURL(configFile).href)
    const config = configModule.default as NyronConfig

    if (!config || !config.projects) {
      console.error("❌ Invalid configuration: missing 'projects' field")
      console.error("   → Ensure nyron.config.ts exports a config with a 'projects' object")
      process.exit(1)
    }

    // Validate each project for tagPrefix and path
    for (const [name, project] of Object.entries(config.projects)) {
      if (!project.tagPrefix || !project.path) {
        console.error(
          `❌ Invalid project configuration: "${name}"`
        )
        console.error(
          `   → Project must have both 'tagPrefix' and 'path' fields`
        )
        throw new Error(
          `Project "${name}" in nyron.config.ts must have both 'tagPrefix' and 'path' fields.`
        )
      }
    }

    console.log("✅ Configuration loaded")
    return config
  } catch (err) {
    console.error("❌ Failed to load configuration file")
    console.error(`   → ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}
