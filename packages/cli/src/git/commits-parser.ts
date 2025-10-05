import type { CommitDiff } from "./types"

export interface ParsedCommit {
  type: string
  scope?: string
  message: string
  raw: string
}

export interface ParsedCommits {
  [type: string]: Record<string | "general", ParsedCommit[]>
}

/**
 * Parse commits into structured groups:
 * feat(erebus-sdk): add caching -> type=feat, scope=erebus-sdk, message="add caching"
 * fix: resolve crash -> type=fix, message="resolve crash"
 */
export function parseCommits(commits: CommitDiff[]): ParsedCommits {
  const groups: ParsedCommits = {}

  for (const commit of commits) {
    const raw = commit.message.trim()

    // Match conventional commits: type(scope?): message
    const match = raw.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/)
    if (!match) {
      // fallback bucket
      groups["other"] ??= { ["general"]: [] }
      if (!groups["other"]["general"]) groups["other"]["general"] = []
      groups["other"]["general"].push({ type: "other", message: raw, raw })
      continue
    }

    const [, type, scope, message] = match
    const normalizedType = normalizeType(type as string)

    // ensure structure
    if (!groups[normalizedType]) groups[normalizedType] = {}
    const scopeKey = scope ?? "general"
    if (!groups[normalizedType][scopeKey]) groups[normalizedType][scopeKey] = []

    groups[normalizedType][scopeKey].push({ type: normalizedType, scope: scopeKey as string, message: message!, raw })
  }
  return groups
}

/**
 * Normalize commit types into canonical groups for changelogs.
 */
function normalizeType(type: string): string {
  switch (type) {
    case "feat":
      return "Features"
    case "fix":
      return "Bug Fixes"
    case "refactor":
      return "Refactors"
    case "perf":
      return "Performance"
    case "docs":
      return "Docs"
    case "chore":
      return "Chores"
    case "test":
      return "Tests"
    case "style":
      return "Style"
    default:
      return "Other"
  }
}
