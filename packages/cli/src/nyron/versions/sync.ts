/**
 * @fileoverview Version synchronization utilities.
 * 
 * This module provides functionality to synchronize package version increments
 * between the meta version system and the versions file system.
 */

import type { BumpType } from "../../core/types";
import type { PackageInfo } from "./schema";
import { writeVersions } from "./writer";
import { bumpMetaVersionOfPrefix } from "../meta/writer";

/**
 * Synchronizes a version increment for a package prefix.
 * 
 * This function performs a version bump for the specified prefix and bump type,
 * then records the new version information in the versions file. The function
 * coordinates between the meta version system and the versions tracking system
 * to ensure consistency.
 * 
 * @async
 * @function syncincrementVersion
 * @param {string} prefix - The package prefix/identifier to bump the version for
 * @param {BumpType} type - The type of version bump to perform (major, minor, patch, etc.)
 * @returns {Promise<void>} A promise that resolves when the version has been incremented and recorded
 * @throws {Error} If the meta version bump fails or the versions file cannot be written
 * 
 * @example
 * ```typescript
 * // Bump patch version for a package
 * await syncincrementVersion("my-package", "patch")
 * 
 * // Bump major version for a package
 * await syncincrementVersion("my-package", "major")
 * ```
 */
export async function syncincrementVersion(prefix: string, type: BumpType) {
    const version = await bumpMetaVersionOfPrefix(prefix, type)
    const packageInfo: PackageInfo = {
        prefix: prefix,
        version: version,
        lastPublished: undefined
    }
    await writeVersions(prefix, packageInfo)
}