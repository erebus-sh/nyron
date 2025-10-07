import type { NyronConfig, ProjectConfig } from "./types"

/**
 * Validation error details
 */
export class ConfigValidationError extends Error {
  constructor(message: string, public details?: string) {
    super(message)
    this.name = "ConfigValidationError"
  }
}

/**
 * Validates a project configuration
 */
export function validateProjectConfig(
  name: string,
  project: unknown
): asserts project is ProjectConfig {
  if (!project || typeof project !== "object") {
    throw new ConfigValidationError(
      `Invalid project configuration: "${name}"`,
      "Project configuration must be an object"
    )
  }

  const proj = project as Record<string, unknown>

  if (!proj["tagPrefix"] || typeof proj["tagPrefix"] !== "string") {
    throw new ConfigValidationError(
      `Invalid project configuration: "${name}"`,
      "Project must have a 'tagPrefix' field of type string"
    )
  }

  if (!proj["path"] || typeof proj["path"] !== "string") {
    throw new ConfigValidationError(
      `Invalid project configuration: "${name}"`,
      "Project must have a 'path' field of type string"
    )
  }
}

/**
 * Validates a Nyron configuration object
 */
export function validateConfig(config: unknown): asserts config is NyronConfig {
  if (!config || typeof config !== "object") {
    throw new ConfigValidationError(
      "Invalid configuration",
      "Configuration must be an object"
    )
  }

  const cfg = config as Record<string, unknown>

  if (!cfg["repo"] || typeof cfg["repo"] !== "string") {
    throw new ConfigValidationError(
      "Invalid configuration: missing 'repo' field",
      "Config must have a 'repo' field with format 'owner/repo'"
    )
  }

  if (!cfg["projects"] || typeof cfg["projects"] !== "object") {
    throw new ConfigValidationError(
      "Invalid configuration: missing 'projects' field",
      "Config must have a 'projects' object with at least one project"
    )
  }

  const projects = cfg["projects"] as Record<string, unknown>
  const projectNames = Object.keys(projects)

  if (projectNames.length === 0) {
    throw new ConfigValidationError(
      "Invalid configuration: empty 'projects' object",
      "Config must have at least one project defined"
    )
  }

  // Validate each project
  for (const [name, project] of Object.entries(projects)) {
    validateProjectConfig(name, project)
  }

  // Validate optional fields
  if (cfg["autoChangelog"] !== undefined && typeof cfg["autoChangelog"] !== "boolean") {
    throw new ConfigValidationError(
      "Invalid configuration: 'autoChangelog' must be a boolean",
      "The 'autoChangelog' field must be true or false"
    )
  }

  if (cfg["onPushReminder"] !== undefined && typeof cfg["onPushReminder"] !== "boolean") {
    throw new ConfigValidationError(
      "Invalid configuration: 'onPushReminder' must be a boolean",
      "The 'onPushReminder' field must be true or false"
    )
  }
}

