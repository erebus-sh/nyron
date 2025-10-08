export interface ProjectChange {
    projectName: string;
    latestTag: string | null;
    changedFolders: string[];
    hasChanges: boolean;
  }
  