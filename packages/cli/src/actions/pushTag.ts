import { pushNyronReleaseTag } from "../github/tags"
import { loadConfig } from "../config/loader"
import { setMetaLatestTag } from "../nyron/meta/writer"

export const pushNyronReleaseTagAction = async () => {
  const { config } = await loadConfig()
  const { tag } = await pushNyronReleaseTag(config.repo)
  
  // Update meta.json with the new tag
  await setMetaLatestTag(tag)
  console.log(`✅ Updated meta.json with latest tag: ${tag}`)
}