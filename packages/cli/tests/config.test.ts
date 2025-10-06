import { describe, it, expect } from "bun:test"
import { defineConfig, parseConfig, type NyronConfig } from "../src/core/config"

describe("config", () => {
  describe("defineConfig", () => {
    it("should return the config object as-is", () => {
      const config: NyronConfig = {
        repo: "erebus-sh/nyron",
        projects: {
          cli: {
            tagPrefix: "cli-v",
            path: "packages/cli",
          },
        },
      }

      const result = defineConfig(config)
      expect(result).toEqual(config)
    })

    it("should handle config with optional fields", () => {
      const config: NyronConfig = {
        repo: "erebus-sh/nyron",
        projects: {
          sdk: {
            tagPrefix: "sdk@",
            path: "packages/sdk",
          },
        },
        autoChangelog: true,
        onPushReminder: false,
      }

      const result = defineConfig(config)
      expect(result).toEqual(config)
      expect(result.autoChangelog).toBe(true)
      expect(result.onPushReminder).toBe(false)
    })

    it("should handle multiple projects", () => {
      const config: NyronConfig = {
        repo: "erebus-sh/nyron",
        projects: {
          cli: { tagPrefix: "cli-v", path: "packages/cli" },
          sdk: { tagPrefix: "sdk@", path: "packages/sdk" },
          core: { tagPrefix: "core-v", path: "packages/core" },
        },
      }

      const result = defineConfig(config)
      expect(Object.keys(result.projects)).toHaveLength(3)
    })
  })

  describe("parseConfig", () => {
    it("should parse a valid TypeScript config string", () => {
      const configString = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
  },
  autoChangelog: false,
  onPushReminder: false,
})`

      const result = parseConfig(configString)
      
      expect(result.repo).toBe("erebus-sh/nyron")
      expect(result.projects["cli"]!.tagPrefix).toBe("cli-v")
      expect(result.projects["cli"]!.path).toBe("packages/cli")
      expect(result.autoChangelog).toBe(false)
      expect(result.onPushReminder).toBe(false)
    })

    it("should parse base64-encoded config", () => {
      const configString = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
  },
})`

      const base64 = Buffer.from(configString).toString('base64')
      const result = parseConfig(base64, true)

      expect(result.repo).toBe("erebus-sh/nyron")
      expect(result.projects["cli"]!.tagPrefix).toBe("cli-v")
      expect(result.projects["cli"]!.path).toBe("packages/cli")
    })

    it("should handle config with multiple projects", () => {
      const configString = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
    sdk: {
      tagPrefix: "sdk@",
      path: "packages/sdk",
    },
  },
})`

      const result = parseConfig(configString)

      expect(Object.keys(result.projects)).toHaveLength(2)
      expect(result.projects["cli"]).toBeDefined()
      expect(result.projects["sdk"]).toBeDefined()
      expect(result.projects["sdk"]!.tagPrefix).toBe("sdk@")
    })

    it("should handle config with only required fields", () => {
      const configString = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
  },
})`

      const result = parseConfig(configString)

      expect(result.repo).toBe("erebus-sh/nyron")
      expect(result.autoChangelog).toBeUndefined()
      expect(result.onPushReminder).toBeUndefined()
    })

    it("should handle config with single quotes", () => {
      const configString = `import { defineConfig } from '@nyron/cli/config'

export default defineConfig({
  repo: 'erebus-sh/nyron',
  projects: {
    cli: {
      tagPrefix: 'cli-v',
      path: 'packages/cli',
    },
  },
})`

      const result = parseConfig(configString)

      expect(result.repo).toBe("erebus-sh/nyron")
      expect(result.projects["cli"]!.tagPrefix).toBe("cli-v")
    })

    it("should handle config with extra whitespace", () => {
      const configString = `
      import { defineConfig } from "@nyron/cli/config"
      
      
      export default defineConfig({
        repo: "erebus-sh/nyron",
        projects: {
          cli: {
            tagPrefix: "cli-v",
            path: "packages/cli",
          },
        },
      })
      
      `

      const result = parseConfig(configString)

      expect(result.repo).toBe("erebus-sh/nyron")
      expect(result.projects["cli"]).toBeDefined()
    })

    it("should handle multiline import statement", () => {
      const configString = `import {
  defineConfig
} from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
  },
})`

      const result = parseConfig(configString)

      expect(result.repo).toBe("erebus-sh/nyron")
    })

    it("should parse GitHub API response format", () => {
      // Simulate what GitHub API returns
      const rawConfig = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
  },
  autoChangelog: true,
  onPushReminder: true,
})`

      const base64Content = Buffer.from(rawConfig).toString('base64')
      const result = parseConfig(base64Content, true)

      expect(result.repo).toBe("erebus-sh/nyron")
      expect(result.projects["cli"]!.tagPrefix).toBe("cli-v")
      expect(result.autoChangelog).toBe(true)
      expect(result.onPushReminder).toBe(true)
    })

    it("should handle config with boolean values", () => {
      const configString = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
  },
  autoChangelog: true,
  onPushReminder: false,
})`

      const result = parseConfig(configString)

      expect(result.autoChangelog).toBe(true)
      expect(result.onPushReminder).toBe(false)
    })

    it("should handle tag prefixes with special characters", () => {
      const configString = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    sdk: {
      tagPrefix: "@my-org/sdk@",
      path: "packages/sdk",
    },
  },
})`

      const result = parseConfig(configString)

      expect(result.projects["sdk"]!.tagPrefix).toBe("@my-org/sdk@")
    })

    it("should handle nested paths", () => {
      const configString = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "apps/internal/packages/cli",
    },
  },
})`

      const result = parseConfig(configString)

      expect(result.projects["cli"]!.path).toBe("apps/internal/packages/cli")
    })
  })

  describe("parseConfig edge cases", () => {
    it("should throw on invalid JavaScript syntax", () => {
      const invalidConfig = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v"
      path: "packages/cli",  // Missing comma
    },
  },
})`

      expect(() => parseConfig(invalidConfig)).toThrow()
    })

    it("should handle empty projects object", () => {
      const configString = `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "erebus-sh/nyron",
  projects: {},
})`

      const result = parseConfig(configString)

      expect(result.projects).toEqual({})
    })
  })
})

