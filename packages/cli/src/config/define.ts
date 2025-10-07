import type { NyronConfig } from "./types"

/**
 * Define a Nyron configuration with type safety
 * 
 * This helper provides autocomplete and type checking for configuration files.
 * 
 * @example
 * ```typescript
 * import { defineConfig } from "@nyron/cli/config"
 * 
 * export default defineConfig({
 *   repo: "owner/repo",
 *   projects: {
 *     cli: {
 *       tagPrefix: "cli-v",
 *       path: "packages/cli"
 *     }
 *   }
 * })
 * ```
 */
export const defineConfig = (config: NyronConfig): NyronConfig => config

