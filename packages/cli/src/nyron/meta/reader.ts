/**
 * @fileoverview Reader functions for the meta file system.
 * 
 * This module provides functionality to read and parse the meta file,
 * which contains high-level project metadata and package information.
 */

import path from "path"
import { readFile } from "../../core/files"
import { MetaSchema, type Meta } from "./schema"

/**
 * Reads and parses the meta file from the project root.
 * 
 * This function loads the meta file (`.nyron/meta.json`), parses its JSON content,
 * and validates it against the MetaSchema to ensure data integrity.
 * 
 * @async
 * @function readMeta
 * @returns {Promise<Meta>} A promise that resolves to the parsed and validated meta data
 * @throws {Error} If the file cannot be read or the JSON is invalid
 * @throws {ValidationError} If the parsed data doesn't match the MetaSchema
 * 
 * @example
 * ```typescript
 * const meta = await readMeta()
 * console.log(meta.createdAt) // Project creation date
 * console.log(meta.packages) // Array of package definitions
 * console.log(meta.latestTag) // Latest release tag or undefined
 * ```
 */
export async function readMeta(): Promise<Meta> {
    const metaPath = path.join(process.cwd(), ".nyron", "meta.json")
    const meta = await readFile(metaPath)
    return MetaSchema.assert(JSON.parse(meta))
}