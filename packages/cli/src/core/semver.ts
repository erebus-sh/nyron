// Semver parser
// It only parse versions
// Determine the next version
// Determine who is bigger and smaller 0.0.0 > 0.0.1
// Determic if in beta or not
// Handle patching, minor, major extact bumping
import semver from "semver"

/**
 * Increments a semantic version string according to the specified release type.
 *
 * This function leverages the `semver` library to accurately bump a version string,
 * supporting standard release types ("major", "minor", "patch") as well as prerelease increments.
 * When `isPrerelease` is set to `true`, the version is incremented to the next prerelease with the "beta" identifier,
 * following semantic versioning best practices.
 *
 * @param {string} version - The current semantic version string (e.g., "0.1.2").
 * @param {"major"|"minor"|"patch"} type - The type of version increment to perform.
 * @param {boolean} [isPrerelease=false] - If true, increments to the next "beta" prerelease version.
 * @returns {string} The incremented semantic version string.
 *
 * @example
 * bumpVersion("0.1.2", "patch") // "0.1.3"
 * bumpVersion("0.1.2", "major") // "1.0.0"
 * bumpVersion("0.1.2", "patch", true) // "0.1.3-beta.0"
 */
export function bumpVersion(
  version: string,
  type: "major" | "minor" | "patch" | "prerelease",
): string {
  if (type === "prerelease") {
    // For prerelease, bump the prerelease number or start a new beta prerelease
    return semver.inc(version, type, "beta")!;
  } else {
    // For major, minor, patch, bump normally
    return semver.inc(version, type)!;
  }
}

/**
 * Determines if version `a` is strictly newer (greater) than version `b` according to semantic versioning rules.
 *
 * This function leverages the `semver` library to accurately compare two version strings,
 * including handling of prerelease and build metadata. It is ideal for workflows where
 * you need to enforce upgrade paths or validate version progressions.
 *
 * @param {string} a - The candidate version to test as "newer".
 * @param {string} b - The reference version to compare against.
 * @returns {boolean} Returns `true` if `a` is newer than `b`, otherwise `false`.
 *
 * @example
 * isNewer("0.2.0", "0.1.2") // true
 * isNewer("1.0.0-beta.1", "1.0.0-alpha.5") // true
 * isNewer("1.0.0", "1.0.0") // false
 */
export function isNewer(a: string, b: string): boolean {
  return semver.gt(a, b);
}

/**
 * Determines if version `a` is strictly older (less) than version `b` according to semantic versioning rules.
 *
 * This function leverages the `semver` library to accurately compare two version strings,
 * including handling of prerelease and build metadata. It is ideal for workflows where
 * you need to enforce downgrade paths or validate version regressions.
 *
 * @param {string} a - The candidate version to test as "older".
 * @param {string} b - The reference version to compare against.
 * @returns {boolean} Returns `true` if `a` is older than `b`, otherwise `false`.
 *
 * @example
 * isOlder("0.1.2", "0.2.0") // true
 * isOlder("1.0.0-alpha.5", "1.0.0-beta.1") // true
 * isOlder("1.0.0", "1.0.0") // false
 */
export function isOlder(a: string, b: string): boolean {
  return semver.lt(a, b);
}

/**
 * Checks if a given semantic version string represents a beta prerelease.
 *
 * This function parses the version and inspects its prerelease identifiers,
 * returning `true` if any part of the prerelease contains the substring "beta"
 * (case-insensitive). Useful for gating features or workflows on beta releases.
 *
 * @param {string} version - The semantic version string to check.
 * @returns {boolean} Returns `true` if the version is a beta prerelease, otherwise `false`.
 *
 * @example
 * isBeta("1.0.0-beta.2") // true
 * isBeta("1.0.0-alpha.1") // false
 * isBeta("1.0.0") // false
 */
export function isBeta(version: string): boolean {
    const parsed = semver.parse(version);
    if (!parsed) return false;
    if (parsed.prerelease && parsed.prerelease.length > 0) {
        return parsed.prerelease.some((part) =>
            typeof part === "string" && part.toLowerCase().includes("beta")
        );
    }
    return false;
}

/**
 * Transitions a stable semantic version into its corresponding beta prerelease.
 *
 * If the provided version is already a prerelease (e.g., "0.1.3-beta.0"), it is returned unchanged.
 * Otherwise, the function increments the patch version and appends a "beta.0" prerelease tag,
 * following the standard semver convention (e.g., "0.1.2" becomes "0.1.3-beta.0").
 *
 * @param {string} version - The semantic version string to convert to a beta prerelease.
 * @returns {string} The beta prerelease version, or the original version if already a prerelease.
 *
 * @example
 * EnterBeta("0.1.2") // returns "0.1.3-beta.0"
 * EnterBeta("1.0.0-beta.2") // returns "1.0.0-beta.2"
 */
export function enterBeta(version: string): string {
    const parsed = semver.parse(version);

    // If already a prerelease, return as-is
    if (parsed?.prerelease && parsed.prerelease.length > 0) {
        return version;
    }

    // Otherwise, increment to next patch and add beta prerelease
    return semver.inc(version, 'prerelease', 'beta')!;
}