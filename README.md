# Nyron

**The easiest way to start versioning.**

Current versioning tools are slow, ritualistic, and break your flow. Nyron automates changelogs, tagging, and releases—powered by your commits, not ceremony. Stay focused on building; Nyron handles the order.

## Why Nyron?

Stop wrestling with manual changelog updates, version bumps, and tag management. If you're writing [conventional commits](https://www.conventionalcommits.org/) (and you should be), Nyron extracts **exactly what you did** and organizes it for you:

- ✅ **Automatic changelog generation** from your commit history
- ✅ **Smart commit grouping** (Features, Bug Fixes, Chores, etc.)
- ✅ **Multi-package support** for monorepos
- ✅ **GitHub integration** for author attribution and commit links
- ✅ **Zero configuration overhead** to get started

Nyron currently depends on GitHub as the source of truth for your repository metadata and commit information.

---

## Quickstart

### 1. Install

```bash
bun add -D @nyron/cli
# or
npm install -D @nyron/cli
```

### 2. Initialize

```bash
npx @nyron/cli init
```

This creates a `nyron.config.ts` file in your project root:

```ts
import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "owner/repo", // Your GitHub repo
  projects: {
    sdk: {
      tagPrefix: "@my-package/sdk@",
      path: "packages/sdk",
    },
    service: {
      tagPrefix: "@my-package/service@",
      path: "apps/service",
    },
  },
  autoChangelog: true,
  onPushReminder: true,
})
```

**Edit this file** to match your project structure. For a single-package repo:

```ts
import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "your-org/your-repo",
  projects: {
    main: {
      tagPrefix: "v",
      path: ".",
    },
  },
  autoChangelog: true,
  onPushReminder: true,
})
```

### 3. Setup GitHub Token (Optional but Recommended)

For enriched changelogs with author links and commit URLs, set a GitHub token:

```bash
# Create .env in your project root
echo "GITHUB_TOKEN=your_github_token_here" > .env
```

Generate a token at [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)

### 4. Start Using Nyron

```bash
# See what commits you have since the last release
npx @nyron/cli diff

# Bump version and auto-generate changelog
npx @nyron/cli bump --type minor --prefix v

# Create and push a git tag
npx @nyron/cli tag --prefix v --version 1.2.0
```

---

## How It Works

Nyron reads your Git history and parses **conventional commits** to generate structured changelogs automatically.

### Conventional Commits Format

```
<type>(<scope>): <message>

Examples:
feat(auth): add OAuth2 login
fix(api): resolve memory leak in endpoint
docs: update installation guide
```

### Commit Types Supported

Nyron recognizes and groups commits by type:

| Type | Group | Description |
|------|-------|-------------|
| `feat` | **Features** | New features |
| `fix` | **Bug Fixes** | Bug fixes |
| `docs` | **Chores** | Documentation changes |
| `refactor` | **Chores** | Code refactoring |
| `perf` | **Chores** | Performance improvements |
| `test` | **Chores** | Test additions/changes |
| `chore` | **Chores** | Maintenance tasks |
| `style` | **Chores** | Code style changes |

### What Nyron Does

1. **Fetches commits** since your last tagged release
2. **Filters out meta commits** (version bumps, changelog updates)
3. **Parses conventional commit syntax** to extract type, scope, and message
4. **Groups commits** into Features, Bug Fixes, and Chores
5. **Enriches with GitHub data** (author usernames, avatars, commit URLs)
6. **Generates markdown** formatted for changelogs

**Example Output:**

```markdown
## Features
- **auth**: add OAuth2 login ([@username](https://github.com/username)) [[a1b2c3d](https://github.com/owner/repo/commit/a1b2c3d)]

## Bug Fixes
- **api**: resolve memory leak in endpoint ([@username](https://github.com/username)) [[e4f5g6h](https://github.com/owner/repo/commit/e4f5g6h)]
```

---

## Commands

### `nyron init`

Initialize Nyron configuration in your project.

```bash
npx @nyron/cli init
```

**Options:**
- `--force` - Overwrite existing config
- `--json` - Generate JSON config instead of TypeScript (coming soon)

---

### `nyron diff`

Show commits since the last release for all or specific projects.

```bash
npx @nyron/cli diff
npx @nyron/cli diff --prefix @my-pkg/sdk@
```

**Options:**
- `-f, --prefix <prefix>` - Filter by tag prefix

Use this to preview what will go into your next changelog.

---

### `nyron bump`

Bump project version and generate changelog automatically.

```bash
npx @nyron/cli bump --type minor --prefix v
```

**Options:**
- `-t, --type <type>` - **Required.** Bump type: `major`, `minor`, `patch`
- `-x, --prefix <prefix>` - **Required.** Tag prefix from your config (e.g., `v`, `@pkg/name@`)

**What it does:**
1. Fetches commits since last tag
2. Generates changelog based on commits
3. Updates `package.json` version
4. Optionally prompts to create a git tag

---

### `nyron tag`

Create and push a new version tag.

```bash
npx @nyron/cli tag --prefix v --version 1.2.0
```

**Options:**
- `-p, --prefix <prefix>` - **Required.** Tag prefix (e.g., `v`, `@my-pkg/sdk@`)
- `-v, --version <version>` - **Required.** Semantic version (e.g., `1.0.0`)

---

## Configuration

The `nyron.config.ts` file defines your versioning strategy:

```ts
import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  // GitHub repository (owner/repo)
  repo: "your-org/your-repo",
  
  // Projects to version (supports monorepos)
  projects: {
    // Key is the project name
    backend: {
      tagPrefix: "@my-app/backend@", // Git tag format
      path: "apps/backend",          // Path to project
    },
    frontend: {
      tagPrefix: "@my-app/frontend@",
      path: "apps/frontend",
    },
  },
  
  // Automatically generate changelog on bump (default: true)
  autoChangelog: true,
  
  // Remind to push tags after creating them (default: true)
  onPushReminder: true,
})
```

---

## Workflow

Here's a typical versioning workflow with Nyron:

```bash
# 1. Check what's changed
npx @nyron/cli diff --prefix v

# 2. Bump version and generate changelog
npx @nyron/cli bump --type minor --prefix v

# 3. Commit the changes
git add .
git commit -m "chore: bump version to 1.2.0"

# 4. Create and push the tag
npx @nyron/cli tag --prefix v --version 1.2.0
git push && git push --tags
```

**Pro tip:** Nyron's `bump` command can remind you to push tags automatically if `onPushReminder: true` in your config.

---

## 🧭 GitHub Merge & Commit Policy

To maintain a clean, linear, and machine-readable git history compatible with changelog automation, this repository must follow the setup below.

### ✅ Required GitHub Settings

**Settings → General → Pull Requests**

| Option | State | Why |
|--------|-------|-----|
| Allow merge commits | ❌ Disabled | Prevents messy "Merge pull request #…" commits that break commit parsing and clutter history. |
| Allow squash merging | ✅ Enabled | Produces one clean commit per PR using the PR title as the message. |
| Allow rebase merging | ✅ Enabled (optional) | Maintains linear history if granular commits are needed. |

**Settings → Branches → Branch protection rules**

This is optional but strongly recommended for production repositories:

| Rule | State | Why |
|------|-------|-----|
| Require pull request before merging | ✅ | Ensures review and title validation. |
| Require status checks to pass | ✅ | Prevents broken or unlinted commits from landing. |
| Require linear history | ✅ | Enforces a flat, merge-free commit tree. |
| Include administrators | ✅ | Prevents accidental overrides. |
| Disallow force pushes | ✅ | Protects commit history integrity. |

### 🧠 Commit & PR Conventions

All PR titles must follow the **Conventional Commit** format.
This ensures changelogs are generated automatically and correctly.

```
type(scope): description (#PR)
```

**Examples:**

```
feat(api): add realtime pub/sub (#42)
fix(auth): correct token refresh (#77)
docs: clarify environment variable setup
chore: update dependencies (#88)
```

---

## FAQ

### Do I need to use conventional commits?

Yes. Nyron parses commit messages to generate changelogs. If your commits don't follow the `type(scope): message` format, they'll be grouped under "Other".

### Can I use this without GitHub?

Not yet. Nyron currently depends on GitHub for repository metadata and enriched commit information (author links, avatars, commit URLs). Support for other platforms is planned.

### Does it work with monorepos?

Absolutely. Define multiple projects in your config with different `tagPrefix` values, and Nyron will track each independently.

### What if I don't have a GitHub token?

Nyron will still work, but changelogs won't include GitHub usernames, avatars, or commit URLs—just the git author name.

---

## License

ISC

---

**Built with ⚡ by [@erebus-sh](https://github.com/erebus-sh)**

Stay focused on building. Nyron handles the order.