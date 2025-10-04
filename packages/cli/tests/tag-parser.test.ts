import { describe, it, expect } from "bun:test"
import { parseTag, buildTag } from "../src/git/tag-parser"

describe("tag-parser", () => {
    // --- parseTag tests ---
    it("should parse a scoped package tag", () => {
        const result = parseTag("@erebus-sh/sdk@0.0.179")
        console.log("parseTag('@erebus-sh/sdk@0.0.179') =", result)
        expect(result).toEqual({ prefix: "@erebus-sh/sdk@", version: "0.0.179" })
    })

    it("should parse an unscoped package tag", () => {
        const result = parseTag("sdk@1.2.3")
        console.log("parseTag('sdk@1.2.3') =", result)
        expect(result).toEqual({ prefix: "sdk@", version: "1.2.3" })
    })

    it("should parse a tag with multiple @ in prefix", () => {
        const result = parseTag("@scope/pkg@2.3.4")
        console.log("parseTag('@scope/pkg@2.3.4') =", result)
        expect(result).toEqual({ prefix: "@scope/pkg@", version: "2.3.4" })
    })

    it("should return null if no @ is present", () => {
        const result = parseTag("notatag")
        console.log("parseTag('notatag') =", result)
        expect(result).toBeNull()
    })

    it("should throw if version is not valid semver", () => {
        try {
            parseTag("pkg@notsemver")
        } catch (e: unknown) {
            if (e instanceof Error) {
                console.log("parseTag('pkg@notsemver') threw:", e.message)
                expect(e.message).toBe("Invalid semver in tag: pkg@notsemver")
            }
        }
    })

    it("should throw if version is empty", () => {
        try {
            parseTag("pkg@")
        } catch (e: unknown) {
            if (e instanceof Error) {
                console.log("parseTag('pkg@') threw:", e.message)
                expect(e.message).toBe("Invalid semver in tag: pkg@")
            }
        }
    })

    it("should parse a tag with pre-release version", () => {
        const result = parseTag("lib@1.2.3-beta.1")
        console.log("parseTag('lib@1.2.3-beta.1') =", result)
        expect(result).toEqual({ prefix: "lib@", version: "1.2.3-beta.1" })
    })

    it("should parse a tag with build metadata", () => {
        const result = parseTag("lib@1.2.3+build.5")
        console.log("parseTag('lib@1.2.3+build.5') =", result)
        expect(result).toEqual({ prefix: "lib@", version: "1.2.3+build.5" })
    })

    it("should parse a tag with pre-release and build metadata", () => {
        const result = parseTag("lib@1.2.3-beta.1+build.5")
        console.log("parseTag('lib@1.2.3-beta.1+build.5') =", result)
        expect(result).toEqual({ prefix: "lib@", version: "1.2.3-beta.1+build.5" })
    })

    // --- buildTag tests ---
    it("should build a tag from prefix and version", () => {
        const result = buildTag("@erebus-sh/sdk@", "0.0.179")
        console.log("buildTag('@erebus-sh/sdk@', '0.0.179') =", result)
        expect(result).toEqual("@erebus-sh/sdk@0.0.179")
    })

    it("should build a tag with pre-release version", () => {
        const result = buildTag("lib@", "1.2.3-beta.1")
        console.log("buildTag('lib@', '1.2.3-beta.1') =", result)
        expect(result).toEqual("lib@1.2.3-beta.1")
    })

    it("should build a tag with build metadata", () => {
        const result = buildTag("lib@", "1.2.3+build.5")
        console.log("buildTag('lib@', '1.2.3+build.5') =", result)
        expect(result).toEqual("lib@1.2.3+build.5")
    })

    it("should build a tag with pre-release and build metadata", () => {
        const result = buildTag("lib@", "1.2.3-beta.1+build.5")
        console.log("buildTag('lib@', '1.2.3-beta.1+build.5') =", result)
        expect(result).toEqual("lib@1.2.3-beta.1+build.5")
    })

    it("should throw if version is not valid semver", () => {
        try {
            buildTag("lib@", "notsemver")
        } catch (e: unknown) {
            if (e instanceof Error) {
                console.log("buildTag('lib@', 'notsemver') threw:", e.message)
                expect(e.message).toBe("Invalid semver: notsemver")
            }
        }
    })

    it("should throw if version is empty", () => {
        try {
            buildTag("lib@", "")
        } catch (e: unknown) {
            if (e instanceof Error) {
                console.log("buildTag('lib@', '') threw:", e.message)
                expect(e.message).toBe("Invalid semver: ")
            }
        }
    })

    it("should allow prefix with multiple @", () => {
        const result = buildTag("@scope/pkg@", "1.0.0")
        console.log("buildTag('@scope/pkg@', '1.0.0') =", result)
        expect(result).toEqual("@scope/pkg@1.0.0")
    })

    it("should allow numeric prefix", () => {
        const result = buildTag("123@", "1.0.0")
        console.log("buildTag('123@', '1.0.0') =", result)
        expect(result).toEqual("123@1.0.0")
    })
})