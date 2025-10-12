import { mkdir } from "fs/promises"
import { writeFile, fileExists } from "../../core/files"
import { renderTemplate } from "../../utils/renderTemplate"
import { buildChangelogPath, buildChangelogDir } from "./file-parser"
import type { WriteChangelogOptions } from "./types"

export async function writeChangelog(options: WriteChangelogOptions) {
    const content = renderTemplate("default", {
        package: options.prefix,
        version: options.version,
        date: new Date().toISOString().split("T")[0],
        features: options.features,
        fixes: options.fixes,
        chores: options.chores,
    })
    
    const changelogDir = buildChangelogDir(options.prefix)
    const changelogPath = buildChangelogPath(options.prefix, options.version)
    
    // Ensure the directory exists
    await mkdir(changelogDir, { recursive: true })
    
    // Check if file already exists and log if overwriting
    const exists = await fileExists(changelogPath)
    if (exists) {
        console.log(`⚠️  Overwriting existing changelog at ${changelogPath}`)
    }
    
    // Write the file (will overwrite if exists)
    await writeFile(changelogPath, content)
    console.log(`✅ Changelog written: ${changelogPath}`)
}