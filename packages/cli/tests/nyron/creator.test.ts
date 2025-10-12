import { describe, it } from "bun:test"
import { createNyronDirectory } from "../../src/nyron/creator"

describe("createNyronDirectory", () => {
    it("should create the nyron directory", async () => {
        await createNyronDirectory()
    })
})