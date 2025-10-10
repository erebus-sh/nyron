import { describe, it, expect, mock, beforeEach } from "bun:test"
import { generateChangelog } from "../src/utils/generateChangelog"

// Mock all dependencies
const mockGetLatestTag = mock(() => Promise.resolve("cli-v@1.2.0"))
const mockGetPreviousTag = mock(() => Promise.resolve("cli-v@1.1.0"))
const mockGetCommitsBetween = mock(() => Promise.resolve([
  { hash: "abc123", message: "feat: add new feature", author: "John Doe" },
  { hash: "def456", message: "fix: resolve bug", author: "Jane Doe" },
]))
const mockWriteChangelog = mock(() => Promise.resolve())

// Mock modules
mock.module("../src/git/tags", () => ({
  getLatestTag: mockGetLatestTag,
  getPreviousTag: mockGetPreviousTag,
}))

mock.module("../src/github/commits", () => ({
  getCommitsBetween: mockGetCommitsBetween,
}))

mock.module("../src/changelog/write", () => ({
  writeChangelog: mockWriteChangelog,
}))

describe("generateChangelog", () => {
  beforeEach(() => {
    // Reset all mocks
    mockGetLatestTag.mockClear()
    mockGetPreviousTag.mockClear()
    mockGetCommitsBetween.mockClear()
    mockWriteChangelog.mockClear()
  })

  it("should generate changelog successfully with features and fixes", async () => {
    mockGetLatestTag.mockResolvedValue("cli-v@1.2.0")
    mockGetPreviousTag.mockResolvedValue("cli-v@1.1.0")
    mockGetCommitsBetween.mockResolvedValue([
      { hash: "1", message: "feat(ui): add button", author: "A" },
      { hash: "2", message: "fix(api): fix endpoint", author: "B" },
      { hash: "3", message: "chore: update deps", author: "C" },
    ])

    const result = await generateChangelog("cli-v@", "test/repo")

    expect(mockGetLatestTag).toHaveBeenCalledWith("cli-v@")
    expect(mockGetPreviousTag).toHaveBeenCalledWith("cli-v@")
    expect(mockGetCommitsBetween).toHaveBeenCalledWith("cli-v@1.1.0", "cli-v@1.2.0", "test/repo")
    expect(mockWriteChangelog).toHaveBeenCalledWith({
      prefix: "cli-v@",
      version: "1.2.0",
      features: ["**ui**: add button (A) [[1](https://github.com/undefined/commit/1)]"],
      fixes: ["**api**: fix endpoint (B) [[2](https://github.com/undefined/commit/2)]"],
      chores: ["update deps (C) [[3](https://github.com/undefined/commit/3)]"],
    })
    expect(result.generated).toBe(true)
    expect(result.version).toBe("1.2.0")
    expect(result.commitCount).toBe(3)
  })

  it("should handle commits without scopes", async () => {
    mockGetLatestTag.mockResolvedValue("v@2.0.0")
    mockGetPreviousTag.mockResolvedValue("v@1.9.0")
    mockGetCommitsBetween.mockResolvedValue([
      { hash: "1", message: "feat: add feature", author: "A" },
      { hash: "2", message: "fix: fix bug", author: "B" },
    ])

    const result = await generateChangelog("v@", "test/repo")

    expect(mockWriteChangelog).toHaveBeenCalledWith({
      prefix: "v@",
      version: "2.0.0",
      features: ["add feature (A) [[1](https://github.com/undefined/commit/1)]"],
      fixes: ["fix bug (B) [[2](https://github.com/undefined/commit/2)]"],
      chores: [],
    })
    expect(result.generated).toBe(true)
  })

  it("should categorize various commit types correctly", async () => {
    mockGetLatestTag.mockResolvedValue("app@3.0.0")
    mockGetPreviousTag.mockResolvedValue("app@2.9.0")
    mockGetCommitsBetween.mockResolvedValue([
      { hash: "1", message: "feat: new feature", author: "A" },
      { hash: "2", message: "fix: bug fix", author: "B" },
      { hash: "3", message: "docs: update docs", author: "C" },
      { hash: "4", message: "refactor: cleanup", author: "D" },
      { hash: "5", message: "perf: optimize", author: "E" },
      { hash: "6", message: "test: add tests", author: "F" },
    ])

    const result = await generateChangelog("app@", "test/repo")

    const call = (mockWriteChangelog.mock.calls as any)[0]?.[0]
    expect(call).toBeDefined()
    expect(call.prefix).toBe("app@")
    expect(call.version).toBe("3.0.0")
    expect(call.features).toEqual(["new feature (A) [[1](https://github.com/undefined/commit/1)]"])
    expect(call.fixes).toEqual(["bug fix (B) [[2](https://github.com/undefined/commit/2)]"])
    expect(call.chores.length).toBe(4)
    expect(call.chores).toContain("update docs (C) [[3](https://github.com/undefined/commit/3)]")
    expect(call.chores).toContain("cleanup (D) [[4](https://github.com/undefined/commit/4)]")
    expect(call.chores).toContain("optimize (E) [[5](https://github.com/undefined/commit/5)]")
    expect(call.chores).toContain("add tests (F) [[6](https://github.com/undefined/commit/6)]")
    expect(result.generated).toBe(true)
  })

  it("should throw error when no latest tag is found", async () => {
    mockGetLatestTag.mockResolvedValue(null as any)

    await expect(generateChangelog("v@", "test/repo")).rejects.toThrow("No tag found for v@")

    expect(mockGetLatestTag).toHaveBeenCalledWith("v@")
    expect(mockGetPreviousTag).not.toHaveBeenCalled()
    expect(mockGetCommitsBetween).not.toHaveBeenCalled()
    expect(mockWriteChangelog).not.toHaveBeenCalled()
  })

  it("should throw error when no previous tag is found", async () => {
    mockGetLatestTag.mockResolvedValue("v@1.0.0")
    mockGetPreviousTag.mockResolvedValue(null as any)

    await expect(generateChangelog("v@", "test/repo")).rejects.toThrow("No previous tag found for v@")

    expect(mockGetLatestTag).toHaveBeenCalledWith("v@")
    expect(mockGetPreviousTag).toHaveBeenCalledWith("v@")
    expect(mockGetCommitsBetween).not.toHaveBeenCalled()
    expect(mockWriteChangelog).not.toHaveBeenCalled()
  })

  it("should return generated=false when no commits found between tags", async () => {
    mockGetLatestTag.mockResolvedValue("v@1.1.0")
    mockGetPreviousTag.mockResolvedValue("v@1.0.0")
    mockGetCommitsBetween.mockResolvedValue([])

    const result = await generateChangelog("v@", "test/repo")

    expect(mockGetCommitsBetween).toHaveBeenCalledWith("v@1.0.0", "v@1.1.0", "test/repo")
    expect(mockWriteChangelog).not.toHaveBeenCalled()
    expect(result.generated).toBe(false)
    expect(result.reason).toBe("No commits found between tags")
  })

  it("should handle tags with different prefix formats", async () => {
    mockGetLatestTag.mockResolvedValue("@scope/package@1.5.0")
    mockGetPreviousTag.mockResolvedValue("@scope/package@1.4.0")
    mockGetCommitsBetween.mockResolvedValue([
      { hash: "1", message: "feat: feature", author: "A" },
    ])

    const result = await generateChangelog("@scope/package@", "test/repo")

    expect(mockWriteChangelog).toHaveBeenCalledWith({
      prefix: "@scope/package@",
      version: "1.5.0",
      features: ["feature (A) [[1](https://github.com/undefined/commit/1)]"],
      fixes: [],
      chores: [],
    })
    expect(result.generated).toBe(true)
  })

  it("should handle non-conventional commits", async () => {
    mockGetLatestTag.mockResolvedValue("v@1.2.0")
    mockGetPreviousTag.mockResolvedValue("v@1.1.0")
    mockGetCommitsBetween.mockResolvedValue([
      { hash: "1", message: "feat: feature", author: "A" },
      { hash: "2", message: "random commit message", author: "B" },
      { hash: "3", message: "WIP: work in progress", author: "C" },
    ])

    const result = await generateChangelog("v@", "test/repo")

    const call = (mockWriteChangelog.mock.calls as any)[0]?.[0]
    expect(call).toBeDefined()
    expect(call.prefix).toBe("v@")
    expect(call.version).toBe("1.2.0")
    expect(call.features).toEqual(["feature (A) [[1](https://github.com/undefined/commit/1)]"])
    expect(call.fixes).toEqual([])
    expect(call.chores.length).toBe(2)
    expect(call.chores).toContain("random commit message (B) [[2](https://github.com/undefined/commit/2)]")
    // "WIP: work in progress" gets parsed as a conventional commit type "WIP"
    expect(call.chores).toContain("work in progress (C) [[3](https://github.com/undefined/commit/3)]")
    expect(result.generated).toBe(true)
  })

  it("should handle multiple commits with same scope", async () => {
    mockGetLatestTag.mockResolvedValue("v@2.0.0")
    mockGetPreviousTag.mockResolvedValue("v@1.9.0")
    mockGetCommitsBetween.mockResolvedValue([
      { hash: "1", message: "feat(core): add A", author: "A" },
      { hash: "2", message: "feat(core): add B", author: "B" },
      { hash: "3", message: "fix(core): fix C", author: "C" },
    ])

    const result = await generateChangelog("v@", "test/repo")

    expect(mockWriteChangelog).toHaveBeenCalledWith({
      prefix: "v@",
      version: "2.0.0",
      features: ["**core**: add A (A) [[1](https://github.com/undefined/commit/1)]", "**core**: add B (B) [[2](https://github.com/undefined/commit/2)]"],
      fixes: ["**core**: fix C (C) [[3](https://github.com/undefined/commit/3)]"],
      chores: [],
    })
    expect(result.generated).toBe(true)
  })

  it("should return metadata about the changelog generation", async () => {
    mockGetLatestTag.mockResolvedValue("v@1.2.0")
    mockGetPreviousTag.mockResolvedValue("v@1.1.0")
    mockGetCommitsBetween.mockResolvedValue([
      { hash: "1", message: "feat: feature", author: "A" },
      { hash: "2", message: "fix: fix", author: "B" },
    ])

    const result = await generateChangelog("v@", "test/repo")

    expect(result.generated).toBe(true)
    expect(result.version).toBe("1.2.0")
    expect(result.commitCount).toBe(2)
    expect(result.from).toBe("v@1.1.0")
    expect(result.to).toBe("v@1.2.0")
  })

  it("should handle empty features and fixes arrays", async () => {
    mockGetLatestTag.mockResolvedValue("v@1.0.1")
    mockGetPreviousTag.mockResolvedValue("v@1.0.0")
    mockGetCommitsBetween.mockResolvedValue([
      { hash: "1", message: "chore: update deps", author: "A" },
      { hash: "2", message: "docs: update readme", author: "B" },
    ])

    const result = await generateChangelog("v@", "test/repo")

    const call = (mockWriteChangelog.mock.calls as any)[0]?.[0]
    expect(call).toBeDefined()
    expect(call.prefix).toBe("v@")
    expect(call.version).toBe("1.0.1")
    expect(call.features).toEqual([])
    expect(call.fixes).toEqual([])
    expect(call.chores.length).toBe(2)
    expect(call.chores).toContain("update deps (A) [[1](https://github.com/undefined/commit/1)]")
    expect(call.chores).toContain("update readme (B) [[2](https://github.com/undefined/commit/2)]")
    expect(result.generated).toBe(true)
  })
})

