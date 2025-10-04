#!/usr/bin/env bun
import { program } from "commander"
import { bump } from "./actions/bump"
import { diff } from "./actions/diff"
import type { BumpOptions, DiffOptions } from "./actions/types"

program
  .name("nyron")
  .description("Nyron CLI — smarter multi-package versioning")
  .version("0.1.0")

program
  .command("bump")
  .description("Bump versions intelligently across projects")
  .option("-M, --major", "Bump major version")
  .option("-m, --minor", "Bump minor version")
  .option("-p, --patch", "Bump patch version")
  .option("-t, --tag", "Create a new tag after bumping")
  .option("-f, --prefix <prefix>", "Filter to a specific tag prefix")
  .action((options: BumpOptions) => bump(options))

program
  .command("diff")
  .description("Show changed packages since their last tagged release")
  .option("-f, --prefix <prefix>", "Filter to a specific tag prefix")
  .action((options: DiffOptions) => diff(options))

program.parse()
