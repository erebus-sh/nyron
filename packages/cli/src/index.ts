#!/usr/bin/env bun
import { program } from "commander"
import { bump } from "./actions/bump"
import { init } from "./actions/init"
import { release } from "./actions/release"
import { BumpType } from "./core/types"
import { pushNyronReleaseTagAction } from "./actions/pushTag"
import { version } from '../package.json'
import { fix } from "./actions/fix"

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
  .command("release")
  .description("Create and push a new release")
  .option("-d, --dry-run", "Dry run the release")
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
// fix
// -----------------------------
program
  .command("fix")
  .description("Validate and repair inconsistencies in your Nyron setup")
  .action(fix)

// -----------------------------
// default help
// -----------------------------
program.parse()
