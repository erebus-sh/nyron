import { mkdir } from "fs/promises"
import { writeFile, fileExists } from "../../core/files"
import { buildChangelogPath, buildChangelogDir } from "./file-parser"
import { NYRON_RELEASE_PREFIX } from "../../core/tag-parser"

export async function writeChangelog(nyronReleaseTag: string, changelog: string) {
    
    const changelogDir = buildChangelogDir(NYRON_RELEASE_PREFIX)
    const changelogPath = buildChangelogPath(NYRON_RELEASE_PREFIX, nyronReleaseTag)
    
    // Ensure the directory exists
    await mkdir(changelogDir, { recursive: true })
    
    // Check if file already exists and log if overwriting
    const exists = await fileExists(changelogPath)
    if (exists) {
        console.log(`⚠️  Overwriting existing changelog at ${changelogPath}`)
    }
    
    // Write the file (will overwrite if exists)
    await writeFile(changelogPath, changelog)
    console.log(`✅ Changelog written: ${changelogPath}`)
}