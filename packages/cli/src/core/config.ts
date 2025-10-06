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

/**
 * Parse a nyron.config.ts file from a string (e.g., from GitHub API)
 * Decodes base64 content and extracts the config object
 */
export function parseConfig(configContent: string, isBase64: boolean = false): NyronConfig {
    // Decode if base64
    const decoded = isBase64 
        ? Buffer.from(configContent, 'base64').toString('utf-8')
        : configContent;
    
    // Remove import statements (including multiline) and extract the config object
    const cleaned = decoded
        .replace(/import\s+[\s\S]*?from\s+['"].*['"]/g, '')
        .replace(/export\s+default\s+defineConfig\s*\(/g, 'return ')
        .replace(/\)[\s]*$/g, '');
    
    // Create a function that returns the config
    const configFn = new Function(cleaned);
    const config = configFn() as NyronConfig;
    
    return config;
}