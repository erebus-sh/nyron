import { readMeta } from "./meta/reader"
import { readVersions } from "./versions/reader"

// Extract updated versions from meta.json with prefix (e.g. "my-package@1.0.0" -> "my-package@1.0.1")
export async function getUpdatedVersions(): Promise<string[]> {
    const meta = await readMeta()
    const versions = await readVersions()

    // Create a map of prefix to latest version from the versions file
    const latestVersions = new Map<string, string>()
    
    for (const [prefix, packageVersions] of Object.entries(versions.packages)) {
        if (packageVersions.length > 0) {
            // Get the latest version (assuming they're ordered chronologically)
            const latestVersion = packageVersions[packageVersions.length - 1]
            if (latestVersion) {
                latestVersions.set(prefix, latestVersion.version)
            }
        }
    }

    // Extract updated versions for packages that exist in meta
    const updatedVersions: string[] = []
    
    for (const packageInfo of meta.packages) {
        const latestVersion = latestVersions.get(packageInfo.prefix)
        // Only include packages that have updated versions (not the same as current)
        if (latestVersion && latestVersion !== packageInfo.version) {
            updatedVersions.push(`${packageInfo.prefix}@${packageInfo.version} -> ${packageInfo.prefix}@${latestVersion}`)
        }
    }

    return updatedVersions
}