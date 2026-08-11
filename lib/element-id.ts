export function toEasyEdaShapeId(circuitElementId: string): string {
  const safeId = circuitElementId
    .trim()
    .replace(/[^A-Za-z0-9_-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
  return `gge-${safeId || "element"}`
}

export function getCircuitElementId(
  element: Record<string, unknown>,
): string | undefined {
  for (const [key, candidate] of Object.entries(element)) {
    if (key.endsWith("_id") && typeof candidate === "string") return candidate
  }
  return undefined
}
