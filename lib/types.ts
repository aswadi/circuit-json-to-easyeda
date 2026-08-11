import type { CircuitJson } from "circuit-json"
import type { EasyEdaPcb, EasyEdaSchematic } from "easyedats/lib/index"

export type CircuitJsonToEasyEdaKind = "schematic" | "pcb"

export interface CircuitJsonToEasyEdaDiagnostic {
  code: "input-error" | "invalid-geometry" | "unsupported-element"
  severity: "warning" | "error"
  message: string
  circuitElementType?: string
  circuitElementId?: string
}

export interface ConvertCircuitJsonToEasyEdaInput {
  circuitJson: CircuitJson
  kind: CircuitJsonToEasyEdaKind
  title?: string
}

export interface ConvertCircuitJsonToEasyEdaResult {
  easyEdaDocument: EasyEdaSchematic | EasyEdaPcb
  easyEdaSource: string
  diagnostics: CircuitJsonToEasyEdaDiagnostic[]
}
