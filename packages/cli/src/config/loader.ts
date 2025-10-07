import { cosmiconfig, cosmiconfigSync } from "cosmiconfig"
import { resolve } from "path"
import type { NyronConfig, LoadConfigOptions, LoadConfigResult } from "./types"
import { validateConfig } from "./validator"

const MODULE_NAME = "nyron"

/**
 * Create a cosmiconfig explorer for Nyron configuration
 */
function createExplorer() {
  return cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      "nyron.config.ts",
      "nyron.config.js",
      "nyron.config.mjs",
      "nyron.config.cjs",
      ".nyronrc.ts",
      ".nyronrc.js",
      ".nyronrc.json",
      ".nyronrc",
      "package.json",
    ],
    loaders: {
      ".ts": async (filepath: string) => {
        // Use dynamic import for TypeScript files
        const { pathToFileURL } = await import("url")
        const module = await import(pathToFileURL(filepath).href)
        return module.default || module
      },
    },
  })
}

/**
 * Create a synchronous cosmiconfig explorer
 */
function createExplorerSync() {
  return cosmiconfigSync(MODULE_NAME, {
    searchPlaces: [
      "nyron.config.js",
      "nyron.config.cjs",
      ".nyronrc.js",
      ".nyronrc.json",
      ".nyronrc",
      "package.json",
    ],
  })
}

/**
 * Load Nyron configuration asynchronously using cosmiconfig
 * 
 * This function searches for configuration in multiple locations and formats:
 * - nyron.config.{ts,js,mjs,cjs}
 * - .nyronrc.{ts,js,json}
 * - .nyronrc (JSON or YAML)
 * - package.json (nyron field)
 * 
 * @param options - Configuration loading options
 * @returns The loaded and validated configuration
 * 
 * @example
 * ```typescript
 * const { config, filepath } = await loadConfig()
 * console.log(`Loaded config from: ${filepath}`)
 * ```
 */
export async function loadConfig(
  options: LoadConfigOptions = {}
): Promise<LoadConfigResult> {
  const {
    searchFrom = process.cwd(),
    required = true,
  } = options

  const explorer = createExplorer()
  const result = await explorer.search(searchFrom)

  if (!result) {
    if (required) {
      console.error("❌ Configuration file not found")
      console.error("   → Run 'nyron init' to create a configuration file")
      console.error(`   → Searched from: ${searchFrom}`)
      process.exit(1)
    }
    throw new Error("Configuration file not found")
  }

  try {
    // Validate the configuration
    validateConfig(result.config)

    console.log(`✅ Configuration loaded from: ${result.filepath}`)
    
    return {
      config: result.config,
      filepath: result.filepath,
      isEmpty: result.isEmpty || false,
    }
  } catch (error) {
    console.error("❌ Failed to validate configuration")
    console.error(`   → File: ${result.filepath}`)
    if (error instanceof Error) {
      console.error(`   → ${error.message}`)
    }
    process.exit(1)
  }
}

/**
 * Load Nyron configuration synchronously
 * 
 * Note: This only supports JS/JSON formats, not TypeScript.
 * Use the async loadConfig() for TypeScript support.
 * 
 * @param options - Configuration loading options
 * @returns The loaded and validated configuration
 */
export function loadConfigSync(
  options: LoadConfigOptions = {}
): LoadConfigResult {
  const {
    searchFrom = process.cwd(),
    required = true,
  } = options

  const explorer = createExplorerSync()
  const result = explorer.search(searchFrom)

  if (!result) {
    if (required) {
      console.error("❌ Configuration file not found")
      console.error("   → Run 'nyron init' to create a configuration file")
      console.error(`   → Searched from: ${searchFrom}`)
      process.exit(1)
    }
    throw new Error("Configuration file not found")
  }

  try {
    // Validate the configuration
    validateConfig(result.config)

    console.log(`✅ Configuration loaded from: ${result.filepath}`)
    
    return {
      config: result.config,
      filepath: result.filepath,
      isEmpty: result.isEmpty || false,
    }
  } catch (error) {
    console.error("❌ Failed to validate configuration")
    console.error(`   → File: ${result.filepath}`)
    if (error instanceof Error) {
      console.error(`   → ${error.message}`)
    }
    process.exit(1)
  }
}

/**
 * Load configuration from a specific file path
 * 
 * @param filepath - Absolute or relative path to config file
 * @returns The loaded and validated configuration
 */
export async function loadConfigFromFile(filepath: string): Promise<NyronConfig> {
  const explorer = createExplorer()
  const absolutePath = resolve(filepath)
  
  try {
    const result = await explorer.load(absolutePath)
    
    if (!result) {
      throw new Error(`Configuration file not found: ${absolutePath}`)
    }

    validateConfig(result.config)
    return result.config
  } catch (error) {
    console.error(`❌ Failed to load configuration from: ${absolutePath}`)
    if (error instanceof Error) {
      console.error(`   → ${error.message}`)
    }
    throw error
  }
}

/**
 * Clear the configuration cache
 * 
 * Useful for testing or when you need to reload configuration
 */
export function clearConfigCache(): void {
  const explorer = createExplorer()
  explorer.clearCaches()
}

