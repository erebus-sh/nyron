import type { OptionValues } from "commander"
import type { BumpType } from "../core/types"

/**
 * Command-line options for the bump action.
 * Used to specify how a project's version should be incremented.
 */
export interface BumpOptions extends OptionValues {
    /** The type of version bump to perform (major, minor, patch) */
    type: BumpType
    /** The tag prefix for the project to bump (e.g., "@my-package/sdk@") */
    prefix: string
}
  
/**
 * Command-line options for the diff action.
 * Used to analyze changes since the last release for one or more projects.
 */
export interface DiffOptions extends OptionValues {
    /** Optional tag prefix filter to analyze only specific projects */
    prefix?: string
}

/**
 * Command-line options for the init action.
 * Used to create the initial nyron.config.ts configuration file.
 */
export interface InitOptions extends OptionValues {
    /** Whether to overwrite an existing configuration file */
    force?: boolean
    // TODO: Add json option and handle it
}

/**
 * Command-line options for the tag action.
 * Used to create a new git tag for a specific project version.
 */
export interface TagOptions extends OptionValues {
    /** The tag prefix for the project (e.g., "@my-package/sdk@") */
    prefix: string
    /** The version string to tag (e.g., "1.2.3") */
    version: string
}

// -----------------------------
// Result interfaces returned by actions
// -----------------------------

/**
 * Result returned by the bump action.
 * Contains information about the version bump operation and any generated artifacts.
 */
export interface BumpResult {
    /** Whether the bump operation completed successfully */
    success: boolean
    /** The tag prefix that was bumped */
    prefix: string
    /** The new version that was created (e.g., "1.2.4") */
    newVersion?: string
    /** The full tag name that was created (e.g., "@my-package/sdk@1.2.4") */
    tag?: string
    /** Path to the package.json file that was updated */
    packagePath?: string
    /** Information about changelog generation during the bump */
    changelog?: {
        /** Whether a changelog was successfully generated */
        generated: boolean
        /** Number of commits included in the changelog */
        commitCount: number
    }
    /** Error message if the bump operation failed */
    error?: string
}

/**
 * Result for a single project analyzed by the diff action.
 * Contains information about changes since the last release for one project.
 */
export interface ProjectDiffResult {
    /** The project name from nyron.config.ts */
    name: string
    /** The tag prefix for this project */
    tagPrefix: string
    /** The most recent tag for this project, if any exists */
    latestTag?: string
    /** Number of commits since the latest tag */
    commitsSinceLatest: number
    /** Array of commit messages since the latest tag */
    commitMessages: string[]
    /** Whether this project needs an initial tag (no tags exist yet) */
    needsInitialTag: boolean
}

/**
 * Result returned by the diff action.
 * Contains analysis results for all projects and summary information.
 */
export interface DiffResult {
    /** Array of results for each analyzed project */
    results: ProjectDiffResult[]
    /** Total number of projects that were analyzed */
    totalProjectsAnalyzed: number
}

/**
 * Result returned by the init action.
 * Contains information about the configuration file creation.
 */
export interface InitResult {
    /** Whether a new configuration file was created */
    created: boolean
    /** Full path to the configuration file */
    filepath: string
    /** Whether an existing file was overwritten */
    overwritten: boolean
}

/**
 * Result returned by the tag action.
 * Contains information about the git tag creation operation.
 */
export interface TagResult {
    /** Whether the tag was successfully created */
    created: boolean
    /** Whether the tag was successfully pushed to the remote repository */
    pushed: boolean
    /** The full tag name that was created */
    tagName: string
    /** Whether the tag already existed before the operation */
    alreadyExists: boolean
    /** The project name associated with this tag prefix, if found in config */
    associatedProjectName?: string
}