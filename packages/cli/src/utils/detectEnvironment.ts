import { existsSync, readFileSync, writeFileSync } from "fs"
import { resolve } from "path"
import { exec } from "child_process"
import { ask } from "../core/prompts"

type PackageManager = "bun" | "npm" | "pnpm" | "yarn"

interface PackageManagerInfo {
  name: PackageManager
  lockFile: string
  installCommand: string[]
}

const PACKAGE_MANAGERS: PackageManagerInfo[] = [
  { name: "bun", lockFile: "bun.lock", installCommand: ["bun", "add", "-D", "@nyron/cli"] },
  { name: "npm", lockFile: "package-lock.json", installCommand: ["npm", "install", "--save-dev", "@nyron/cli"] },
  { name: "pnpm", lockFile: "pnpm-lock.yaml", installCommand: ["pnpm", "add", "-D", "@nyron/cli"] },
  { name: "yarn", lockFile: "yarn.lock", installCommand: ["yarn", "add", "-D", "@nyron/cli"] },
]

/**
 * Detects the package manager by checking for lock files in the current directory.
 * Returns the detected package manager or null if none found.
 */
function detectPackageManager(cwd: string): PackageManagerInfo | null {
  for (const pm of PACKAGE_MANAGERS) {
    const lockPath = resolve(cwd, pm.lockFile)
    if (existsSync(lockPath)) {
      return pm
    }
  }
  return null
}

/**
 * Runs the install command for the detected package manager.
 * Returns true if successful, false otherwise.
 */
async function runInstallCommand(pm: PackageManagerInfo, cwd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const command = pm.installCommand.join(" ")
    console.log(`\n⏳ Running: ${command}...\n`)

    const proc = exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.log(`\n⚠️  Install failed: ${error.message}. You can install @nyron/cli manually.`)
        resolve(false)
        return
      }

      if (stderr) {
        process.stderr.write(stderr)
      }
      
      if (stdout) {
        process.stdout.write(stdout)
      }

      console.log(`\n✅ Successfully installed @nyron/cli`)
      resolve(true)
    })

    proc.on("error", (err: Error) => {
      console.log(`\n⚠️  Install failed: ${err.message}. You can install @nyron/cli manually.`)
      resolve(false)
    })
  })
}

/**
 * Optionally adds @nyron/cli to devDependencies in package.json if not already present.
 * This is a backup in case the install command doesn't modify package.json.
 */
function ensureDevDependency(cwd: string): void {
  const pkgPath = resolve(cwd, "package.json")
  
  if (!existsSync(pkgPath)) {
    return
  }

  try {
    const content = readFileSync(pkgPath, "utf8")
    const pkg = JSON.parse(content)

    // Check if @nyron/cli is already in devDependencies
    if (pkg.devDependencies && pkg.devDependencies["@nyron/cli"]) {
      return
    }

    // Add to devDependencies
    if (!pkg.devDependencies) {
      pkg.devDependencies = {}
    }
    
    pkg.devDependencies["@nyron/cli"] = "latest"
    
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8")
  } catch (err) {
    // Silently fail - the install command should handle this
  }
}

/**
 * Prompts the user if they want to install @nyron/cli for type safety.
 * Returns true if user accepts, false otherwise.
 */
async function promptForInstall(pm: PackageManagerInfo): Promise<boolean> {
  const answer = await ask(
    `\n🔍 Detected ${pm.name.toUpperCase()}. Would you like to install @nyron/cli locally for full type safety? (y/n): `
  )
  
  return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes"
}

/**
 * Main function: Detects package manager environment and offers to install @nyron/cli.
 * This function should be called from the init command before writing the config file.
 */
export async function detectEnvironmentAndOfferInstall(): Promise<void> {
  const cwd = process.cwd()
  const pm = detectPackageManager(cwd)

  if (pm) {
    // Package manager detected
    const shouldInstall = await promptForInstall(pm)
    
    if (shouldInstall) {
      const success = await runInstallCommand(pm, cwd)
      
      if (success) {
        // Optionally ensure it's in package.json
        ensureDevDependency(cwd)
      }
    } else {
      console.log("\n⏭️  Skipping installation. You can install @nyron/cli manually later for type safety.")
    }
  } else {
    // No package manager detected
    console.log("\n⚠️  Couldn't detect a package manager or lock file.")
    console.log("   You can still use Nyron, but for full type safety, install @nyron/cli manually:")
    console.log("   • bun add -D @nyron/cli")
    console.log("   • npm install --save-dev @nyron/cli")
    console.log("   • pnpm add -D @nyron/cli")
    console.log("   • yarn add -D @nyron/cli\n")
  }
}

