import type { OptionValues } from "commander"

export interface BumpOptions extends OptionValues {
    major?: boolean
    minor?: boolean
    patch?: boolean
    tag?: boolean
    prefix?: string
}
  