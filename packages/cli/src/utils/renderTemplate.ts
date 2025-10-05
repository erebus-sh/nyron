import { readFileSync } from "fs"
import { resolve } from "path"
import Handlebars from "handlebars"

export function renderTemplate(templateName: string, data: any) {
  const templatePath = resolve(__dirname, `./templates/changelog/${templateName}.md`)
  const raw = readFileSync(templatePath, "utf-8")
  const compile = Handlebars.compile(raw)
  return compile(data)
}
