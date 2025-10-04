#!/usr/bin/env bun
import { program } from "commander"
import { bump } from "./actions/bump"
import { diff } from "./actions/diff"
import { init } from "./actions/init"
import { tag } from "./actions/tag"

program
  .name("nyron")
  .description("Nyron CLI — smarter multi-package versioning")
  .version("0.1.0")

// -----------------------------
// bump
// -----------------------------
program
  .command("bump")
  .description("Bump versions intelligently across projects")
  .option("-m, --major", "Bump major version")
  .option("-i, --minor", "Bump minor version")
  .option("-p, --patch", "Bump patch version")
  .option("-r, --prerelease", "Bump prerelease version")
  .requiredOption("-x, --prefix <prefix>", "Filter to a specific tag prefix")
  .action(bump)

// -----------------------------
// diff
// -----------------------------
program
  .command("diff")
  .description("Show changed packages since their last tagged release")
  .option("-f, --prefix <prefix>", "Filter to a specific tag prefix")
  .action(diff)

// -----------------------------
// init
// -----------------------------
program
  .command("init")
  .description("Create a nyron.config.ts file in the current directory")
  .option("-f, --force", "Overwrite if config already exists")
  .option("--json", "Generate nyron.config.json instead of .ts")
  .action(init)

// -----------------------------
// tag
// -----------------------------
program
  .command("tag")
  .description("Create and record a new version tag for a project")
  .requiredOption("-p, --prefix <prefix>", "Project tag prefix, e.g. @erebus-sh/sdk@")
  .requiredOption("-v, --version <version>", "Version to tag, e.g. 0.1.0")
  .action(tag)

// -----------------------------
// default help
// -----------------------------
program.parse()
