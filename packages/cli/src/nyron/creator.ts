import { mkdirSync } from "fs"
import path from "path"
import { CHANGELOG_ROOT_PATH } from "./changelog/file-parser"
import { META_ROOT_PATH } from "./meta/file-parser"
import { VERSIONS_ROOT_PATH } from "./versions/file-parser"

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
export function createNyronDirectory(): void {
    const cwd = process.cwd();
    const nyronDir = path.resolve(cwd, ".nyron");
    const changelogDir = path.resolve(nyronDir, CHANGELOG_ROOT_PATH);
    const metaFile = path.resolve(nyronDir, META_ROOT_PATH);
    const versionsFile = path.resolve(nyronDir, VERSIONS_ROOT_PATH);

    const { writeFileSync, existsSync, statSync } = require("fs");

    // Guard: check if everything already exists
    let ready = true;
    try {
        // .nyron directory
        if (!existsSync(nyronDir) || !statSync(nyronDir).isDirectory()) ready = false;
        // changelog directory
        if (!existsSync(changelogDir) || !statSync(changelogDir).isDirectory()) ready = false;
        // meta.json file
        if (!existsSync(metaFile) || !statSync(metaFile).isFile()) ready = false;
        // versions.json file
        if (!existsSync(versionsFile) || !statSync(versionsFile).isFile()) ready = false;
    } catch {
        ready = false;
    }
    if (ready) {
        // Everything is already set up, nothing to do
        return;
    }

    // Create all directories if missing
    if (!existsSync(nyronDir)) {
        mkdirSync(nyronDir, { recursive: true });
    }
    if (!existsSync(changelogDir)) {
        mkdirSync(changelogDir, { recursive: true });
    }

    // Ensure meta.json and versions.json files exist (create empty files if not present)
    if (!existsSync(metaFile)) {
        writeFileSync(metaFile, "{}");
    }
    if (!existsSync(versionsFile)) {
        writeFileSync(versionsFile, "{}");
    }
}