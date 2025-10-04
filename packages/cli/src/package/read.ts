// Reads package.json files
// Only handles versions
// Returns the version

import { readFileSync } from "fs"
import { resolve } from "path"

export const getPackageVersion = (path: string) => {
  const packageJson = JSON.parse(readFileSync(resolve(path, "package.json"), "utf8"))
  return packageJson.version
}