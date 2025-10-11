import { describe, it, expect, mock, beforeEach } from "bun:test"

// Mock simple-git before importing the module that uses it
const mockDiff = mock(async () => "")

mock.module("simple-git", () => ({
  simpleGit: () => ({
    diff: mockDiff,
  }),
}))

// Import after mocking
const { getChangedFilesSince, getChangedFolders } = await import("../../src/git/diff")

describe("diff", () => {
  beforeEach(() => {
    mockDiff.mockClear()
  })

  describe("getChangedFilesSince", () => {
    it("should return changed files since a tag", async () => {
      mockDiff.mockResolvedValue("file1.ts\nfile2.ts\nfile3.ts")

      const result = await getChangedFilesSince("v1.0.0")

      expect(mockDiff).toHaveBeenCalledWith(["--name-only", "v1.0.0..HEAD"])
      expect(result).toEqual(["file1.ts", "file2.ts", "file3.ts"])
    })

    it("should filter out empty lines", async () => {
      mockDiff.mockResolvedValue("file1.ts\n\nfile2.ts\n\n\nfile3.ts\n")

      const result = await getChangedFilesSince("v1.0.0")

      expect(result).toEqual(["file1.ts", "file2.ts", "file3.ts"])
    })

    it("should handle no changed files", async () => {
      mockDiff.mockResolvedValue("")

      const result = await getChangedFilesSince("v1.0.0")

      expect(result).toEqual([])
    })

    it("should handle single file change", async () => {
      mockDiff.mockResolvedValue("README.md")

      const result = await getChangedFilesSince("v2.0.0")

      expect(mockDiff).toHaveBeenCalledWith(["--name-only", "v2.0.0..HEAD"])
      expect(result).toEqual(["README.md"])
    })

    it("should handle nested file paths", async () => {
      mockDiff.mockResolvedValue("src/utils/helper.ts\npackages/cli/index.ts\napps/web/app.tsx")

      const result = await getChangedFilesSince("v1.5.0")

      expect(result).toEqual([
        "src/utils/helper.ts",
        "packages/cli/index.ts",
        "apps/web/app.tsx",
      ])
    })

    it("should handle tags with different formats", async () => {
      mockDiff.mockResolvedValue("file.ts")

      await getChangedFilesSince("cli-v1.0.0")
      expect(mockDiff).toHaveBeenCalledWith(["--name-only", "cli-v1.0.0..HEAD"])

      await getChangedFilesSince("@scope/package@1.0.0")
      expect(mockDiff).toHaveBeenCalledWith(["--name-only", "@scope/package@1.0.0..HEAD"])
    })
  })

  describe("getChangedFolders", () => {
    it("should return top-level folders for changed files", async () => {
      mockDiff.mockResolvedValue("packages/cli/src/index.ts\napps/web/src/app.tsx\npackages/core/utils.ts")

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(mockDiff).toHaveBeenCalledWith(["--name-only", "v1.0.0", "v2.0.0"])
      expect(result).toEqual(["apps/web", "packages/cli", "packages/core"])
    })

    it("should deduplicate folders", async () => {
      mockDiff.mockResolvedValue(
        "packages/cli/src/index.ts\npackages/cli/src/utils.ts\npackages/cli/README.md"
      )

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["packages/cli"])
    })

    it("should handle root-level files", async () => {
      mockDiff.mockResolvedValue("README.md\npackage.json\ntsconfig.json")

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["README.md", "package.json", "tsconfig.json"])
    })

    it("should handle mix of root and nested files", async () => {
      mockDiff.mockResolvedValue("README.md\npackages/cli/index.ts\napps/web/app.tsx")

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["README.md", "apps/web", "packages/cli"])
    })

    it("should sort folders alphabetically", async () => {
      mockDiff.mockResolvedValue("zeta/file.ts\nalpha/file.ts\nbeta/file.ts")

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["alpha/file.ts", "beta/file.ts", "zeta/file.ts"])
    })

    it("should handle no changed files", async () => {
      mockDiff.mockResolvedValue("")

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual([])
    })

    it("should extract first two levels for monorepo structure", async () => {
      mockDiff.mockResolvedValue(
        "packages/cli/src/utils/helper.ts\npackages/cli/tests/unit/test.ts\napps/web/src/components/Button.tsx"
      )

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["apps/web", "packages/cli"])
    })

    it("should handle deeply nested files", async () => {
      mockDiff.mockResolvedValue(
        "packages/cli/src/deep/nested/path/file.ts\napps/web/very/deep/structure/component.tsx"
      )

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["apps/web", "packages/cli"])
    })

    it("should handle multiple files in same folder", async () => {
      mockDiff.mockResolvedValue(
        "packages/cli/file1.ts\npackages/cli/file2.ts\npackages/cli/file3.ts\napps/web/app.tsx"
      )

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["apps/web", "packages/cli"])
    })

    it("should handle commit hashes as from/to", async () => {
      mockDiff.mockResolvedValue("packages/cli/index.ts")

      await getChangedFolders("abc123", "def456")

      expect(mockDiff).toHaveBeenCalledWith(["--name-only", "abc123", "def456"])
    })

    it("should handle HEAD as from or to", async () => {
      mockDiff.mockResolvedValue("packages/cli/index.ts")

      await getChangedFolders("v1.0.0", "HEAD")

      expect(mockDiff).toHaveBeenCalledWith(["--name-only", "v1.0.0", "HEAD"])
    })

    it("should filter out empty lines in diff output", async () => {
      mockDiff.mockResolvedValue("packages/cli/index.ts\n\n\napps/web/app.tsx\n\n")

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["apps/web", "packages/cli"])
    })

    it("should handle single file change", async () => {
      mockDiff.mockResolvedValue("packages/cli/index.ts")

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["packages/cli"])
    })

    it("should handle files with special characters in names", async () => {
      mockDiff.mockResolvedValue("packages/@my-org/cli/index.ts\napps/my-app.v2/app.tsx")

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["apps/my-app.v2", "packages/@my-org"])
    })

    it("should deduplicate when multiple files in same top-level folder", async () => {
      mockDiff.mockResolvedValue(
        "packages/cli/a.ts\npackages/core/b.ts\npackages/cli/c.ts\npackages/utils/d.ts\npackages/core/e.ts"
      )

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(result).toEqual(["packages/cli", "packages/core", "packages/utils"])
    })
  })

  describe("edge cases", () => {
    it("should handle diff with only newlines", async () => {
      mockDiff.mockResolvedValue("\n\n\n")

      const files = await getChangedFilesSince("v1.0.0")
      const folders = await getChangedFolders("v1.0.0", "v2.0.0")

      expect(files).toEqual([])
      expect(folders).toEqual([])
    })

    it("should handle diff with whitespace", async () => {
      mockDiff.mockResolvedValue("  packages/cli/index.ts  \n  apps/web/app.tsx  ")

      const result = await getChangedFolders("v1.0.0", "v2.0.0")

      // Note: This tests current behavior - trimming might be needed in actual implementation
      expect(result).toContain("  packages/cli")
      expect(result).toContain("  apps/web")
    })
  })
})

