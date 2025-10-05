import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    // Main entry point
    index: "./src/index.ts",
    "core/config": "./src/core/config.ts",
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