/**
 * ------------------------------------------------------------
 * Nyron: Version bumping action
 * ------------------------------------------------------------
 * This module provides a simplified version bumping workflow that:
 * 1. Takes a package prefix and bump type (major, minor, patch, etc.)
 * 2. Delegates to syncincrementVersion() to handle the actual version bump
 * 3. Updates both the meta version system and versions tracking
 * 4. Returns a standardized result indicating success/failure
 *
 * The heavy lifting is handled by the sync module, which coordinates
 * between the meta version system and versions file system to ensure
 * consistency across the monorepo.
 * ------------------------------------------------------------
 */

import type { BumpOptions, BumpResult } from "./types";
import { syncincrementVersion } from "../nyron/versions/sync";
import { loadConfig } from "../config/loader";
import { readMeta } from "../nyron/meta/reader";
import { writePackageVersion } from "../package/write";
import { resolve } from "path";

export const bump = async (options: BumpOptions): Promise<BumpResult> => {
  try {
     // Bump the version in meta and versions tracking
     await syncincrementVersion(options.prefix, options.type)
     
     // Load config to get the project path
     const { config } = await loadConfig()
     const projectConfig = config.projects[options.prefix]
     
     if (!projectConfig) {
       throw new Error(`Project "${options.prefix}" not found in config`)
     }
     
     // Read the updated meta to get the new version
     const meta = await readMeta()
     const metaPackage = meta.packages.find(p => p.prefix === options.prefix)
     
     if (!metaPackage) {
       throw new Error(`Package "${options.prefix}" not found in meta`)
     }
     
     // Update the package.json with the new version
     const fullPath = resolve(process.cwd(), projectConfig.path)
     writePackageVersion(fullPath, metaPackage.version)
     
     return {
      success: true,
      prefix: options.prefix,
     }
  } catch (error) {
    console.error(`\n❌ Bump failed:\n${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      prefix: options.prefix,
    }
  }
}