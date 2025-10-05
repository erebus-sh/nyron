// Writes package.json files
// Only handles versions
// Returns the version

import { readFileSync, writeFileSync } from "fs"
import { resolve, basename } from "path"

export const writePackageVersion = (path: string, version: string) => {
  // Smart path handling: check if path already points to package.json
  const packageJsonPath = basename(path) === "package.json" 
    ? path 
    : resolve(path, "package.json")
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
  packageJson.version = version
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}   