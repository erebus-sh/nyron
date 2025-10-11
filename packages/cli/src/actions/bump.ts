// src/actions/bump.ts
// ------------------------------------------------------------
// Nyron: Smart version bumping workflow
// ------------------------------------------------------------
// Mental Model:
//   sdk@0.0.1 ---- A ---- B ---- C ---- [changelog] ---- sdk@0.0.2 ---- D ---- E
//                  └──────┬──────┘                                └─────┬─────┘
//                  changelog for 0.0.2                        changelog for 0.0.3
//
// When bumping from sdk@0.0.2 → sdk@0.0.3:
// 1. Get commits from sdk@0.0.2 to HEAD (includes D, E, and [changelog] commit)
// 2. Filter out meta commits (version bumps, changelog updates)
// 3. Generate changelog for 0.0.3 using only D, E (real work)
// 4. Commit the changelog
// 5. Create tag sdk@0.0.3 (includes the changelog commit)
//
// Key insight: We filter out "chore: bump" and "chore: update changelog" 
// commits so they don't pollute the changelogs. Users only want to see
// real features, fixes, and meaningful chores.
// ------------------------------------------------------------
// Phase 1: Validate and compute new version
// Phase 2: Generate changelog for NEW version (lastTag → HEAD, filtered)
// Phase 3: Commit the changelog
// Phase 4: Create tag, push, and update package.json
// ------------------------------------------------------------

import type { BumpOptions, BumpResult } from "./types";
import { syncincrementVersion } from "../nyron/versions/sync";

export const bump = async (options: BumpOptions): Promise<BumpResult> => {
  try {
     await syncincrementVersion(options.prefix, options.type)


  } catch (error) {
    console.error(`\n❌ Bump failed:\n${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      prefix: options.prefix,
      error: error instanceof Error ? error.message : String(error),
    }
  }
})