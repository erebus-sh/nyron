import { parseConfigFromString } from "@nyron/cli/config/parser";
import { NyronConfig } from "@nyron/cli/config/types";
import { Context } from "probot";

/**
 * Retrieves and parses the Nyron configuration file from a GitHub repository.
 * 
 * This function orchestrates the complete workflow of fetching, validating, and parsing
 * the repository's Nyron configuration. It handles the complexities of GitHub API interactions
 * and provides robust error handling for common configuration scenarios. The function ensures
 * that only valid configuration files are processed and returns a fully parsed configuration
 * object ready for use throughout the application.
 * 
 * @param context - The Probot context object providing authenticated GitHub API access
 *                  and repository context for the current pull request event
 * @param pr - Repository identification object containing owner and repository name
 *             used to locate the configuration file in the target repository
 * 
 * @returns A fully parsed Nyron configuration object containing all validated settings
 *          and options for the repository. The configuration is ready for immediate use
 *          in bot operations, changelog generation, and release management workflows.
 * 
 * @throws {Error} When the nyron.config.ts file cannot be found in the repository root
 * @throws {Error} When the configuration file exists but is not a valid text file
 * @throws {Error} When the configuration file contains invalid syntax or configuration options
 * @throws {Error} When GitHub API authentication fails or repository access is denied
 * 
 * @example
 * ```typescript
 * // In a pull request webhook handler
 * const context = new Context(event, github, log);
 * const prInfo = { owner: "myorg", repo: "myrepo" };
 * 
 * try {
 *   const config = await getParsedNyronConfig(context, prInfo);
 *   console.log(`Processing with config:`, config);
 * } catch (error) {
 *   console.error('Configuration error:', error.message);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // With error handling for missing configuration
 * const config = await getParsedNyronConfig(context, prInfo)
 *   .catch(error => {
 *     if (error.message.includes('not found')) {
 *       return getDefaultConfig();
 *     }
 *     throw error;
 *   });
 * ```
 * 
 * @category Configuration Management
 */
export async function getParsedNyronConfig(
  context: Context<'pull_request'>, 
  pr: { owner: string; repo: string }
): Promise<NyronConfig> {
  // Step 1: Retrieve the configuration file from the repository
  // We fetch the nyron.config.ts file directly from the repository root using
  // the GitHub API, which provides authenticated access to the repository contents
  const nyronConfig = await context.octokit.repos.getContent({
    owner: pr.owner,
    repo: pr.repo,
    path: "nyron.config.ts",
  });

  // Step 2: Validate the retrieved content
  // GitHub API returns different data structures depending on whether the path
  // points to a file or directory, so we need to ensure we have valid file content
  if (!("content" in nyronConfig.data) || typeof nyronConfig.data.content !== "string") {
    throw new Error(
      `Configuration file not accessible: nyron.config.ts either does not exist in the repository root or is not a valid text file. ` +
      `Please ensure the file exists at the repository root and contains valid TypeScript configuration.`
    );
  }

  // Step 3: Parse and validate the configuration content
  // Ensure the content is base64-encoded before passing to the parser for consistent behavior
  let configContent = nyronConfig.data.content;
  // Check if it's already base64 (simple heuristic: valid base64 and decodes to something plausible)
  function isBase64(str: string) {
    // Base64 strings are typically longer, and only contain A-Z, a-z, 0-9, +, /, =
    // This is a loose check, not cryptographically strict
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(str)) return false;
    try {
      // Try decoding and see if it doesn't throw
      const decoded = Buffer.from(str, "base64").toString("utf-8");
      // If decoding and re-encoding matches (ignoring padding), it's likely base64
      return Buffer.from(decoded, "utf-8").toString("base64").replace(/=+$/, "") === str.replace(/=+$/, "");
    } catch {
      return false;
    }
  }

  if (!isBase64(configContent)) {
    configContent = Buffer.from(configContent, "utf-8").toString("base64");
  }

  const config = await parseConfigFromString(configContent);
  
  return config;
}