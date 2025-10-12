import semver from "semver"
import { isBeta } from "../core/semver"

export interface TagParts {
  prefix: string
  version: string
  prerelease: boolean
}

/**
 * Parses a tag string into its prefix and version components.
 *
 * For example:
 * - "@erebus-sh/sdk@0.0.179" → { prefix: "@erebus-sh/sdk@", version: "0.0.179" }
 * - "sdk@0.0.179" → { prefix: "sdk@", version: "0.0.179" }
 *
 * @param {string} tag - The tag string to parse (e.g., "@scope/pkg@1.2.3").
 * @returns {TagParts | null} An object containing the prefix and version if parsing succeeds, or `null` if the tag does not contain an "@".
 * @throws {Error} If the version part is not a valid semantic version.
 */
export function parseTag(tag: string): TagParts | null {
  // Split at the *last* @ in case prefix also has @ (like scoped packages)
  const lastAt = tag.lastIndexOf("@")
  if (lastAt === -1) return null

  const prefix = tag.slice(0, lastAt + 1)
  const version = tag.slice(lastAt + 1)

  // Validate with semver — this is bulletproof
  if (!semver.valid(version)) {
    throw new Error(`Invalid semantic version in tag: ${tag}\n   → Version must follow semver format (e.g., 1.0.0)`)
  }

  const prerelease = isBeta(version)

  return { prefix, version, prerelease }
}

/**
 * Constructs a tag string from a prefix and a semantic version.
 *
 * For example:
 * - ("@erebus-sh/sdk@", "0.0.180") → "@erebus-sh/sdk@0.0.180"
 *
 * @param {string} prefix - The tag prefix, including the trailing "@" (e.g., "@scope/pkg@").
 * @param {string} version - The semantic version string (e.g., "1.2.3").
 * @returns {string} The combined tag string.
 * @throws {Error} If the version is not a valid semantic version.
 */
export function buildTag(prefix: string, version: string): string {
  if (!semver.valid(version)) {
    throw new Error(`Invalid semantic version: ${version}\n   → Version must follow semver format (e.g., 1.0.0)`)
  }

  return `${prefix}${version}`
}


/**
 * Generates a specialized Nyron release tag for triggering automated actions.
 * 
 * This tag format is used to trigger automated workflows that will:
 * - Extract and process the .nyron/ directory
 * - Generate changelogs and version information
 * - Handle release automation tasks
 *
 * @example
 * ```typescript
 * generateNyronReleaseTag()
 * // Returns: "nyron-release@2024-01-15@14:30:25.123Z"
 * ```
 *
 * @returns {string} A formatted Nyron release tag string with current timestamp.
 */
export function generateNyronReleaseTag(): string {
  const date = new Date().toISOString().replace("T", "@").replace("Z", "")
  return `nyron-release@${date}`
}