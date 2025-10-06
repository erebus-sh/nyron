#!/usr/bin/env bun
import { program } from "commander"
import { bump } from "./actions/bump"
import { diff } from "./actions/diff"
import { init } from "./actions/init"
import { tag } from "./actions/tag"
import dotenv from "dotenv"
import { BumpType } from "./core/types"

dotenv.config({
  quiet: true, // Shhh baby girl...
})

program
  .name("nyron")
  .description("Nyron CLI — smart multi-package versioning and changelog management")
  .version("0.4.0")

// -----------------------------
// bump
// -----------------------------
// Automatically generates changelog before bumping version
program
  .command("bump")
  .description("Bump project version and generate changelog")
  .requiredOption("-t, --type <type>", `Bump type: ${BumpType.join(", ")}`)
  .requiredOption("-x, --prefix <prefix>", "Tag prefix from config")
  .action(bump)

// -----------------------------
// diff
// -----------------------------
program
  .command("diff")
  .description("Show commits since last release for all projects")
  .option("-f, --prefix <prefix>", "Filter by tag prefix")
  .action(diff)

// -----------------------------
// init
// -----------------------------
program
  .command("init")
  .description("Initialize nyron.config.ts in current directory")
  .option("-f, --force", "Overwrite existing config")
  .option("--json", "Generate JSON config instead of TypeScript")
  .action(init)

// -----------------------------
// tag
// -----------------------------
program
  .command("tag")
  .description("Create and push a new version tag")
  .requiredOption("-p, --prefix <prefix>", "Tag prefix (e.g., @my-pkg/sdk@)")
  .requiredOption("-v, --version <version>", "Semantic version (e.g., 1.0.0)")
  .action(tag)

// -----------------------------
// default help
// -----------------------------
program.parse()
