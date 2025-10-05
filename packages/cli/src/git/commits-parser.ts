import type { CommitDiff, ParsedCommits } from "./types"


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
      groups["other"]["general"].push({ 
        type: "other", 
        message: raw, 
        raw, 
        author: commit.author, 
        hash: commit.hash, 
        repo: commit.repo,
        githubUser: commit.githubUser,
        avatar: commit.avatar,
        url: commit.url
      })
      continue
    }

    const [, type, scope, message] = match
    const normalizedType = normalizeType(type as string)

    // ensure structure
    if (!groups[normalizedType]) groups[normalizedType] = {}
    const scopeKey = scope ?? "general"
    if (!groups[normalizedType][scopeKey]) groups[normalizedType][scopeKey] = []

    groups[normalizedType][scopeKey].push({ 
      type: normalizedType, 
      scope: scopeKey as string, 
      message: message!, 
      raw, 
      author: commit.author, 
      hash: commit.hash, 
      repo: commit.repo,
      githubUser: commit.githubUser,
      avatar: commit.avatar,
      url: commit.url
    })
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

export interface OrganizedCommits {
  features: string[]
  fixes: string[]
  chores: string[]
}

/**
 * Organize parsed commits into changelog-friendly categories.
 * Converts commits into formatted strings with optional scope labels.
 * 
 * @param parsedCommits - The result from parseCommits()
 * @returns An object with features, fixes, and chores arrays
 */
export function organizeForChangelog(parsedCommits: ParsedCommits): OrganizedCommits {
  const features: string[] = []
  const fixes: string[] = []
  const chores: string[] = []
  
  // Process Features
  if (parsedCommits["Features"]) {
    for (const [scope, commits] of Object.entries(parsedCommits["Features"])) {
      for (const commit of commits) {
        const scopeLabel = scope !== "general" ? `**${scope}**: ` : ""
        const authorLink = commit.githubUser 
          ? `[@${commit.githubUser}](https://github.com/${commit.githubUser})`
          : commit.author
        const commitLink = commit.url || `https://github.com/${commit.repo}/commit/${commit.hash}`
        const shortHash = commit.hash.substring(0, 7)
        features.push(`${scopeLabel}${commit.message} (${authorLink}) [[${shortHash}](${commitLink})]`)
      }
    }
  }
  
  // Process Bug Fixes
  if (parsedCommits["Bug Fixes"]) {
    for (const [scope, commits] of Object.entries(parsedCommits["Bug Fixes"])) {
      for (const commit of commits) {
        const scopeLabel = scope !== "general" ? `**${scope}**: ` : ""
        const authorLink = commit.githubUser 
          ? `[@${commit.githubUser}](https://github.com/${commit.githubUser})`
          : commit.author
        const commitLink = commit.url || `https://github.com/${commit.repo}/commit/${commit.hash}`
        const shortHash = commit.hash.substring(0, 7)
        fixes.push(`${scopeLabel}${commit.message} (${authorLink}) [[${shortHash}](${commitLink})]`)
      }
    }
  }
  
  // Process Chores and other types
  const choreTypes = ["Chores", "Refactors", "Performance", "Docs", "Tests", "Style", "Other", "other"]
  for (const type of choreTypes) {
    if (parsedCommits[type]) {
      for (const [scope, commits] of Object.entries(parsedCommits[type])) {
        for (const commit of commits) {
          const scopeLabel = scope !== "general" ? `**${scope}**: ` : ""
          const authorLink = commit.githubUser 
            ? `[@${commit.githubUser}](https://github.com/${commit.githubUser})`
            : commit.author
          const commitLink = commit.url || `https://github.com/${commit.repo}/commit/${commit.hash}`
          const shortHash = commit.hash.substring(0, 7)
          chores.push(`${scopeLabel}${commit.message} (${authorLink}) [[${shortHash}](${commitLink})]`)
        }
      }
    }
  }
  
  return { features, fixes, chores }
}
