import { resolve, join } from "path"
import { mkdir } from "fs/promises"
import { writeFile, fileExists } from "../core/files"
import { renderTemplate } from "../utils/renderTemplate"

interface WriteChangelogOptions {
    prefix: string
    version: string
    features: string[]
    fixes: string[]
    chores: string[]
}

const ROOT_PATH = ".nyron"

export async function writeChangelog(options: WriteChangelogOptions) {
    const content = renderTemplate("default", {
        package: options.prefix,
        version: options.version,
        date: new Date().toISOString().split("T")[0],
        features: options.features,
        fixes: options.fixes,
        chores: options.chores,
    })
    
    const changelogfileName = `CHANGELOG-${options.prefix}-${options.version.replace(/[@/]/g, "_")}.md`
    const changelogDir = resolve(ROOT_PATH, options.prefix)
    const changelogPath = join(changelogDir, changelogfileName)
    
    // Ensure the directory exists
    await mkdir(changelogDir, { recursive: true })
    
    // Check if file already exists and log if overwriting
    const exists = await fileExists(changelogPath)
    if (exists) {
        console.log(`⚠️  Overwriting existing changelog: ${changelogPath}`)
    }
    
    // Write the file (will overwrite if exists)
    await writeFile(changelogPath, content)
    console.log(`✅ Changelog written to: ${changelogPath}`)
}