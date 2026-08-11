import type { Point } from "circuit-json"

/** EasyEDA Standard uses 10 mil (0.254 mm) coordinate units. */
export const EASYEDA_STANDARD_UNIT_TO_MM = 0.254

export const EASYEDA_DOCUMENT_ORIGIN = { x: 400, y: 300 } as const

function roundEasyEdaCoordinate(coordinate: number): number {
  return Math.round(coordinate * 100_000) / 100_000
}

export function toEasyEdaLength(lengthMillimeters: number): number {
  return roundEasyEdaCoordinate(lengthMillimeters / EASYEDA_STANDARD_UNIT_TO_MM)
}

export function toEasyEdaPoint(point: Point): Point {
  return {
    x: roundEasyEdaCoordinate(
      EASYEDA_DOCUMENT_ORIGIN.x + point.x / EASYEDA_STANDARD_UNIT_TO_MM,
    ),
    y: roundEasyEdaCoordinate(
      EASYEDA_DOCUMENT_ORIGIN.y - point.y / EASYEDA_STANDARD_UNIT_TO_MM,
    ),
  }
}

export function toEasyEdaRotation(ccwRotationDegrees = 0): number {
  const clockwiseRotationDegrees = ((-ccwRotationDegrees % 360) + 360) % 360
  return roundEasyEdaCoordinate(clockwiseRotationDegrees)
}
