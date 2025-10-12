import { pushNyronReleaseTag } from "../github/tags"
import { loadConfig } from "../config/loader"

export const pushNyronReleaseTagAction = async () => {
  const { config } = await loadConfig()
  await pushNyronReleaseTag(config.repo)
}