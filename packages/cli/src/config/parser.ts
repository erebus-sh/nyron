import { pathToFileURL } from "url"
import { resolve } from "path"
import type { NyronConfig } from "./types"
import { validateConfig } from "./validator"

/**
 * Parse configuration from a raw string containing TypeScript/JavaScript code
 * 
 * This is useful for parsing configuration from GitHub API responses or other
 * sources where the config is provided as a string.
 * 
 * @param content - Raw string content of the configuration
 * @returns Parsed and validated configuration
 * 
 * @example
 * ```typescript
 * const configString = `
 *   export default {
 *     repo: "owner/repo",
 *     projects: { ... }
 *   }
 * `
 * const config = await parseConfigFromString(configString)
 * ```
 */
export async function parseConfigFromString(content: string): Promise<NyronConfig> {
  try {
    // For base64 encoded content (GitHub API)
    let decoded = content
    try {
      decoded = Buffer.from(content, "base64").toString("utf-8")
    } catch {
      // If it's not base64, use as-is
      decoded = content
    }

    // Create a temporary data URL
    const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(decoded)}`
    
    // Import the module
    const module = await import(dataUrl)
    const config = module.default || module

    // Validate
    validateConfig(config)
    return config
  } catch (error) {
    throw new Error(
      `Failed to parse configuration from string: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/**
 * Parse configuration from a file URL
 * 
 * This is useful when you have a file path and want to use pathToFileURL
 * for proper ES module import.
 * 
 * @param fileUrl - File URL (can be string or URL object)
 * @returns Parsed and validated configuration
 * 
 * @example
 * ```typescript
 * import { pathToFileURL } from "url"
 * 
 * const filePath = "/path/to/nyron.config.ts"
 * const config = await parseConfigFromFileURL(pathToFileURL(filePath))
 * ```
 */
export async function parseConfigFromFileURL(
  fileUrl: URL | string
): Promise<NyronConfig> {
  try {
    const url = typeof fileUrl === "string" ? fileUrl : fileUrl.href
    const module = await import(url)
    const config = module.default || module

    // Validate
    validateConfig(config)
    return config
  } catch (error) {
    throw new Error(
      `Failed to parse configuration from file URL: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/**
 * Parse configuration from a file path
 * 
 * Automatically converts the path to a file URL for proper ES module import.
 * 
 * @param filepath - Absolute or relative file path
 * @returns Parsed and validated configuration
 * 
 * @example
 * ```typescript
 * const config = await parseConfigFromPath("./nyron.config.ts")
 * ```
 */
export async function parseConfigFromPath(filepath: string): Promise<NyronConfig> {
  try {
    const absolutePath = resolve(filepath)
    const fileUrl = pathToFileURL(absolutePath)
    return await parseConfigFromFileURL(fileUrl)
  } catch (error) {
    throw new Error(
      `Failed to parse configuration from path "${filepath}": ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/**
 * Parse configuration from a JSON string
 * 
 * @param json - JSON string containing configuration
 * @returns Parsed and validated configuration
 * 
 * @example
 * ```typescript
 * const configJson = '{"repo":"owner/repo","projects":{}}'
 * const config = parseConfigFromJSON(configJson)
 * ```
 */
export function parseConfigFromJSON(json: string): NyronConfig {
  try {
    const config = JSON.parse(json)
    validateConfig(config)
    return config
  } catch (error) {
    throw new Error(
      `Failed to parse configuration from JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/**
 * Parse configuration from a plain object
 * 
 * Validates the object and returns it as a typed NyronConfig.
 * 
 * @param obj - Plain object to validate as configuration
 * @returns Validated configuration
 * 
 * @example
 * ```typescript
 * const configObj = {
 *   repo: "owner/repo",
 *   projects: { cli: { tagPrefix: "v", path: "." } }
 * }
 * const config = parseConfigFromObject(configObj)
 * ```
 */
export function parseConfigFromObject(obj: unknown): NyronConfig {
  validateConfig(obj)
  return obj
}

