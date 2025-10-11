import { describe, it, expect } from "bun:test"
import { MetaSchema } from "../../src/nyron/meta/schema"

describe("MetaSchema", () => {
  it("should be valid", () => {
    const meta = MetaSchema.assert({
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

  it("should allow latestTag to be undefined", () => {
    const meta = MetaSchema.assert({
      packages: [
        {
          name: "projA",
          version: "0.1.2"
        }
      ],
      createdAt: new Date(),
      latestTag: undefined
    })
    expect(meta).toBeDefined()
    expect(meta.latestTag).toBeUndefined()
  })

  it("should fail if required prop is missing", () => {
    expect(() =>
      MetaSchema.assert({
        packages: [
          {
            name: "bar",
            version: "2.3.4"
          }
        ],
        // createdAt is missing
        latestTag: "nyron-release@2023-12-15"
      })
    ).toThrow()
  })
})
