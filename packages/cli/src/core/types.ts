export const BumpType = ["major", "minor", "patch", "prerelease"] as const
export type BumpType = typeof BumpType[number]



export interface ParsedCommit {
    type: string
    scope?: string
    issueNumber?: number
    pullRequestNumber?: number
    author: string
    repo: string
    hash: string
    message: string
    raw: string
    githubUser?: string
    avatar?: string
    url?: string
    issueUrl?: string
    pullRequestUrl?: string
    affectedFolders: string[]
  }
  
  export interface ParsedCommits {
    [type: string]: Record<string | "general", ParsedCommit[]>
  }
  