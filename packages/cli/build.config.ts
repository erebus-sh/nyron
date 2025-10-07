import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    // Main entry point
    index: "./src/index.ts",
    "core/config": "./src/core/config.ts",
    // Actions entry points
    "actions/bump": "./src/actions/bump.ts",
    "actions/diff": "./src/actions/diff.ts",
    "actions/init": "./src/actions/init.ts",
    "actions/tag": "./src/actions/tag.ts",
    "actions/types": "./src/actions/types.ts",
    // GitHub helpers
    "github/commits": "./src/github/commits.ts",
    "github/diff": "./src/github/diff.ts",
    "github/pull-requests": "./src/github/pull-requests.ts",
    "github/repo-parser": "./src/github/repo-parser.ts",
    "github/types": "./src/github/types.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  platform: "node",
  // Remove console and debugger on production build
  external: [
    // Dependencies
    "semver",
    "simple-git",
    "octokit",
    "commander",
    "dotenv",
  ],
  sourcemap: true,
  clean: true,
  treeshake: true,
});