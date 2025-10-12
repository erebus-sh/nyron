// Mental Model:
//   nyron-release@date... ---- A ---- B ---- C ---- [changelog] ---- nyron-release@date... ---- D ---- E
//                              └──────┬──────┘                                                  └─────┬─────┘
//                              changelog for all versions                                 changelog for all versions
//

import { generateNyronReleaseTag } from "../git/tag-parser"
import { createRelease } from "../github/release"
import type { ReleaseOptions } from "./types"

export const release = async (options: ReleaseOptions) => {
    const { dryRun } = options
    const tag = generateNyronReleaseTag()
    const changelog = await generateChangelog(tag)
    if (dryRun) {
        console.log(changelog)
    } else {
        await createRelease(tag, changelog)
    }
}