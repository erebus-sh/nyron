import { loadConfig } from "../config/loader"
import type { NyronConfig } from "../config/types"
import { readMeta } from "../nyron/meta/reader"
import type { Meta } from "../nyron/meta/schema"
import { readVersions } from "../nyron/versions/reader"
import type { Versions } from "../nyron/versions/schema"
import { addMetaPackage, removeMetaPackage, updateMetaPackageVersion, setMetaLatestTag } from "../nyron/meta/writer"
import { addVersionsPackage, removeVersionsPackage } from "../nyron/versions/writer"
import { packageJsonExists, validatePackageJson, getPackageVersion } from "../package/read"
import { createPackageJson } from "../package/write"
import { existsSync } from "fs"
import { resolve } from "path"
import { ask } from "../core/prompts"
import { getLatestNyronReleaseTag } from "../git/tags"

interface PathIssue {
    projectName: string
    path: string
    type: "missing_dir" | "missing_package_json" | "invalid_package_json"
}

interface DetectedIssues {
    pathIssues: PathIssue[]
    orphanedInMeta: string[]
    orphanedInVersions: string[]
    missingInMeta: string[]
    missingInVersions: string[]
    versionMismatches: Array<{ prefix: string; packageVersion: string; metaVersion: string }>
    latestTagMismatch: { current: string | undefined; latest: string } | null
}

/**
 * Phase 1: Detect all issues without fixing anything
 */
const detectIssues = async (meta: Meta, versions: Versions, config: NyronConfig): Promise<DetectedIssues> => {
    const issues: DetectedIssues = {
        pathIssues: [],
        orphanedInMeta: [],
        orphanedInVersions: [],
        missingInMeta: [],
        missingInVersions: [],
        versionMismatches: [],
        latestTagMismatch: null
    }

    const configPrefixes = new Set(Object.keys(config.projects))
    const metaPrefixes = new Set(meta.packages.map(p => p.prefix))
    const versionsPrefixes = new Set(Object.keys(versions.packages))

    // Check for path issues
    for (const [projectName, projectConfig] of Object.entries(config.projects)) {
        const fullPath = resolve(process.cwd(), projectConfig.path)
        
        if (!existsSync(fullPath)) {
            issues.pathIssues.push({
                projectName,
                path: projectConfig.path,
                type: "missing_dir"
            })
        } else if (!packageJsonExists(fullPath)) {
            issues.pathIssues.push({
                projectName,
                path: projectConfig.path,
                type: "missing_package_json"
            })
        } else if (!validatePackageJson(fullPath)) {
            issues.pathIssues.push({
                projectName,
                path: projectConfig.path,
                type: "invalid_package_json"
            })
        }
    }

    // Find orphaned packages (in meta/versions but not in config)
    for (const prefix of metaPrefixes) {
        if (!configPrefixes.has(prefix)) {
            issues.orphanedInMeta.push(prefix)
        }
    }

    for (const prefix of versionsPrefixes) {
        if (!configPrefixes.has(prefix)) {
            issues.orphanedInVersions.push(prefix)
        }
    }

    // Find missing packages (in config but not in meta/versions)
    for (const prefix of configPrefixes) {
        if (!metaPrefixes.has(prefix)) {
            issues.missingInMeta.push(prefix)
        }
        if (!versionsPrefixes.has(prefix)) {
            issues.missingInVersions.push(prefix)
        }
    }

    // Find version mismatches (only for projects that have valid package.json)
    for (const [projectName, projectConfig] of Object.entries(config.projects)) {
        const fullPath = resolve(process.cwd(), projectConfig.path)
        
        if (validatePackageJson(fullPath)) {
            try {
                const packageVersion = getPackageVersion(fullPath)
                const metaPackage = meta.packages.find(p => p.prefix === projectName)
                
                if (metaPackage && metaPackage.version !== packageVersion) {
                    issues.versionMismatches.push({
                        prefix: projectName,
                        packageVersion,
                        metaVersion: metaPackage.version
                    })
                }
            } catch {
                // Ignore errors, already handled in path issues
            }
        }
    }

    // Check if latest Nyron release tag needs updating
    try {
        const latestTag = await getLatestNyronReleaseTag()
        if (latestTag && latestTag !== meta.latestTag) {
            issues.latestTagMismatch = {
                current: meta.latestTag,
                latest: latestTag
            }
        }
    } catch {
        // Silently ignore if we can't get the latest tag (e.g., no git repo)
    }

    return issues
}

/**
 * Phase 2: Auto-fix issues that don't require prompting
 */
const autoFix = async (issues: DetectedIssues, config: NyronConfig): Promise<string[]> => {
    const fixes: string[] = []

    // Remove orphaned packages from meta.json
    for (const prefix of issues.orphanedInMeta) {
        await removeMetaPackage(prefix)
        fixes.push(`Removed orphaned package "${prefix}" from meta.json`)
    }

    // Remove orphaned packages from versions.json
    for (const prefix of issues.orphanedInVersions) {
        await removeVersionsPackage(prefix)
        fixes.push(`Removed orphaned package "${prefix}" from versions.json`)
    }

    // Add missing packages to meta.json
    for (const prefix of issues.missingInMeta) {
        const projectConfig = config.projects[prefix]
        if (!projectConfig) continue
        
        const fullPath = resolve(process.cwd(), projectConfig.path)
        
        let version = "0.0.0"
        if (validatePackageJson(fullPath)) {
            try {
                version = getPackageVersion(fullPath)
            } catch {
                // Use default version
            }
        }
        
        await addMetaPackage(prefix, version)
        fixes.push(`Added missing package "${prefix}" to meta.json with version ${version}`)
    }

    // Add missing packages to versions.json
    for (const prefix of issues.missingInVersions) {
        const projectConfig = config.projects[prefix]
        if (!projectConfig) continue
        
        const fullPath = resolve(process.cwd(), projectConfig.path)
        
        let version = "0.0.0"
        if (validatePackageJson(fullPath)) {
            try {
                version = getPackageVersion(fullPath)
            } catch {
                // Use default version
            }
        }
        
        await addVersionsPackage(prefix, version)
        fixes.push(`Added missing package "${prefix}" to versions.json with version ${version}`)
    }

    // Sync version mismatches (package.json is source of truth)
    for (const mismatch of issues.versionMismatches) {
        await updateMetaPackageVersion(mismatch.prefix, mismatch.packageVersion)
        fixes.push(`Synced version for "${mismatch.prefix}": ${mismatch.metaVersion} → ${mismatch.packageVersion}`)
    }

    // Update latest Nyron release tag in meta.json
    if (issues.latestTagMismatch) {
        await setMetaLatestTag(issues.latestTagMismatch.latest)
        const currentDisplay = issues.latestTagMismatch.current || "(not set)"
        fixes.push(`Updated latest Nyron release tag: ${currentDisplay} → ${issues.latestTagMismatch.latest}`)
    }

    return fixes
}

/**
 * Phase 3: Prompt for path issues and apply fixes
 */
const promptForPathIssues = async (issues: DetectedIssues): Promise<string[]> => {
    const fixes: string[] = []

    // Group issues by type
    const missingDirs = issues.pathIssues.filter(i => i.type === "missing_dir")
    const missingPackageJsons = issues.pathIssues.filter(i => i.type === "missing_package_json")
    const invalidPackageJsons = issues.pathIssues.filter(i => i.type === "invalid_package_json")

    // Handle missing directories
    for (const issue of missingDirs) {
        console.log(`\n⚠️  Path "${issue.path}" for project "${issue.projectName}" doesn't exist.`)
        const answer = await ask("Create directory with package.json? (y/n): ")
        
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            const fullPath = resolve(process.cwd(), issue.path)
            createPackageJson(fullPath, issue.projectName, "0.0.0")
            fixes.push(`Created directory and package.json for "${issue.projectName}" at ${issue.path}`)
        } else {
            fixes.push(`Skipped creating directory for "${issue.projectName}"`)
        }
    }

    // Handle missing package.json files
    for (const issue of missingPackageJsons) {
        console.log(`\n⚠️  package.json missing at "${issue.path}" for project "${issue.projectName}".`)
        const answer = await ask("Create package.json with version 0.0.0? (y/n): ")
        
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            const fullPath = resolve(process.cwd(), issue.path)
            createPackageJson(fullPath, issue.projectName, "0.0.0")
            fixes.push(`Created package.json for "${issue.projectName}" at ${issue.path}`)
        } else {
            fixes.push(`Skipped creating package.json for "${issue.projectName}"`)
        }
    }

    // Handle invalid package.json files (missing version)
    for (const issue of invalidPackageJsons) {
        console.log(`\n⚠️  package.json at "${issue.path}" for project "${issue.projectName}" is missing the "version" field.`)
        const answer = await ask("Add version field with 0.0.0? (y/n): ")
        
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            const fullPath = resolve(process.cwd(), issue.path)
            // Read existing package.json, add version, and write back
            const { readFileSync, writeFileSync } = await import("fs")
            const packageJsonPath = resolve(fullPath, "package.json")
            const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
            packageJson.version = "0.0.0"
            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n")
            fixes.push(`Added version field to package.json for "${issue.projectName}"`)
        } else {
            fixes.push(`Skipped adding version field for "${issue.projectName}"`)
        }
    }

    return fixes
}

/**
 * Main fix command
 */
export const fix = async () => {
    console.log("🔍 Scanning Nyron setup for issues...\n")

    const { config } = await loadConfig()
    const meta = await readMeta()
    const versions = await readVersions()

    // Phase 1: Detect all issues
    const issues = await detectIssues(meta, versions, config)

    // Check if there are any issues
    const hasIssues = 
        issues.pathIssues.length > 0 ||
        issues.orphanedInMeta.length > 0 ||
        issues.orphanedInVersions.length > 0 ||
        issues.missingInMeta.length > 0 ||
        issues.missingInVersions.length > 0 ||
        issues.versionMismatches.length > 0 ||
        issues.latestTagMismatch !== null

    if (!hasIssues) {
        console.log("✅ No issues found! Your Nyron setup is in good shape.\n")
        return
    }

    // Phase 2: Auto-fix issues
    console.log("🔧 Auto-fixing issues...\n")
    const autoFixes = await autoFix(issues, config)

    // Phase 3: Prompt for path issues
    const promptFixes = await promptForPathIssues(issues)

    // Phase 4: Report results
    console.log("\n" + "=".repeat(60))
    console.log("📋 Fix Summary")
    console.log("=".repeat(60) + "\n")

    const allFixes = [...autoFixes, ...promptFixes]
    
    if (allFixes.length === 0) {
        console.log("No fixes were applied.\n")
    } else {
        console.log("Applied fixes:\n")
        allFixes.forEach((fix, index) => {
            console.log(`  ${index + 1}. ${fix}`)
        })
        console.log(`\n✅ Total: ${allFixes.length} fix(es) applied.\n`)
    }
}