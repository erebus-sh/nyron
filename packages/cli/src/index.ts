#!/usr/bin/env bun
import { defineConfig } from "@nyron/cli/config"

async function main() {
  const [,, cmd, ...args] = process.argv

  switch (cmd) {
    case "bump":
      console.log("🪄 Bumping versions...", args)
      break
    case "diff":
      console.log("🔍 Showing diffs...", args)
      break
    default:
      console.log("Nyron CLI")
      console.log("Usage: nyron [command]")
      console.log("Commands:")
      console.log("  bump        Bump versions")
      console.log("  diff        Show changes since last tag")
  }
}

main()
