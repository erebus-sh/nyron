export async function ask(question: string): Promise<string> {
  process.stdout.write(question);
  const lineIter = console[Symbol.asyncIterator]();
  const { value: line } = await lineIter.next();
  return typeof line === "string" ? line.trim() : "";
}