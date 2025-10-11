import { describe, it, expect, mock, beforeEach, spyOn } from "bun:test"
import type { BumpOptions } from "../src/actions/types"

// Mock console methods
const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {})
const mockConsoleError = spyOn(console, "error").mockImplementation(() => {})
const mockProcessExit = spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called")
}) as any)

// Create mock functions
const mockLoadConfig = mock(() => Promise.resolve({
  config: {
    repo: "test/repo",
    projects: {
      sdk: { tagPrefix: "sdk@", path: "packages/sdk" }
    }
  },
  filepath: "nyron.config.ts",
  isEmpty: false
}))

const mockGetLatestTag = mock(() => Promise.resolve("sdk@0.0.1"))
const mockGetCommitsSince = mock(() => Promise.resolve({
  commitsSince: [
    { hash: "abc123", message: "feat: add feature", author: "Dev" },
    { hash: "def456", message: "fix: bug fix", author: "Dev" }
  ],
  realCommits: [
    { hash: "abc123", message: "feat: add feature", author: "Dev" },
    { hash: "def456", message: "fix: bug fix", author: "Dev" }
  ],
  lastTag: "sdk@0.0.1"
}))
const mockTagExists = mock(() => Promise.resolve(false))
const mockCreateTag = mock(() => Promise.resolve("sdk@0.0.2"))
const mockPushTag = mock(() => Promise.resolve())

const mockValidatePackage = mock(() => Promise.resolve({
  valid: true,
  path: "packages/sdk/package.json"
}))

const mockWritePackageVersion = mock(() => {})

const mockWriteChangelog = mock(() => Promise.resolve())

const mockGitAdd = mock(() => Promise.resolve())
const mockGitStatus = mock(() => Promise.resolve({ files: [{ path: "changelog.md" }] }))
const mockGitCommit = mock(() => Promise.resolve())

const mockSimpleGit = mock(() => ({
  add: mockGitAdd,
  status: mockGitStatus,
  commit: mockGitCommit
}))

// Mock modules
mock.module("../src/config", () => ({
  loadConfig: mockLoadConfig
}))

mock.module("../src/git/tags", () => ({
  getLatestTag: mockGetLatestTag,
  tagExists: mockTagExists,
  createTag: mockCreateTag,
  pushTag: mockPushTag
}))

mock.module("../src/utils/getCommitsSince", () => ({
  getCommitsSince: mockGetCommitsSince,
  formatCommitsSinceLog: mock(() => "commits log")
}))

mock.module("../src/utils/validatePackage", () => ({
  validatePackage: mockValidatePackage
}))

mock.module("../src/core/semver", () => ({
  bumpVersion: mock((version: string, type: string) => {
    const [major, minor, patch] = version.split('.').map(Number)
    if (type === 'patch') return `${major}.${minor}.${patch! + 1}`
    if (type === 'minor') return `${major}.${minor! + 1}.0`
    if (type === 'major') return `${major! + 1}.0.0`
    return version
  })
}))

mock.module("../src/package/write", () => ({
  writePackageVersion: mockWritePackageVersion
}))

mock.module("../src/changelog/write", () => ({
  writeChangelog: mockWriteChangelog
}))

mock.module("../src/changelog/file-parser", () => ({
  buildChangelogPath: mock((prefix: string, version: string) => 
    `.nyron/${prefix}/CHANGELOG-${prefix.replace(/@/g, "_")}-${version}.md`
  )
}))

mock.module("simple-git", () => ({
  simpleGit: mockSimpleGit
}))

// Import after all mocks are set up
const { bump } = await import("../src/actions/bump")

describe("bump", () => {
  beforeEach(() => {
    // Reset all mocks
    mockLoadConfig.mockClear()
    mockGetLatestTag.mockClear()
    mockGetCommitsSince.mockClear()
    mockTagExists.mockClear()
    mockCreateTag.mockClear()
    mockPushTag.mockClear()
    mockValidatePackage.mockClear()
    mockWritePackageVersion.mockClear()
    mockWriteChangelog.mockClear()
    mockGitAdd.mockClear()
    mockGitStatus.mockClear()
    mockGitCommit.mockClear()
    mockSimpleGit.mockClear()
    mockConsoleLog.mockClear()
    mockConsoleError.mockClear()
    mockProcessExit.mockClear()

    // Reset to default implementations
    mockLoadConfig.mockResolvedValue({
      config: {
        repo: "test/repo",
        projects: {
          sdk: { tagPrefix: "sdk@", path: "packages/sdk" }
        }
      },
      filepath: "nyron.config.ts",
      isEmpty: false
    })
    mockGetLatestTag.mockResolvedValue("sdk@0.0.1")
    mockGetCommitsSince.mockResolvedValue({
      commitsSince: [
        { hash: "abc123", message: "feat: add feature", author: "Dev" },
        { hash: "def456", message: "fix: bug fix", author: "Dev" }
      ],
      realCommits: [
        { hash: "abc123", message: "feat: add feature", author: "Dev" },
        { hash: "def456", message: "fix: bug fix", author: "Dev" }
      ],
      lastTag: "sdk@0.0.1"
    })
    mockTagExists.mockResolvedValue(false)
    mockValidatePackage.mockResolvedValue({
      valid: true,
      path: "packages/sdk/package.json"
    })
    mockGitStatus.mockResolvedValue({ files: [{ path: "changelog.md" }] })
  })

  describe("Validation Phase", () => {
    it("should return error when project not found", async () => {
      mockLoadConfig.mockResolvedValue({ 
        config: { repo: "test/repo", projects: {} },
        filepath: "nyron.config.ts",
        isEmpty: false
      } as any)

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No project found with prefix "sdk@"')
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it("should return error when no previous tag found", async () => {
      mockGetLatestTag.mockResolvedValue(null as any)

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No previous tag found for sdk@')
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it("should return error when no new commits since last release", async () => {
      mockGetCommitsSince.mockRejectedValue(
        new Error("❌ No new commits since last release\n   → Make some changes and commit them before bumping")
      )

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No new commits since last release')
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it("should return error when only meta commits found", async () => {
      mockGetCommitsSince.mockRejectedValue(
        new Error("❌ No substantive commits to release\n   → Only version bump and changelog commits found since sdk@0.0.1\n   → Add feature, fix, or other meaningful commits before bumping\n\n   → Make sure you sync your commits to GitHub")
      )

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No substantive commits to release')
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it("should return error when tag already exists", async () => {
      mockTagExists.mockResolvedValue(true)

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Tag sdk@0.0.2 already exists')
      expect(mockConsoleError).toHaveBeenCalled()
    })

    it("should return error when package.json is invalid", async () => {
      mockValidatePackage.mockResolvedValue({
        valid: false,
        path: "packages/sdk/package.json",
        error: "Invalid package.json"
      } as any)

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid package.json')
      expect(mockConsoleError).toHaveBeenCalled()
    })
  })

  describe("Meta Commit Filtering", () => {
    it("should filter out version bump commits", async () => {
      mockGetCommitsSince.mockResolvedValue({
        commitsSince: [
          { hash: "1", message: "feat: new feature", author: "Dev" },
          { hash: "2", message: "chore: bump version to 0.0.1", author: "Dev" },
          { hash: "3", message: "fix: bug fix", author: "Dev" }
        ],
        realCommits: [
          { hash: "1", message: "feat: new feature", author: "Dev" },
          { hash: "3", message: "fix: bug fix", author: "Dev" }
        ],
        lastTag: "sdk@0.0.1"
      } as any)

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)

      // Should succeed and use only the real commits (version bump commit filtered out)
      expect(result.success).toBe(true)
      expect(mockWriteChangelog).toHaveBeenCalled()
    })

    it("should filter out changelog update commits", async () => {
      mockGetCommitsSince.mockResolvedValue({
        commitsSince: [
          { hash: "1", message: "feat: new feature", author: "Dev" },
          { hash: "2", message: "chore: update changelog for sdk@0.0.1", author: "Dev" }
        ],
        realCommits: [
          { hash: "1", message: "feat: new feature", author: "Dev" }
        ],
        lastTag: "sdk@0.0.1"
      } as any)

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)

      // Should succeed and use only 1 real commit (changelog update filtered out)
      expect(result.success).toBe(true)
      expect(mockWriteChangelog).toHaveBeenCalled()
    })

    it("should keep meaningful chore commits", async () => {
      mockGetCommitsSince.mockResolvedValue({
        commitsSince: [
          { hash: "1", message: "chore: update dependencies", author: "Dev" },
          { hash: "2", message: "chore: improve build script", author: "Dev" }
        ],
        realCommits: [
          { hash: "1", message: "chore: update dependencies", author: "Dev" },
          { hash: "2", message: "chore: improve build script", author: "Dev" }
        ],
        lastTag: "sdk@0.0.1"
      } as any)

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)

      // Should succeed and include both meaningful chore commits
      expect(result.success).toBe(true)
      expect(mockWriteChangelog).toHaveBeenCalled()
    })
  })

  describe("Version Bumping", () => {
    it("should bump patch version correctly", async () => {
      mockGetLatestTag.mockResolvedValue("sdk@1.2.3")

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)

      expect(result.success).toBe(true)
      expect(mockCreateTag).toHaveBeenCalledWith("sdk@", "1.2.4")
    })

    it("should bump minor version correctly", async () => {
      mockGetLatestTag.mockResolvedValue("sdk@1.2.3")

      const options: BumpOptions = { prefix: "sdk@", type: "minor" }

      const result = await bump(options)

      expect(result.success).toBe(true)
      expect(mockCreateTag).toHaveBeenCalledWith("sdk@", "1.3.0")
    })

    it("should bump major version correctly", async () => {
      mockGetLatestTag.mockResolvedValue("sdk@1.2.3")

      const options: BumpOptions = { prefix: "sdk@", type: "major" }

      const result = await bump(options)

      expect(result.success).toBe(true)
      expect(mockCreateTag).toHaveBeenCalledWith("sdk@", "2.0.0")
    })
  })

  describe("Changelog Generation", () => {
    it("should generate changelog with correct version", async () => {
      mockGetLatestTag.mockResolvedValue("sdk@1.0.0")
      mockGetCommitsSince.mockResolvedValue({
        commitsSince: [
          { hash: "1", message: "feat: feature A", author: "Dev" },
          { hash: "2", message: "fix: bug B", author: "Dev" }
        ],
        realCommits: [
          { hash: "1", message: "feat: feature A", author: "Dev" },
          { hash: "2", message: "fix: bug B", author: "Dev" }
        ],
        lastTag: "sdk@1.0.0"
      } as any)

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)

      expect(result.success).toBe(true)
      expect(mockWriteChangelog).toHaveBeenCalled()
      const call = mockWriteChangelog.mock.calls[0] as any
      expect(call[0].version).toBe("1.0.1")
      expect(call[0].prefix).toBe("sdk@")
    })

    it("should organize commits by type", async () => {
      mockGetCommitsSince.mockResolvedValue({
        commitsSince: [
          { hash: "1", message: "feat: new feature", author: "Dev" },
          { hash: "2", message: "fix: bug fix", author: "Dev" },
          { hash: "3", message: "chore: update deps", author: "Dev" }
        ],
        realCommits: [
          { hash: "1", message: "feat: new feature", author: "Dev" },
          { hash: "2", message: "fix: bug fix", author: "Dev" },
          { hash: "3", message: "chore: update deps", author: "Dev" }
        ],
        lastTag: "sdk@0.0.1"
      } as any)

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)

      // Verify changelog was generated with organized commits
      expect(result.success).toBe(true)
      expect(mockWriteChangelog).toHaveBeenCalled()
      const call = mockWriteChangelog.mock.calls[0] as any
      expect(call[0].features.length).toBeGreaterThan(0)
      expect(call[0].fixes.length).toBeGreaterThan(0)
    })
  })

  describe("Complete Flow", () => {
    it("should execute all phases in correct order", async () => {
      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)

      expect(result.success).toBe(true)
      
      // Verify all phases were called in order
      expect(mockLoadConfig).toHaveBeenCalled()
      expect(mockGetLatestTag).toHaveBeenCalledWith("sdk@")
      expect(mockGetCommitsSince).toHaveBeenCalledWith("sdk@0.0.1", "test/repo")
      expect(mockValidatePackage).toHaveBeenCalledWith("packages/sdk")
      expect(mockTagExists).toHaveBeenCalledWith("sdk@0.0.2")
      expect(mockWriteChangelog).toHaveBeenCalled()
      expect(mockCreateTag).toHaveBeenCalledWith("sdk@", "0.0.2")
      expect(mockPushTag).toHaveBeenCalledWith("sdk@0.0.2")
      expect(mockWritePackageVersion).toHaveBeenCalledWith(
        "packages/sdk/package.json",
        "0.0.2"
      )
    })

    it("should continue even if changelog commit fails", async () => {
      mockGitAdd.mockRejectedValue(new Error("Git error"))

      const options: BumpOptions = { prefix: "sdk@", type: "patch" }

      const result = await bump(options)

      // Should still create tag and push even if changelog commit fails
      expect(result.success).toBe(true)
      expect(mockCreateTag).toHaveBeenCalled()
      expect(mockPushTag).toHaveBeenCalled()
      expect(mockWritePackageVersion).toHaveBeenCalled()
    })
  })
})
