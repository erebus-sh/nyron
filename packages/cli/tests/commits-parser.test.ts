import { parseCommits, organizeForChangelog } from "../src/git/commits-parser"
import { describe, it, expect } from "bun:test"

describe("commits-parser", () => {
  it("should parse a simple feat commit", () => {
    const commits = [
      {
        hash: "123",
        message: "feat: add feature",
        author: "John Doe",
      }
    ]
    const result = parseCommits(commits)
    console.log("parseCommits([feat: add feature]) =", result)
    expect(result).toEqual({
      Features: {
        general: [
          {
            type: "Features",
            scope: "general",
            message: "add feature",
            raw: "feat: add feature"
          }
        ]
      }
    })
  })

  it("should parse a commit with scope", () => {
    const commits = [
      {
        hash: "456",
        message: "fix(core): fix bug",
        author: "Jane Doe",
      }
    ]
    const result = parseCommits(commits)
    console.log("parseCommits([fix(core): fix bug]) =", result)
    expect(result).toEqual({
      "Bug Fixes": {
        core: [
          {
            type: "Bug Fixes",
            scope: "core",
            message: "fix bug",
            raw: "fix(core): fix bug"
          }
        ]
      }
    })
  })

  it("should group multiple types and scopes", () => {
    const commits = [
      {
        hash: "1",
        message: "feat(ui): add button",
        author: "A",
      },
      {
        hash: "2",
        message: "fix(api): fix endpoint",
        author: "B",
      },
      {
        hash: "3",
        message: "docs: update readme",
        author: "C",
      },
      {
        hash: "4",
        message: "refactor: cleanup code",
        author: "D",
      }
    ]
    const result = parseCommits(commits)
    console.log("parseCommits([feat(ui), fix(api), docs, refactor]) =", result)
    expect(result).toEqual({
      Features: {
        ui: [
          {
            type: "Features",
            scope: "ui",
            message: "add button",
            raw: "feat(ui): add button"
          }
        ]
      },
      "Bug Fixes": {
        api: [
          {
            type: "Bug Fixes",
            scope: "api",
            message: "fix endpoint",
            raw: "fix(api): fix endpoint"
          }
        ]
      },
      Docs: {
        general: [
          {
            type: "Docs",
            scope: "general",
            message: "update readme",
            raw: "docs: update readme"
          }
        ]
      },
      Refactors: {
        general: [
          {
            type: "Refactors",
            scope: "general",
            message: "cleanup code",
            raw: "refactor: cleanup code"
          }
        ]
      }
    })
  })

  it("should bucket non-conventional commits as 'other'", () => {
    const commits = [
      {
        hash: "789",
        message: "random commit message",
        author: "E",
      }
    ]
    const result = parseCommits(commits)
    console.log("parseCommits([random commit message]) =", result)
    expect(result).toEqual({
      other: {
        general: [
          {
            type: "other",
            message: "random commit message",
            raw: "random commit message"
          }
        ]
      }
    })
  })

  it("should parse commit with unusual type", () => {
    const commits = [
      {
        hash: "101",
        message: "build: update deps",
        author: "F",
      }
    ]
    const result = parseCommits(commits)
    console.log("parseCommits([build: update deps]) =", result)
    expect(result).toEqual({
      Other: {
        general: [
          {
            type: "Other",
            scope: "general",
            message: "update deps",
            raw: "build: update deps"
          }
        ]
      }
    })
  })

  it("should parse commit with multi-word scope", () => {
    const commits = [
      {
        hash: "102",
        message: "feat(my-lib): add something",
        author: "G",
      }
    ]
    const result = parseCommits(commits)
    console.log("parseCommits([feat(my-lib): add something]) =", result)
    expect(result).toEqual({
      Features: {
        "my-lib": [
          {
            type: "Features",
            scope: "my-lib",
            message: "add something",
            raw: "feat(my-lib): add something"
          }
        ]
      }
    })
  })

  it("should parse commit with extra whitespace", () => {
    const commits = [
      {
        hash: "103",
        message: "  fix:   fix whitespace   ",
        author: "H",
      }
    ]
    const result = parseCommits(commits)
    console.log("parseCommits([fix:   fix whitespace   ]) =", result)
    expect(result).toEqual({
      "Bug Fixes": {
        general: [
          {
            type: "Bug Fixes",
            scope: "general",
            message: "fix whitespace",
            raw: "fix:   fix whitespace"
          }
        ]
      }
    })
  })

  it("should parse multiple commits of same type and scope", () => {
    const commits = [
      {
        hash: "201",
        message: "feat(core): add A",
        author: "I",
      },
      {
        hash: "202",
        message: "feat(core): add B",
        author: "J",
      }
    ]
    const result = parseCommits(commits)
    console.log("parseCommits([feat(core): add A, feat(core): add B]) =", result)
    expect(result).toEqual({
      Features: {
        core: [
          {
            type: "Features",
            scope: "core",
            message: "add A",
            raw: "feat(core): add A"
          },
          {
            type: "Features",
            scope: "core",
            message: "add B",
            raw: "feat(core): add B"
          }
        ]
      }
    })
  })
})

describe("organizeForChangelog", () => {
  it("should organize features, fixes, and chores", () => {
    const commits = [
      { hash: "1", message: "feat: add feature A", author: "A" },
      { hash: "2", message: "fix: fix bug B", author: "B" },
      { hash: "3", message: "chore: update deps", author: "C" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizeForChangelog(parsed)
    
    expect(organized).toEqual({
      features: ["add feature A"],
      fixes: ["fix bug B"],
      chores: ["update deps"]
    })
  })

  it("should add scope labels for scoped commits", () => {
    const commits = [
      { hash: "1", message: "feat(ui): add button", author: "A" },
      { hash: "2", message: "fix(api): fix endpoint", author: "B" },
      { hash: "3", message: "docs(readme): update docs", author: "C" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizeForChangelog(parsed)
    
    expect(organized).toEqual({
      features: ["**ui**: add button"],
      fixes: ["**api**: fix endpoint"],
      chores: ["**readme**: update docs"]
    })
  })

  it("should not add scope label for general scope", () => {
    const commits = [
      { hash: "1", message: "feat: add feature", author: "A" },
      { hash: "2", message: "fix: fix bug", author: "B" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizeForChangelog(parsed)
    
    expect(organized).toEqual({
      features: ["add feature"],
      fixes: ["fix bug"],
      chores: []
    })
  })

  it("should categorize all non-feature/fix types as chores", () => {
    const commits = [
      { hash: "1", message: "docs: update readme", author: "A" },
      { hash: "2", message: "refactor: cleanup", author: "B" },
      { hash: "3", message: "perf: optimize", author: "C" },
      { hash: "4", message: "test: add tests", author: "D" },
      { hash: "5", message: "style: format", author: "E" },
      { hash: "6", message: "chore: misc", author: "F" },
      { hash: "7", message: "build: update config", author: "G" },
      { hash: "8", message: "random message", author: "H" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizeForChangelog(parsed)
    
    expect(organized.features).toEqual([])
    expect(organized.fixes).toEqual([])
    // Check that all expected items are present (order may vary based on commit type iteration)
    expect(organized.chores.length).toBe(8)
    expect(organized.chores).toContain("update readme")
    expect(organized.chores).toContain("cleanup")
    expect(organized.chores).toContain("optimize")
    expect(organized.chores).toContain("add tests")
    expect(organized.chores).toContain("format")
    expect(organized.chores).toContain("misc")
    expect(organized.chores).toContain("update config")
    expect(organized.chores).toContain("random message")
  })

  it("should handle multiple commits of same type with different scopes", () => {
    const commits = [
      { hash: "1", message: "feat(ui): add A", author: "A" },
      { hash: "2", message: "feat(api): add B", author: "B" },
      { hash: "3", message: "feat: add C", author: "C" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizeForChangelog(parsed)
    
    expect(organized.features).toEqual([
      "**ui**: add A",
      "**api**: add B",
      "add C"
    ])
  })

  it("should return empty arrays for no commits", () => {
    const parsed = parseCommits([])
    const organized = organizeForChangelog(parsed)
    
    expect(organized).toEqual({
      features: [],
      fixes: [],
      chores: []
    })
  })

  it("should handle mixed scopes and general in same type", () => {
    const commits = [
      { hash: "1", message: "fix(core): fix A", author: "A" },
      { hash: "2", message: "fix: fix B", author: "B" },
      { hash: "3", message: "fix(utils): fix C", author: "C" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizeForChangelog(parsed)
    
    expect(organized.fixes).toEqual([
      "**core**: fix A",
      "fix B",
      "**utils**: fix C"
    ])
  })
})