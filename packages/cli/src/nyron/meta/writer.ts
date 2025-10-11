import path from "path"
import type { Meta } from "./schema"
import { writeFile } from "../../core/files"
import { META_ROOT_PATH } from "./file-parser"
import { readMeta } from "./reader"
import { bumpVersion } from "../../core/semver"
import type { BumpType } from "../../core/types"
    
export async function writeMeta(meta: Meta) {
    const metaPath = path.join(process.cwd(), META_ROOT_PATH)
    await writeFile(metaPath, JSON.stringify(meta, null, 2))
}

export async function bumpMetaVersionOfPrefix(prefix: string, type: BumpType) {
    const meta = await readMeta()
    const project = meta.packages.find(p => p.name === prefix)
    if (!project) {
        throw new Error(`Project with prefix ${prefix} not found`)
    }
    const newPackages = meta.packages.map(p =>
        p.name === prefix
            ? { ...p, version: bumpVersion(p.version, type) }
            : p
    ) as typeof meta.packages
    const newMeta: Meta = { ...meta, packages: newPackages }
    await writeMeta(newMeta)
}

export async function setMetaLatestTag(tag: string) {
    const meta = await readMeta()
    const newMeta: Meta = { ...meta, latestTag: tag }
    await writeMeta(newMeta)
}

export async function setMetaCreatedAt(createdAt: Date) {
    const meta = await readMeta()
    const newMeta: Meta = { ...meta, createdAt }
    await writeMeta(newMeta)
}