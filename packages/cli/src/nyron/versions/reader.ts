/**
 * @fileoverview Reader functions for the versions file system.
 * 
 * This module provides functionality to read and parse the versions file,
 * which contains package version information and metadata.
 */

import path from "path"
import { readFile } from "../../core/files"
import { VERSIONS_ROOT_PATH } from "./file-parser"
import { VersionsSchema, type Versions } from "./schema"

/**
 * Reads and parses the versions file from the project root.
 * 
 * This function loads the versions file (`.nyron/versions.json`), parses its JSON content,
 * and validates it against the VersionsSchema to ensure data integrity.
 * 
 * @async
 * @function readVersions
 * @returns {Promise<Versions>} A promise that resolves to the parsed and validated versions data
 * @throws {Error} If the file cannot be read or the JSON is invalid
 * @throws {ValidationError} If the parsed data doesn't match the VersionsSchema
 * 
 * @example
 * ```typescript
 * const versions = await readVersions()
 * console.log(versions.createdAt) // ISO timestamp
 * console.log(versions.packages) // Object mapping prefixes to version arrays
 * ```
 */
export async function readVersions(): Promise<Versions> {
    const versionsPath = path.join(process.cwd(), VERSIONS_ROOT_PATH)
    const versions = await readFile(versionsPath)
    return VersionsSchema.assert(JSON.parse(versions))
}