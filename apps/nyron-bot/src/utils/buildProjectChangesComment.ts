import { ProjectChange } from "../hooks/types.js";

type RepoContext = {
  owner: string;
  repo: string;
  headSha?: string;
};

export function buildProjectChangesComment(
  projectChanges: Array<ProjectChange>,
  repo: RepoContext
): string {
  const header = "## Folder changes analysis\n\n";

  // Summary table
  const tableHeader = "| Project | Latest tag | Changed folders |\n|---|---|---|\n";
  const tableRows = projectChanges
    .map(({ projectName, latestTag, changedFolders }) => {
      const tag = latestTag ? `\`${latestTag}\`` : "No tag";
      const changed = changedFolders && changedFolders.length > 0 ? String(changedFolders.length) : "0";
      return `| ${projectName} | ${tag} | ${changed} |`;
    })
    .join("\n");

  const sections = projectChanges
    .map(({ projectName, latestTag, changedFolders }) => {
      const title = `\n<details>\n<summary><strong>${projectName}</strong></summary>\n\n`;

      let body = "";
      if (latestTag) {
        body += `Latest tag: \`${latestTag}\`\n`;
        if (repo.headSha) {
          body += `[Compare](/${repo.owner}/${repo.repo}/compare/${latestTag}...${repo.headSha})\n`;
        }
        if (changedFolders.length > 0) {
          body += `\nChanged folders:\n${changedFolders.map((f) => `- \`${f}\``).join("\n")}\n`;
        } else {
          body += `\nNo folder changes detected since last release\n`;
        }
      } else {
        body += `Latest tag: No tags found with prefix\n`;
        body += `Cannot determine changes without a baseline tag\n`;
      }

      const footer = "\n</details>\n";
      return title + body + footer;
    })
    .join("\n");

  const note = "\n---\nThis analysis compares the pull request against the latest tags for each project. Projects without tags cannot be compared to a baseline.";

  return header + tableHeader + tableRows + "\n" + sections + note;
}


