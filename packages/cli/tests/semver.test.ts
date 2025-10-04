import { bumpVersion, isNewer, isBeta, enterBeta, isOlder } from "../src/core/semver"
import { describe, it, expect } from "bun:test"

describe("semver", () => {
  it("should bump the version", () => {
    const result = bumpVersion("0.1.2", "major")
    console.log("bumpVersion('0.1.2', 'major') =", result)
    expect(result).toBe("1.0.0")
  })
  it("should enter beta", () => {
    const result = enterBeta("0.1.2")
    console.log("enterBeta('0.1.2') =", result)
    expect(result).toBe("0.1.3-beta.0")
  })
  it("should enter beta and increment the version", () => {
    const betaVersion = enterBeta("0.1.2")
    expect(betaVersion).toBe("0.1.3-beta.0")
    const nextBetaMajor = bumpVersion(betaVersion, 'prerelease')
    console.log("bumpVersion('0.1.3-beta.0', 'prerelease') =", nextBetaMajor)
    expect(nextBetaMajor).toBe("0.1.3-beta.1")
  })
  it("should check if the version is beta", () => {
    const result = isBeta("0.1.2-beta.0")
    console.log("isBeta('0.1.2-beta.0') =", result)
    expect(result).toBe(true)
  })
  it("should check if the version is newer", () => {
    const result = isNewer("0.1.2", "0.1.1")
    console.log("isNewer('0.1.2', '0.1.1') =", result)
    expect(result).toBe(true)
  })
  it("should check if the version is older", () => {
    const result = isOlder("0.1.1", "0.1.2")
    console.log("isOlder('0.1.1', '0.1.2') =", result)
    expect(result).toBe(true)
  })
})