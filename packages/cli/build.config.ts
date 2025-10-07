import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    // Main entry point
    index: "./src/index.ts",
    // Config system
    config: "./src/config/index.ts",
    "config/types": "./src/config/types.ts",
    "config/define": "./src/config/define.ts",
    "config/loader": "./src/config/loader.ts",
    "config/parser": "./src/config/parser.ts",
    "config/validator": "./src/config/validator.ts",
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
    "github/tags": "./src/github/tags.ts",
    // Git helpers
    "git/commits-parser": "./src/git/commits-parser.ts",
    "git/diff": "./src/git/diff.ts",
    "git/tag-parser": "./src/git/tag-parser.ts",
    "git/tags": "./src/git/tags.ts",
    "git/types": "./src/git/types.ts",
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
    "cosmiconfig",
  ],
  sourcemap: true,
  clean: true,
  treeshake: true,
});