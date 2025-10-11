import { resolve, join } from "path"

export const CHANGELOG_ROOT_PATH = ".nyron/changelog/"

/**
 * Sanitizes a string for use in file paths by replacing @ and / with _
 */
function sanitize(str: string): string {
    return str.replace(/[@/]/g, "_")
}

/**
 * Builds the changelog file name
 * @param prefix - The tag prefix (e.g., "@nyron/cli")
 * @param version - The version (e.g., "1.0.0")
 * @returns The changelog file name (e.g., "CHANGELOG-_nyron_cli-1.0.0.md")
 */
export function buildChangelogFileName(prefix: string, version: string): string {
    return `CHANGELOG-${sanitize(prefix)}-${sanitize(version)}.md`
}

/**
 * Builds the changelog directory path
 * @param prefix - The tag prefix (e.g., "@nyron/cli")
 * @returns The changelog directory path (e.g., ".nyron/@nyron/cli")
 */
export function buildChangelogDir(prefix: string): string {
    return resolve(CHANGELOG_ROOT_PATH, prefix)
}

/**
 * Builds the full changelog file path
 * @param prefix - The tag prefix (e.g., "@nyron/cli")
 * @param version - The version (e.g., "1.0.0")
 * @returns The full changelog path (e.g., ".nyron/@nyron/cli/CHANGELOG-_nyron_cli-1.0.0.md")
 */
export function buildChangelogPath(prefix: string, version: string): string {
    const fileName = buildChangelogFileName(prefix, version)
    const dir = buildChangelogDir(prefix)
    return join(dir, fileName)
}

