import { describe, it, expect } from "bun:test"
import { MetaSchema } from "../../src/nyron/meta/schema"

describe("MetaSchema", () => {
  it("should be valid", () => {
    const meta = MetaSchema.assert({
      batch: "test",
      packages: [
        {
          name: "test",
          version: "1.0.0"
        }
    ],
      createdAt: new Date(),
      latestTag: "nyron-release@2021-01-01"
    })
    expect(meta).toBeDefined()
  })
})