/**
 * Project-specific configuration for versioning and tagging
 */
export interface ProjectConfig {
  /**
   * Prefix for git tags (e.g., "cli-v", "@my-package/sdk@")
   */
  tagPrefix: string
  
  /**
   * Path to the project directory relative to repo root
   */
  path: string
}

/**
 * Main Nyron configuration object
 */
export interface NyronConfig {
  /**
   * Repository identifier in "owner/repo" format
   */
  repo: string
  
  /**
   * Project configurations keyed by project name
   */
  projects: Record<string, ProjectConfig>
  
  /**
   * Automatically generate changelog on version bump
   * @default true
   */
  autoChangelog?: boolean
  
  /**
   * Show reminder to push tags after creating them
   * @default true
   */
  onPushReminder?: boolean
}

/**
 * Configuration loading options
 */
export interface LoadConfigOptions {
  /**
   * Directory to start searching for config file
   * @default process.cwd()
   */
  searchFrom?: string
  
  /**
   * Config file name (without extension)
   * @default "nyron.config"
   */
  configName?: string
  
  /**
   * Whether to throw error if config not found
   * @default true
   */
  required?: boolean
}

/**
 * Result of config loading operation
 */
export interface LoadConfigResult {
  /**
   * The loaded configuration object
   */
  config: NyronConfig
  
  /**
   * Absolute path to the config file
   */
  filepath: string
  
  /**
   * Whether the config was loaded from cache
   */
  isEmpty: boolean
}

