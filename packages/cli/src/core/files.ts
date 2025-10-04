import { promises as fs } from "fs";

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function writeFile(path: string, content: string): Promise<void> {
  await fs.writeFile(path, content, "utf-8");
}