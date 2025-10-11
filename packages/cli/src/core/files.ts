import { promises as fs } from "fs";

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await fs.stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function folderExists(path: string): Promise<boolean> {
  return await fileExists(path) && await isDirectory(path);
}

export async function writeFile(path: string, content: string): Promise<void> {
  await fs.writeFile(path, content, "utf-8");
}

export async function readFile(path: string): Promise<string> {
  return await fs.readFile(path, "utf-8");
}