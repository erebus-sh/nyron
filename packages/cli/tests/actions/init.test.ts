import { describe, it, expect, mock, beforeEach, spyOn } from "bun:test"
import { init } from "../../src/actions/init"
import type { InitOptions } from "../../src/actions/types"

// Mock console methods
const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {})

// Mock file system operations
const mockExistsSync = mock(() => false)
const mockWriteFileSync = mock(() => {})

// Mock dependencies
const mockDetectEnvironmentAndOfferInstall = mock(() => Promise.resolve())
const mockCreateNyronDirectory = mock(() => {})

// Mock modules
mock.module("fs", () => ({
  existsSync: mockExistsSync,
  writeFileSync: mockWriteFileSync
}))

mock.module("../../src/utils/detectEnvironment", () => ({
  detectEnvironmentAndOfferInstall: mockDetectEnvironmentAndOfferInstall
}))

mock.module("../../src/nyron/creator", () => ({
  createNyronDirectory: mockCreateNyronDirectory
}))

describe("init", () => {
  beforeEach(() => {
    // Reset all mocks
    mockConsoleLog.mockClear()
    mockExistsSync.mockClear()
    mockWriteFileSync.mockClear()
    mockDetectEnvironmentAndOfferInstall.mockClear()
    mockCreateNyronDirectory.mockClear()

    // Reset to default implementations
    mockExistsSync.mockReturnValue(false)
  })

  it("should create a new nyron.config.ts file when none exists", async () => {
    const options: InitOptions = {}
    
    const result = await init(options)
    
    expect(result.created).toBe(true)
    expect(result.filepath).toContain("nyron.config.ts")
    expect(result.overwritten).toBe(false)
    
    expect(mockDetectEnvironmentAndOfferInstall).toHaveBeenCalledTimes(1)
    expect(mockCreateNyronDirectory).toHaveBeenCalledTimes(1)
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
    expect(mockConsoleLog).toHaveBeenCalledWith("✅ Created nyron.config.ts")
  })

  it("should not overwrite existing config file without force option", async () => {
    mockExistsSync.mockReturnValue(true)
    const options: InitOptions = {}
    
    const result = await init(options)
    
    expect(result.created).toBe(false)
    expect(result.overwritten).toBe(false)
    expect(mockConsoleLog).toHaveBeenCalledWith("⚠️  Configuration already exists: nyron.config.ts")
    expect(mockConsoleLog).toHaveBeenCalledWith("   → Use --force to overwrite")
    expect(mockWriteFileSync).not.toHaveBeenCalled()
    expect(mockCreateNyronDirectory).not.toHaveBeenCalled()
  })

  it("should overwrite existing config file with force option", async () => {
    mockExistsSync.mockReturnValue(true)
    const options: InitOptions = { force: true }
    
    const result = await init(options)
    
    expect(result.created).toBe(true)
    expect(result.overwritten).toBe(true)
    expect(mockDetectEnvironmentAndOfferInstall).toHaveBeenCalledTimes(1)
    expect(mockCreateNyronDirectory).toHaveBeenCalledTimes(1)
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
    expect(mockConsoleLog).toHaveBeenCalledWith("✅ Created nyron.config.ts")
  })

  it("should write correct config content", async () => {
    const options: InitOptions = {}
    
    await init(options)
    
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("nyron.config.ts"),
      expect.stringContaining("import { defineConfig } from \"@nyron/cli/config\""),
      "utf-8"
    )
    
    const call = mockWriteFileSync.mock.calls[0] as any
    expect(call).toBeDefined()
    const writtenContent = call[1] as string
    expect(writtenContent).toContain("export default defineConfig")
    expect(writtenContent).toContain("repo: \"owner/repo\"")
    expect(writtenContent).toContain("projects:")
    expect(writtenContent).toContain("autoChangelog: true")
    expect(writtenContent).toContain("onPushReminder: true")
  })
})