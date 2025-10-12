// Writes package.json files
// Only handles versions
// Returns the version

import { readFileSync, writeFileSync, mkdirSync } from "fs"
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

/**
 * Creates a new package.json file with the specified version and optional name.
 * 
 * @param {string} path - The directory path where package.json should be created
 * @param {string} name - The package name (optional, can be empty)
 * @param {string} version - The initial version for the package
 * 
 * @example
 * ```typescript
 * createPackageJson("./my-package", "my-package", "1.0.0")
 * createPackageJson("./my-package", "", "0.0.0") // without name
 * ```
 */
export const createPackageJson = (path: string, name: string, version: string) => {
  // Ensure the directory exists
  mkdirSync(path, { recursive: true })
  
  const packageJsonPath = resolve(path, "package.json")
  
  const packageJson: { version: string; name?: string } = {
    version: version
  }
  
  // Only add name if provided
  if (name && name.length > 0) {
    packageJson.name = name
  }
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n")
}   