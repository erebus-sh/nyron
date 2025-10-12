import { describe, it } from "bun:test"
import { createNyronDirectory } from "../../src/nyron/creator"

// TODO: mock file system operations

describe("createNyronDirectory", () => {
    it("should create the nyron directory", async () => {
        await createNyronDirectory()
    })
})