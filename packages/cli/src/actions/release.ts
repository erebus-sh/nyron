// Mental Model:
//   nyron-release@date... ---- A ---- B ---- C ---- [changelog] ---- nyron-release@date... ---- D ---- E
//                              └──────┬──────┘                                                  └─────┬─────┘
//                              changelog for all versions                                 changelog for all versions
//

import { generateNyronReleaseTag } from "../core/tag-parser"
import type { ReleaseOptions } from "./types"

export const release = async (options: ReleaseOptions) => {
    const { dryRun } = options
    const nyronReleaseTag = generateNyronReleaseTag()
    console.log(`🔖 Creating Nyron release tag: ${nyronReleaseTag}`)
    
}