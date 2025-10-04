import type { OptionValues } from "commander"

export interface BumpOptions extends OptionValues {
    major?: boolean
    minor?: boolean
    patch?: boolean
    tag?: boolean
    prefix?: string
}
  
export interface DiffOptions extends OptionValues {
    prefix?: string
}

export interface InitOptions extends OptionValues {
    force?: boolean
    json?: boolean
}

export interface TagOptions extends OptionValues {
    prefix: string
    version: string
}