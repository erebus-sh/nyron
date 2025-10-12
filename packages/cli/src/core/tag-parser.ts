import semver from "semver"
import { isBeta } from "../core/semver"

export interface TagParts {
  prefix: string
  version: string
  prerelease: boolean
}

export const NYRON_RELEASE_PREFIX = "nyron-release"

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
 * Parses a Nyron release tag and extracts the date information.
 * 
 * @param {string} tag - The Nyron release tag to parse (e.g., "nyron-release@2024-01-15@14:30:25.123").
 * @returns {Date | null} The parsed Date object if the tag is valid, or null if parsing fails.
 * 
 * @example
 * ```typescript
 * parseNyronReleaseTag("nyron-release@2024-01-15@14:30:25.123")
 * // Returns: Date object representing 2024-01-15T14:30:25.123Z
 * 
 * parseNyronReleaseTag("invalid-tag")
 * // Returns: null
 * ```
 */
export function parseNyronReleaseTag(tag: string): Date | null {
  // Check if tag starts with the expected prefix
  if (!tag.startsWith(`${NYRON_RELEASE_PREFIX}@`)) {
    return null
  }

  // Extract the date part after the prefix
  const datePart = tag.slice(NYRON_RELEASE_PREFIX.length + 1) // +1 for the "@"
  
  // Convert back to ISO format by replacing "@" with "T" and adding "Z"
  const isoString = datePart.replace("@", "T") + "Z"
  
  // Parse the date and validate
  const date = new Date(isoString)
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return null
  }
  
  return date
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
 * // Returns: "nyron-release@2024-01-15@14:30:25.123"
 * ```
 *
 * @returns {string} A formatted Nyron release tag string with current timestamp.
 */
export function generateNyronReleaseTag(): string {
  const date = new Date().toISOString().replace("T", "@").replace("Z", "")
  return `${NYRON_RELEASE_PREFIX}@${date}`
}