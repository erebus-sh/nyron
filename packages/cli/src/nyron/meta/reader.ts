import path from "path"
import { readFile } from "../../core/files"
import { MetaSchema, type Meta } from "./schema"

export async function readMeta(): Promise<Meta> {
    const metaPath = path.join(process.cwd(), ".nyron", "meta.json")
    const meta = await readFile(metaPath)
    return MetaSchema.assert(JSON.parse(meta))
}