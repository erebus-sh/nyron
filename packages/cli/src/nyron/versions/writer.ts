/**
 * @fileoverview Writer functions for the versions file system.
 * 
 * This module provides functionality to write and update the versions file,
 * maintaining package version history and metadata.
 */

import path from "path"
import { writeFile } from "../../core/files"
import { readVersions } from "./reader"
import { VERSIONS_ROOT_PATH } from "./file-parser"
import type { PackageInfo } from "./schema"

/**
 * Writes a new package version entry to the versions file.
 * 
 * This function reads the current versions file, adds a new package version entry
 * for the specified prefix, and writes the updated data back to the file.
 * If the prefix doesn't exist in the versions file, it will be initialized as
 * an empty array before adding the new entry.
 * 
 * @async
 * @function writeVersions
 * @param {string} prefix - The package prefix/identifier to add version info for
 * @param {PackageInfo} packageInfo - The package version information to store
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the versions file cannot be read or written
 * 
 * @example
 * ```typescript
 * const packageInfo = {
 *   prefix: "my-package",
 *   version: "1.2.3",
 *   lastPublished: new Date()
 * }
 * await writeVersions("my-package", packageInfo)
 * ```
 */
export async function writeVersions(prefix: string, packageInfo: PackageInfo) {
    const versions = await readVersions()
    
    // Initialize the prefix array if it doesn't exist
    if (!versions.packages[prefix]) {
        versions.packages[prefix] = []
    }
    
    // Add the new package info to the array
    versions.packages[prefix].push(packageInfo)
    
    // Write back to file
    const versionsPath = path.join(process.cwd(), VERSIONS_ROOT_PATH)
    await writeFile(versionsPath, JSON.stringify(versions, null, 2))
}

/**
 * Initializes the versions file with default values.
 * 
 * This function writes the default versions data to the versions file (`.nyron/versions.json`).
 * 
 * @async
 * @function initVersions
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the file cannot be written
 */
export async function initVersions() {
    const versionsPath = path.join(process.cwd(), VERSIONS_ROOT_PATH)
    await writeFile(versionsPath, JSON.stringify({
        createdAt: new Date(),
        packages: {}
    }, null, 2))
}