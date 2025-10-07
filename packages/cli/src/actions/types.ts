import type { OptionValues } from "commander"
import type { BumpType } from "../core/types"

export interface BumpOptions extends OptionValues {
    type: BumpType
    prefix: string
}
  
export interface DiffOptions extends OptionValues {
    prefix?: string
}

export interface InitOptions extends OptionValues {
    force?: boolean
}

export interface TagOptions extends OptionValues {
    prefix: string
    version: string
}

// -----------------------------
// Result interfaces returned by actions
// -----------------------------

export interface BumpResult {
    success: boolean
    prefix: string
    newVersion?: string
    tag?: string
    packagePath?: string
    changelog?: {
        generated: boolean
        commitCount: number
    }
    error?: string
}

export interface ProjectDiffResult {
    name: string
    tagPrefix: string
    latestTag?: string
    commitsSinceLatest: number
    commitMessages: string[]
    needsInitialTag: boolean
}

export interface DiffResult {
    results: ProjectDiffResult[]
    totalProjectsAnalyzed: number
}

export interface InitResult {
    created: boolean
    filepath: string
    overwritten: boolean
}

export interface TagResult {
    created: boolean
    pushed: boolean
    tagName: string
    alreadyExists: boolean
    associatedProjectName?: string
}