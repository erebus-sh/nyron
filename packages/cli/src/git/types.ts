export interface CommitDiff {
    hash: string
    message: string
    repo: string
    author: string
    githubUser?: string
    avatar?: string
    url?: string
}

export interface ParsedCommit {
    type: string
    scope?: string
    author: string
    repo: string
    hash: string
    message: string
    raw: string
    githubUser?: string
    avatar?: string
    url?: string
  }
  
  export interface ParsedCommits {
    [type: string]: Record<string | "general", ParsedCommit[]>
  }
  