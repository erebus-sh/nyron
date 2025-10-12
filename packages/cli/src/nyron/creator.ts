import path from "path"
import { CHANGELOG_ROOT_PATH } from "./changelog/file-parser"
import { META_ROOT_PATH } from "./meta/file-parser"
import { VERSIONS_ROOT_PATH } from "./versions/file-parser"
import { fileExists, folderExists, writeFile } from "../core/files"
import { mkdir } from "fs/promises"
import { setMetaCreatedAt } from "./meta/writer"

/**
 * Initializes the Nyron workspace by creating the required directory structure and metadata files.
 *
 * Structure created:
 *   - .nyron/
 *     - changelog/
 *     - meta.json
 *     - versions.json
 *
 * This function will create missing directories/files if they do not exist yet.
 * Repeated calls will not throw if files/directories already exist.
 *
 * @example
 * createNyronDirectory()
 */
export async function createNyronDirectory(): Promise<void> {
    const cwd = process.cwd();
    const nyronDir = path.resolve(cwd, ".nyron");
    const changelogDir = path.resolve(cwd, CHANGELOG_ROOT_PATH);
    const metaFile = path.resolve(cwd, META_ROOT_PATH);
    const versionsFile = path.resolve(cwd, VERSIONS_ROOT_PATH);

    // Guard: check if everything already exists
    let ready = true;
    try {
        // .nyron directory
        if (!await folderExists(nyronDir)) ready = false;
        // changelog directory
        if (!await folderExists(changelogDir)) ready = false;
        // meta.json file
        if (!await fileExists(metaFile)) ready = false;
        // versions.json file
        if (!await fileExists(versionsFile)) ready = false;
    } catch {
        ready = false;
    }
    if (ready) {
        // Everything is already set up, nothing to do
        return;
    }

    // Create all directories if missing
    if (!await folderExists(nyronDir)) {
        await mkdir(nyronDir, { recursive: true });
    }
    if (!await folderExists(changelogDir)) {
        await mkdir(changelogDir, { recursive: true });
    }

    // Ensure meta.json and versions.json files exist (create empty files if not present)
    if (!await fileExists(metaFile)) {
        await writeFile(metaFile, "{}");
    }
    if (!await fileExists(versionsFile)) {
        await writeFile(versionsFile, "{}");
    }

    await setMetaCreatedAt(new Date())
}