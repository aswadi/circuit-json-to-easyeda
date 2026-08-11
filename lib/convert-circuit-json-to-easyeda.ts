import { getCircuitElementId } from "./element-id"
import { convertPcbCircuitJson } from "./pcb/convert-pcb"
import { convertSchematicCircuitJson } from "./schematic/convert-schematic"
import type {
  CircuitJsonToEasyEdaDiagnostic,
  ConvertCircuitJsonToEasyEdaInput,
  ConvertCircuitJsonToEasyEdaResult,
} from "./types"

export function convertCircuitJsonToEasyEda(
  input: ConvertCircuitJsonToEasyEdaInput,
): ConvertCircuitJsonToEasyEdaResult {
  const diagnostics: CircuitJsonToEasyEdaDiagnostic[] = []
  for (const element of input.circuitJson) {
    if (!element.type.endsWith("_error")) continue
    diagnostics.push({
      code: "input-error",
      severity: "error",
      message:
        "message" in element && typeof element.message === "string"
          ? element.message
          : `Circuit JSON contains ${element.type}.`,
      circuitElementType: element.type,
      circuitElementId: getCircuitElementId(element),
    })
  }

  const title = input.title?.trim() || "Tscircuit Design"
  const easyEdaDocument =
    input.kind === "schematic"
      ? convertSchematicCircuitJson({
          circuitJson: input.circuitJson,
          title,
          diagnostics,
        })
      : convertPcbCircuitJson({
          circuitJson: input.circuitJson,
          title,
          diagnostics,
        })

  return {
    easyEdaDocument,
    easyEdaSource: easyEdaDocument.getString(),
    diagnostics,
  }
}

export function convertCircuitJsonToEasyEdaSource(
  input: ConvertCircuitJsonToEasyEdaInput,
): string {
  return convertCircuitJsonToEasyEda(input).easyEdaSource
}
