#!/usr/bin/env bun
import { program } from "commander"
import { bump, type BumpOptions } from "./actions/bump"

program
  .name("nyron")
  .description("Nyron CLI")
  .version("0.1.0")

program.on("diff", (options: BumpOptions) => bump(options))

program
  .command("bump")
  .option("-M, --major", "Bump major version")
  .option("-m, --minor", "Bump minor version")
  .option("-p, --patch", "Bump patch version")
  .option("-t, --tag", "Create a new tag")
  .option("-f, --prefix <prefix>", "Prefix the version with a string")
  .description("Bump versions")
  .action((options: BumpOptions) => bump(options))


program
  .command("diff")
  .description("Show changes since last tag")
  .action((...args) => {
    console.log("🔍 Showing diffs...", args.slice(0, -1))
  })

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
