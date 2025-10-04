import { resolve } from "path"
import { pathToFileURL } from "url"
import { existsSync } from "fs"

export async function loadConfig() {
  const configFile = resolve(process.cwd(), "nyron.config.ts")
  
  if (!existsSync(configFile)) {
    console.error("❌ nyron.config.ts not found in current directory.")
    process.exit(1)
  }

  try {
    const configModule = await import(pathToFileURL(configFile).href)
    const config = configModule.default

    if (!config || !config.projects) {
      console.error("❌ Invalid nyron.config.ts — missing 'projects' field.")
      process.exit(1)
    }

    console.log("✅ Loaded nyron config")
    return config
  } catch (err) {
    console.error("❌ Failed to load nyron.config.ts:", err)
    process.exit(1)
  }
}
