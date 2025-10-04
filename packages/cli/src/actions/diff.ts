import { loadConfig } from "../core/loadConfig"
import { type DiffOptions } from "./types"

export const diff = async (options: DiffOptions) => {
  const config = await loadConfig()
  console.log("🪄 Bumping versions with options:", options)
  console.log("🪄 Loaded Config:", config)
}