// Reads package.json files
// Only handles versions
// Returns the version

import { readFileSync, existsSync } from "fs"
import { resolve, basename } from "path"

export const getPackageVersion = (path: string) => {
  const packageJson = JSON.parse(readFileSync(resolve(path, "package.json"), "utf8"))
  return packageJson.version
}

/**
 * Checks if a package.json file exists at the specified path.
 * 
 * @param {string} path - The directory path to check for package.json
 * @returns {boolean} True if package.json exists, false otherwise
 * 
 * @example
 * ```typescript
 * if (packageJsonExists("./my-package")) {
 *   console.log("package.json found!")
 * }
 * ```
 */
export const packageJsonExists = (path: string): boolean => {
  const packageJsonPath = basename(path) === "package.json" 
    ? path 
    : resolve(path, "package.json")
  return existsSync(packageJsonPath)
}

/**
 * Validates that a package.json file exists and has a valid "version" field.
 * 
 * @param {string} path - The directory path containing package.json
 * @returns {boolean} True if package.json exists and has a version field, false otherwise
 * 
 * @example
 * ```typescript
 * if (validatePackageJson("./my-package")) {
 *   console.log("Valid package.json!")
 * }
 * ```
 */
export const validatePackageJson = (path: string): boolean => {
  try {
    const packageJsonPath = basename(path) === "package.json" 
      ? path 
      : resolve(path, "package.json")
    
    if (!existsSync(packageJsonPath)) {
      return false
    }
    
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
    return typeof packageJson.version === "string" && packageJson.version.length > 0
  } catch {
    return false
  }
}