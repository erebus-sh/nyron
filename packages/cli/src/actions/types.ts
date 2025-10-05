import type { OptionValues } from "commander"
import type { BumpType } from "../core/types"

export interface BumpOptions extends OptionValues {
    type: BumpType
    prefix: string
}
  
export interface DiffOptions extends OptionValues {
    prefix?: string
}

export interface InitOptions extends OptionValues {
    force?: boolean
}

export interface TagOptions extends OptionValues {
    prefix: string
    version: string
}