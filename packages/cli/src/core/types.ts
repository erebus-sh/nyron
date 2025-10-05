export const BumpType = ["major", "minor", "patch", "prerelease"] as const
export type BumpType = typeof BumpType[number]
