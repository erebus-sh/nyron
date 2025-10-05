import { join } from "node:path"
import { promises as fs } from "node:fs"

export interface PackageValidation {
  valid: boolean
  path: string
  version?: string
  error?: string
}

/**
 * Validate a package.json file inside a given project directory.
 * Ensures the file exists, is readable, and contains a `version` field.
 *
 * @param basePath - Path to the project (relative or absolute)
 * @returns Promise<PackageValidation>
 */
export async function validatePackage(basePath: string): Promise<PackageValidation> {
  const pkgPath = join(basePath, "package.json")

  try {
    // check if file exists
    await fs.access(pkgPath)

    // read and parse
    const content = await fs.readFile(pkgPath, "utf8")
    const pkg = JSON.parse(content)

    if (typeof pkg.version !== "string") {
      return {
        valid: false,
        path: pkgPath,
        error: `Missing or invalid "version" field in package.json`,
      }
    }

    return {
      valid: true,
      path: pkgPath,
      version: pkg.version,
    }
  } catch (err: any) {
    return {
      valid: false,
      path: pkgPath,
      error: `Failed to validate package.json: ${err.message}`,
    }
  }
}
