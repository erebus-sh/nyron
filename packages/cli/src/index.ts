#!/usr/bin/env bun
import { program } from "commander"
import { bump } from "./actions/bump"
import { init } from "./actions/init"
import { release } from "./actions/release"
import { BumpType } from "./core/types"
import { pushNyronReleaseTagAction } from "./actions/pushTag"
import { version } from '../package.json'

import dotenv from "dotenv"

dotenv.config({
  quiet: true, // Shhh baby girl...
})

program
  .name("nyron")
  .description("Nyron CLI — smart multi-package versioning and changelog management")
  .version(version)

// -----------------------------
// bump
// -----------------------------
// Automatically generates changelog before bumping version
program
  .command("bump")
  .description("Bump project version and generate changelog")
  .requiredOption("-t, --type <type>", `Bump type: ${BumpType.join(", ")}`)
  .requiredOption("-x, --prefix <prefix>", "Tag prefix from config")
  .action(async (options) => {
   await bump(options)

    return
  })


// -----------------------------
// init
// -----------------------------
program
  .command("init")
  .description("Initialize nyron.config.ts in current directory")
  .option("-f, --force", "Overwrite existing config")
  .option("--json", "Generate JSON config instead of TypeScript")
  .action(async (options) => {
    await init(options)
    return
  })

// -----------------------------
// Release
// -----------------------------
program
  .command("tag")
  .description("Create and push a new version tag")
  .requiredOption("-p, --prefix <prefix>", "Tag prefix (e.g., @my-pkg/sdk@)")
  .requiredOption("-v, --version <version>", "Semantic version (e.g., 1.0.0)")
  .action(async (options) => {
    await release(options)
    return
  })

// -----------------------------
// pushTag
// -----------------------------
program
  .command("push-tag")
  .description("Push a new nyron release tag")
  .action(pushNyronReleaseTagAction)

// -----------------------------
// default help
// -----------------------------
program.parse()
