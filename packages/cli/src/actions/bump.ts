// Get Current tag version from github using the prefix
// Bump the version
// Create a new tag
// Push the tag to github
// Push the changes to the remote repository
// Create a new changelog
// Push the changelog to the remote repository

import { loadConfig } from "../core/loadConfig"
import { type OptionValues } from "commander"

export interface BumpOptions extends OptionValues {
    major?: boolean
    minor?: boolean
    patch?: boolean
    tag?: boolean
    prefix?: string
}
  
export const bump = async (options: BumpOptions) => {
  const config = await loadConfig()
  console.log("🪄 Bumping versions with options:", options)
  console.log("🪄 Loaded Config:", config)
}