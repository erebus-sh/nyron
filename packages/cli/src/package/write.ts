// Writes package.json files
// Only handles versions
// Returns the version

import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

export const writePackageVersion = (path: string, version: string) => {
  const packageJson = JSON.parse(readFileSync(resolve(path, "package.json"), "utf8"))
  packageJson.version = version
  writeFileSync(resolve(path, "package.json"), JSON.stringify(packageJson, null, 2))
}   