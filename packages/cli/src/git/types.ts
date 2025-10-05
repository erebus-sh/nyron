export interface CommitDiff {
    hash: string
    message: string
    repo: string
    author: string
}

export interface ParsedCommit {
    type: string
    scope?: string
    author: string
    repo: string
    hash: string
    message: string
    raw: string
  }
  
  export interface ParsedCommits {
    [type: string]: Record<string | "general", ParsedCommit[]>
  }
  