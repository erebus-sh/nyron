import { type } from "arktype"

// Define the type for individual project objects.
const projectType = type({
  name: "string",
  version: "string",
})

// Define the overall meta schema using the previously defined projectType.
export const MetaSchema = type({
  batch: "string",
  packages: {
    "*": projectType,
  },
  createdAt: "string",
})

export type Meta = typeof MetaSchema.infer