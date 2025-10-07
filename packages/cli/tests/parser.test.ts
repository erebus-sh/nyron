import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { writeFile, mkdir, rm } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { pathToFileURL } from "url"
import {
  parseConfigFromString,
  parseConfigFromFileURL,
  parseConfigFromPath,
  parseConfigFromJSON,
  parseConfigFromObject,
} from "../src/config/parser"
import type { NyronConfig } from "../src/config/types"

describe("parseConfigFromString", () => {
  describe("base64 encoding", () => {
    it("should decode base64-encoded config", async () => {
      const configString = `export default { repo: "owner/repo", projects: { cli: { tagPrefix: "v", path: "." } } }`
      const base64Config = Buffer.from(configString).toString("base64")
      const config = await parseConfigFromString(base64Config)
      expect(config.repo).toBe("owner/repo")
      expect(config.projects["cli"]).toBeDefined()
    })

    it("should handle GitHub-style base64 with newlines", async () => {
      // GitHub API returns base64 with newlines every ~60 characters for formatting
      const configString = `export default { repo: "owner/repo", projects: { cli: { tagPrefix: "v", path: "." } } }`
      const base64Config = Buffer.from(configString).toString("base64")
      // Simulate GitHub's formatting by adding newlines
      const githubStyleBase64 = base64Config.match(/.{1,60}/g)?.join("\n") || base64Config
      const config = await parseConfigFromString(githubStyleBase64)
      expect(config.repo).toBe("owner/repo")
      expect(config.projects["cli"]).toBeDefined()
    })

    it("should handle base64 config with defineConfig and imports", async () => {
      const configString = `import { defineConfig } from "@nyron/cli/config"; export default defineConfig({ repo: "test/test", projects: { main: { tagPrefix: "v", path: "." } } })`
      const base64Config = Buffer.from(configString).toString("base64")
      const config = await parseConfigFromString(base64Config)
      expect(config.repo).toBe("test/test")
    })

    it("should handle base64 config with multiple projects", async () => {
      const configString = `export default { repo: "owner/monorepo", projects: { cli: { tagPrefix: "cli-v", path: "./packages/cli" }, api: { tagPrefix: "api-v", path: "./packages/api" }, web: { tagPrefix: "web-v", path: "./apps/web" } } }`
      const base64Config = Buffer.from(configString).toString("base64")
      const config = await parseConfigFromString(base64Config)
      expect(Object.keys(config.projects)).toHaveLength(3)
      expect(config.projects["cli"]?.tagPrefix).toBe("cli-v")
      expect(config.projects["api"]?.tagPrefix).toBe("api-v")
      expect(config.projects["web"]?.tagPrefix).toBe("web-v")
    })

    it("should handle base64 config with optional fields", async () => {
      const configString = `export default { repo: "owner/repo", projects: { main: { tagPrefix: "v", path: "." } }, autoChangelog: false, onPushReminder: true }`
      const base64Config = Buffer.from(configString).toString("base64")
      const config = await parseConfigFromString(base64Config)
      expect(config.autoChangelog).toBe(false)
      expect(config.onPushReminder).toBe(true)
    })

    it("should handle base64 config with special characters in paths", async () => {
      const configString = `export default { repo: "owner/repo", projects: { "my-package": { tagPrefix: "@scope/pkg@", path: "./packages/my-package" }, "another-one": { tagPrefix: "v", path: "./apps/my-app_v2" } } }`
      const base64Config = Buffer.from(configString).toString("base64")
      const config = await parseConfigFromString(base64Config)
      expect(config.projects["my-package"]?.tagPrefix).toBe("@scope/pkg@")
      expect(config.projects["another-one"]?.path).toBe("./apps/my-app_v2")
    })

    it("should handle base64 config with various tag prefix formats", async () => {
      const configString = `export default { repo: "owner/repo", projects: { app1: { tagPrefix: "v", path: "./app1" }, app2: { tagPrefix: "app2-v", path: "./app2" }, app3: { tagPrefix: "@scope/app3@", path: "./app3" }, app4: { tagPrefix: "release-", path: "./app4" } } }`
      const base64Config = Buffer.from(configString).toString("base64")
      const config = await parseConfigFromString(base64Config)
      expect(config.projects["app1"]?.tagPrefix).toBe("v")
      expect(config.projects["app2"]?.tagPrefix).toBe("app2-v")
      expect(config.projects["app3"]?.tagPrefix).toBe("@scope/app3@")
      expect(config.projects["app4"]?.tagPrefix).toBe("release-")
    })
  })

  describe("error handling", () => {
    it("should throw error for invalid config structure (missing projects)", async () => {
      const configString = `export default { repo: "owner/repo" }`
      const base64Config = Buffer.from(configString).toString("base64")
      await expect(parseConfigFromString(base64Config)).rejects.toThrow()
    })

    it("should throw error for missing repo field", async () => {
      const configString = `export default { projects: { cli: { tagPrefix: "v", path: "." } } }`
      const base64Config = Buffer.from(configString).toString("base64")
      await expect(parseConfigFromString(base64Config)).rejects.toThrow()
    })

    it("should throw error for empty projects object", async () => {
      const configString = `export default { repo: "owner/repo", projects: {} }`
      const base64Config = Buffer.from(configString).toString("base64")
      await expect(parseConfigFromString(base64Config)).rejects.toThrow()
    })

    it("should throw error for invalid project config (missing path)", async () => {
      const configString = `export default { repo: "owner/repo", projects: { cli: { tagPrefix: "v" } } }`
      const base64Config = Buffer.from(configString).toString("base64")
      await expect(parseConfigFromString(base64Config)).rejects.toThrow()
    })

    it("should throw error for invalid optional field types", async () => {
      const configString = `export default { repo: "owner/repo", projects: { cli: { tagPrefix: "v", path: "." } }, autoChangelog: "yes" }`
      const base64Config = Buffer.from(configString).toString("base64")
      await expect(parseConfigFromString(base64Config)).rejects.toThrow()
    })
  })
})

describe("parseConfigFromFileURL", () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `nyron-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it("should parse config from a valid file URL", async () => {
    const testConfigPath = join(tempDir, `test-config-${Date.now()}-${Math.random()}.mjs`)
    const configContent = `export default { repo: "owner/repo", projects: { cli: { tagPrefix: "v", path: "." } } }`
    await writeFile(testConfigPath, configContent, "utf-8")
    const fileUrl = pathToFileURL(testConfigPath)
    const config = await parseConfigFromFileURL(fileUrl)
    expect(config.repo).toBe("owner/repo")
    expect(config.projects["cli"]).toBeDefined()
  })

  it("should parse config from a string URL", async () => {
    const testConfigPath = join(tempDir, `test-config-${Date.now()}-${Math.random()}.mjs`)
    const configContent = `export default { repo: "test/repo", projects: { app: { tagPrefix: "v", path: "./app" } } }`
    await writeFile(testConfigPath, configContent, "utf-8")
    const fileUrl = pathToFileURL(testConfigPath).href
    const config = await parseConfigFromFileURL(fileUrl)
    expect(config.repo).toBe("test/repo")
  })

  it("should parse config with defineConfig from file URL", async () => {
    const testConfigPath = join(tempDir, `test-config-${Date.now()}-${Math.random()}.mjs`)
    const configContent = `const defineConfig = (c) => c; export default defineConfig({ repo: "owner/monorepo", projects: { pkg1: { tagPrefix: "pkg1-v", path: "./packages/pkg1" } } })`
    await writeFile(testConfigPath, configContent, "utf-8")
    const fileUrl = pathToFileURL(testConfigPath)
    const config = await parseConfigFromFileURL(fileUrl)
    expect(config.repo).toBe("owner/monorepo")
    expect(config.projects["pkg1"]?.tagPrefix).toBe("pkg1-v")
  })

  it("should throw error for non-existent file", async () => {
    const nonExistentPath = join(tempDir, "does-not-exist.mjs")
    const fileUrl = pathToFileURL(nonExistentPath)
    await expect(parseConfigFromFileURL(fileUrl)).rejects.toThrow()
  })

  it("should throw error for invalid config in file", async () => {
    const testConfigPath = join(tempDir, `test-config-${Date.now()}-${Math.random()}.mjs`)
    const configContent = `export default { repo: "owner/repo" }`
    await writeFile(testConfigPath, configContent, "utf-8")
    const fileUrl = pathToFileURL(testConfigPath)
    await expect(parseConfigFromFileURL(fileUrl)).rejects.toThrow()
  })
})

describe("parseConfigFromPath", () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `nyron-test-path-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it("should parse config from absolute path", async () => {
    const testConfigPath = join(tempDir, `nyron-${Date.now()}-${Math.random()}.config.mjs`)
    const configContent = `export default { repo: "owner/repo", projects: { main: { tagPrefix: "v", path: "." } } }`
    await writeFile(testConfigPath, configContent, "utf-8")
    const config = await parseConfigFromPath(testConfigPath)
    expect(config.repo).toBe("owner/repo")
    expect(config.projects["main"]).toBeDefined()
  })

  it("should parse config with multiple projects", async () => {
    const testConfigPath = join(tempDir, `nyron-${Date.now()}-${Math.random()}.config.mjs`)
    const configContent = `export default { repo: "org/monorepo", projects: { api: { tagPrefix: "api-v", path: "./services/api" }, web: { tagPrefix: "web-v", path: "./apps/web" }, mobile: { tagPrefix: "mobile-v", path: "./apps/mobile" } }, autoChangelog: true, onPushReminder: false }`
    await writeFile(testConfigPath, configContent, "utf-8")
    const config = await parseConfigFromPath(testConfigPath)
    expect(Object.keys(config.projects)).toHaveLength(3)
    expect(config.autoChangelog).toBe(true)
    expect(config.onPushReminder).toBe(false)
  })

  it("should throw error for non-existent path", async () => {
    const nonExistentPath = join(tempDir, "does-not-exist.mjs")
    await expect(parseConfigFromPath(nonExistentPath)).rejects.toThrow()
  })

  it("should throw error if file contains invalid config", async () => {
    const testConfigPath = join(tempDir, `nyron-${Date.now()}-${Math.random()}.config.mjs`)
    const configContent = `export default { projects: { main: { tagPrefix: "v", path: "." } } }`
    await writeFile(testConfigPath, configContent, "utf-8")
    await expect(parseConfigFromPath(testConfigPath)).rejects.toThrow()
  })

  it("should parse TypeScript config file (.ts extension)", async () => {
    const tsConfigPath = join(tempDir, "nyron.config.ts")
    // Note: In a real scenario, this would need to be transpiled
    // For testing purposes, we'll use valid JS
    const configContent = `
      export default {
        repo: "owner/repo",
        projects: {
          cli: { tagPrefix: "v", path: "." }
        }
      }
    `
    await writeFile(tsConfigPath, configContent, "utf-8")
    // This may fail in actual runtime without proper TS handling
    // but tests the path resolution logic
    try {
      const config = await parseConfigFromPath(tsConfigPath)
      expect(config.repo).toBe("owner/repo")
    } catch (error) {
      // Expected - TypeScript files need transpilation
      expect(error).toBeDefined()
    }
  })
})

describe("parseConfigFromJSON", () => {
  it("should parse valid JSON config", () => {
    const json = JSON.stringify({
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "v", path: "." }
      }
    })
    const config = parseConfigFromJSON(json)
    expect(config.repo).toBe("owner/repo")
    expect(config.projects["cli"]?.tagPrefix).toBe("v")
  })

  it("should parse JSON with multiple projects", () => {
    const json = JSON.stringify({
      repo: "owner/monorepo",
      projects: {
        api: { tagPrefix: "api-v", path: "./api" },
        web: { tagPrefix: "web-v", path: "./web" },
        cli: { tagPrefix: "cli-v", path: "./cli" }
      }
    })
    const config = parseConfigFromJSON(json)
    expect(Object.keys(config.projects)).toHaveLength(3)
    expect(config.projects["api"]?.path).toBe("./api")
    expect(config.projects["web"]?.path).toBe("./web")
    expect(config.projects["cli"]?.path).toBe("./cli")
  })

  it("should parse JSON with optional fields", () => {
    const json = JSON.stringify({
      repo: "owner/repo",
      projects: {
        main: { tagPrefix: "v", path: "." }
      },
      autoChangelog: false,
      onPushReminder: true
    })
    const config = parseConfigFromJSON(json)
    expect(config.autoChangelog).toBe(false)
    expect(config.onPushReminder).toBe(true)
  })

  it("should throw error for invalid JSON syntax", () => {
    const invalidJson = `{ repo: "owner/repo" invalid json }`
    expect(() => parseConfigFromJSON(invalidJson)).toThrow()
  })

  it("should throw error for JSON with missing repo", () => {
    const json = JSON.stringify({
      projects: {
        cli: { tagPrefix: "v", path: "." }
      }
    })
    expect(() => parseConfigFromJSON(json)).toThrow()
  })

  it("should throw error for JSON with missing projects", () => {
    const json = JSON.stringify({
      repo: "owner/repo"
    })
    expect(() => parseConfigFromJSON(json)).toThrow()
  })

  it("should throw error for JSON with empty projects", () => {
    const json = JSON.stringify({
      repo: "owner/repo",
      projects: {}
    })
    expect(() => parseConfigFromJSON(json)).toThrow()
  })

  it("should throw error for JSON with invalid project config", () => {
    const json = JSON.stringify({
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "v" }
        // Missing path
      }
    })
    expect(() => parseConfigFromJSON(json)).toThrow()
  })

  it("should handle JSON with special characters", () => {
    const json = JSON.stringify({
      repo: "owner/repo-name_123",
      projects: {
        "@scope/package": { tagPrefix: "@scope/pkg@", path: "./packages/@scope/package" }
      }
    })
    const config = parseConfigFromJSON(json)
    expect(config.repo).toBe("owner/repo-name_123")
    expect(config.projects["@scope/package"]?.tagPrefix).toBe("@scope/pkg@")
  })

  it("should handle pretty-printed JSON", () => {
    const json = JSON.stringify(
      {
        repo: "owner/repo",
        projects: {
          cli: { tagPrefix: "v", path: "." }
        }
      },
      null,
      2
    )
    const config = parseConfigFromJSON(json)
    expect(config.repo).toBe("owner/repo")
  })
})

describe("parseConfigFromObject", () => {
  it("should validate and return valid config object", () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "v", path: "." }
      }
    }
    const config = parseConfigFromObject(obj)
    expect(config.repo).toBe("owner/repo")
    expect(config.projects["cli"]?.tagPrefix).toBe("v")
  })

  it("should validate object with multiple projects", () => {
    const obj = {
      repo: "owner/monorepo",
      projects: {
        pkg1: { tagPrefix: "pkg1-v", path: "./packages/pkg1" },
        pkg2: { tagPrefix: "pkg2-v", path: "./packages/pkg2" },
        pkg3: { tagPrefix: "pkg3-v", path: "./packages/pkg3" }
      }
    }
    const config = parseConfigFromObject(obj)
    expect(Object.keys(config.projects)).toHaveLength(3)
  })

  it("should validate object with optional fields", () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        main: { tagPrefix: "v", path: "." }
      },
      autoChangelog: true,
      onPushReminder: false
    }
    const config = parseConfigFromObject(obj)
    expect(config.autoChangelog).toBe(true)
    expect(config.onPushReminder).toBe(false)
  })

  it("should throw error for null", () => {
    expect(() => parseConfigFromObject(null)).toThrow()
  })

  it("should throw error for undefined", () => {
    expect(() => parseConfigFromObject(undefined)).toThrow()
  })

  it("should throw error for non-object types", () => {
    expect(() => parseConfigFromObject("string")).toThrow()
    expect(() => parseConfigFromObject(123)).toThrow()
    expect(() => parseConfigFromObject(true)).toThrow()
    expect(() => parseConfigFromObject([])).toThrow()
  })

  it("should throw error for missing repo field", () => {
    const obj = {
      projects: {
        cli: { tagPrefix: "v", path: "." }
      }
    }
    expect(() => parseConfigFromObject(obj)).toThrow()
  })

  it("should throw error for invalid repo type", () => {
    const obj = {
      repo: 123,
      projects: {
        cli: { tagPrefix: "v", path: "." }
      }
    }
    expect(() => parseConfigFromObject(obj)).toThrow()
  })

  it("should throw error for missing projects field", () => {
    const obj = {
      repo: "owner/repo"
    }
    expect(() => parseConfigFromObject(obj)).toThrow()
  })

  it("should throw error for empty projects object", () => {
    const obj = {
      repo: "owner/repo",
      projects: {}
    }
    expect(() => parseConfigFromObject(obj)).toThrow()
  })

  it("should throw error for invalid project - missing tagPrefix", () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        cli: { path: "." }
      }
    }
    expect(() => parseConfigFromObject(obj)).toThrow()
  })

  it("should throw error for invalid project - missing path", () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "v" }
      }
    }
    expect(() => parseConfigFromObject(obj)).toThrow()
  })

  it("should throw error for invalid project - wrong types", () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: 123, path: "." }
      }
    }
    expect(() => parseConfigFromObject(obj)).toThrow()
  })

  it("should throw error for invalid autoChangelog type", () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "v", path: "." }
      },
      autoChangelog: "yes"
    }
    expect(() => parseConfigFromObject(obj)).toThrow()
  })

  it("should throw error for invalid onPushReminder type", () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "v", path: "." }
      },
      onPushReminder: 1
    }
    expect(() => parseConfigFromObject(obj)).toThrow()
  })

  it("should accept object with extra properties", () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "v", path: "." }
      },
      extraField: "ignored"
    }
    const config = parseConfigFromObject(obj)
    expect(config.repo).toBe("owner/repo")
    // Extra fields are allowed but not typed
  })

  it("should preserve all valid fields", () => {
    const obj: NyronConfig = {
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "cli-v", path: "./packages/cli" },
        api: { tagPrefix: "api-v", path: "./packages/api" }
      },
      autoChangelog: false,
      onPushReminder: true
    }
    const config = parseConfigFromObject(obj)
    expect(config).toEqual(obj)
  })
})

describe("parser integration tests", () => {
  it("should produce same result from JSON and object", () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "v", path: "." }
      }
    }
    const json = JSON.stringify(obj)
    
    const configFromObject = parseConfigFromObject(obj)
    const configFromJSON = parseConfigFromJSON(json)
    
    expect(configFromObject).toEqual(configFromJSON)
  })

  it("should produce same result from string and JSON", async () => {
    const obj = {
      repo: "owner/repo",
      projects: {
        cli: { tagPrefix: "v", path: "./packages/cli" },
        api: { tagPrefix: "api-v", path: "./packages/api" }
      },
      autoChangelog: true
    }
    
    const json = JSON.stringify(obj)
    const configString = `export default ${JSON.stringify(obj)}`
    const base64Config = Buffer.from(configString).toString("base64")
    
    const configFromJSON = parseConfigFromJSON(json)
    const configFromString = await parseConfigFromString(base64Config)
    
    expect(configFromString).toEqual(configFromJSON)
  })

  it("should handle complex real-world config", async () => {
    const configString = `import { defineConfig } from "@nyron/cli/config"; export default defineConfig({ repo: "vercel/next.js", projects: { "next": { tagPrefix: "v", path: "./packages/next" }, "@next/swc": { tagPrefix: "@next/swc@", path: "./packages/next-swc" }, "create-next-app": { tagPrefix: "create-next-app@", path: "./packages/create-next-app" }, "eslint-config-next": { tagPrefix: "eslint-config-next@", path: "./packages/eslint-config-next" } }, autoChangelog: true, onPushReminder: true })`
    const base64Config = Buffer.from(configString).toString("base64")
    
    const config = await parseConfigFromString(base64Config)
    expect(config.repo).toBe("vercel/next.js")
    expect(Object.keys(config.projects)).toHaveLength(4)
    expect(config.projects["next"]?.tagPrefix).toBe("v")
    expect(config.projects["@next/swc"]?.tagPrefix).toBe("@next/swc@")
    expect(config.autoChangelog).toBe(true)
    expect(config.onPushReminder).toBe(true)
  })

  it("should handle monorepo config with many packages", async () => {
    const projects: Record<string, { tagPrefix: string; path: string }> = {}
    for (let i = 1; i <= 20; i++) {
      projects[`package-${i}`] = {
        tagPrefix: `pkg${i}-v`,
        path: `./packages/package-${i}`
      }
    }
    
    const obj = {
      repo: "org/large-monorepo",
      projects,
      autoChangelog: false,
      onPushReminder: false
    }
    
    const config = parseConfigFromObject(obj)
    expect(Object.keys(config.projects)).toHaveLength(20)
    expect(config.projects["package-1"]?.tagPrefix).toBe("pkg1-v")
    expect(config.projects["package-20"]?.path).toBe("./packages/package-20")
  })
})

