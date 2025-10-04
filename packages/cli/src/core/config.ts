export interface ProjectConfig {
    tagPrefix: string
    path: string
}

export interface NyronConfig {
    repo: string
    projects: Record<string, ProjectConfig>
    autoChangelog?: boolean
    onPushReminder?: boolean
}

export const defineConfig = (config: NyronConfig) => config
