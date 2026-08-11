import type {
  CircuitJson,
  Point,
  SchematicComponent,
  SchematicPort,
  SourcePort,
} from "circuit-json"
import {
  EasyEdaLibrary,
  EasyEdaPin,
  EasyEdaRectangle,
  type EasyEdaShape,
  EasyEdaSchematicText,
  EasyEdaWire,
} from "easyedats/lib/index"
import { toEasyEdaLength, toEasyEdaPoint } from "../coordinates"
import { createEasyEdaSchematicDocument } from "../easyeda-document"
import { toEasyEdaShapeId } from "../element-id"
import type { CircuitJsonToEasyEdaDiagnostic } from "../types"

interface SchematicConversionMaps {
  sourceComponentById: Map<string, SourceComponentElement>
  sourcePortById: Map<string, SourcePort>
  schematicPortsByComponentId: Map<string, SchematicPort[]>
}

type SourceComponentElement = Extract<
  CircuitJson[number],
  { type: "source_component" }
>

function createSchematicText(params: {
  id: string
  text: string
  position: Point
  anchor?: "L" | "C" | "R"
  fontSize?: number
}): EasyEdaSchematicText {
  const point = toEasyEdaPoint(params.position)
  return new EasyEdaSchematicText({
    fields: [
      params.anchor ?? "C",
      String(point.x),
      String(point.y),
      "0",
      "#000080",
      "Arial",
      `${params.fontSize ?? 8}pt`,
      "",
      "",
      "",
      "comment",
      params.text,
      "1",
      "start",
      toEasyEdaShapeId(params.id),
    ],
  })
}

function getPinRotationAndPath(params: {
  direction: SchematicPort["facing_direction"]
  point: Point
}) {
  const pinLength = 5
  if (params.direction === "left") {
    return {
      rotation: 180,
      path: `M ${params.point.x} ${params.point.y} h ${pinLength}`,
    }
  }
  if (params.direction === "right") {
    return {
      rotation: 0,
      path: `M ${params.point.x} ${params.point.y} h -${pinLength}`,
    }
  }
  if (params.direction === "up") {
    return {
      rotation: 90,
      path: `M ${params.point.x} ${params.point.y} v ${pinLength}`,
    }
  }
  return {
    rotation: 270,
    path: `M ${params.point.x} ${params.point.y} v -${pinLength}`,
  }
}

function createSchematicPin(params: {
  schematicPort: SchematicPort
  sourcePort?: SourcePort
}): EasyEdaPin {
  const point = toEasyEdaPoint(params.schematicPort.center)
  const pinNumber =
    params.sourcePort?.pin_number ?? params.schematicPort.pin_number ?? ""
  const label =
    params.schematicPort.display_pin_label ??
    params.sourcePort?.port_hints?.find((hint) => !/^pin\d+$/iu.test(hint)) ??
    params.sourcePort?.name ??
    String(pinNumber)
  const { rotation, path } = getPinRotationAndPath({
    direction: params.schematicPort.facing_direction,
    point,
  })
  const id = toEasyEdaShapeId(params.schematicPort.schematic_port_id)
  const source = [
    `P~show~0~${pinNumber}~${point.x}~${point.y}~${rotation}~${id}`,
    `${point.x}~${point.y}`,
    `${path}~#880000`,
    `0~${point.x}~${point.y - 3}~0~${label}~start~~`,
    `0~${point.x}~${point.y + 3}~0~${pinNumber}~end~~`,
    "~~",
    "~",
  ].join("^^")
  return new EasyEdaPin({ source })
}

function createComponentLibrary(params: {
  schematicComponent: SchematicComponent
  maps: SchematicConversionMaps
}): EasyEdaLibrary {
  const sourceComponent = params.schematicComponent.source_component_id
    ? params.maps.sourceComponentById.get(
        params.schematicComponent.source_component_id,
      )
    : undefined
  const center = toEasyEdaPoint(params.schematicComponent.center)
  const width = Math.max(
    toEasyEdaLength(params.schematicComponent.size.width),
    8,
  )
  const height = Math.max(
    toEasyEdaLength(params.schematicComponent.size.height),
    8,
  )
  const body = new EasyEdaRectangle({
    fields: [
      String(center.x - width / 2),
      String(center.y - height / 2),
      "0",
      "0",
      String(width),
      String(height),
      "#880000",
      "1",
      "0",
      "none",
      toEasyEdaShapeId(
        `${params.schematicComponent.schematic_component_id}-body`,
      ),
    ],
  })
  const reference = sourceComponent?.name ?? "U?"
  const displayValue =
    params.schematicComponent.symbol_display_value ??
    sourceComponent?.manufacturer_part_number ??
    sourceComponent?.ftype ??
    ""
  const ports =
    params.maps.schematicPortsByComponentId.get(
      params.schematicComponent.schematic_component_id,
    ) ?? []
  const children: EasyEdaShape[] = [
    body,
    createSchematicText({
      id: `${params.schematicComponent.schematic_component_id}-reference`,
      text: reference,
      position: {
        x: params.schematicComponent.center.x,
        y:
          params.schematicComponent.center.y +
          params.schematicComponent.size.height / 2 +
          1.2,
      },
    }),
    createSchematicText({
      id: `${params.schematicComponent.schematic_component_id}-value`,
      text: displayValue,
      position: {
        x: params.schematicComponent.center.x,
        y:
          params.schematicComponent.center.y -
          params.schematicComponent.size.height / 2 -
          1.2,
      },
      fontSize: 7,
    }),
    ...ports.map((schematicPort) =>
      createSchematicPin({
        schematicPort,
        sourcePort: params.maps.sourcePortById.get(
          schematicPort.source_port_id,
        ),
      }),
    ),
  ]
  const library = new EasyEdaLibrary({
    fields: [
      String(center.x),
      String(center.y),
      "",
      "",
      "0",
      toEasyEdaShapeId(params.schematicComponent.schematic_component_id),
    ],
    children,
  })
  library.customAttributes.set(
    "package",
    params.schematicComponent.symbol_name ??
      sourceComponent?.ftype ??
      "tscircuit",
  )
  library.customAttributes.set("pre", reference.replace(/\d+$/u, "") || "U")
  library.customAttributes.set("name", reference)
  library.customAttributes.set("value", displayValue)
  const jlcpcbPartNumber = sourceComponent?.supplier_part_numbers?.jlcpcb?.[0]
  if (jlcpcbPartNumber)
    library.customAttributes.set("JLCPCB Part", jlcpcbPartNumber)
  return library
}

function getOrderedTracePoints(
  edges: Array<{ from: Point; to: Point }>,
): Point[] {
  const firstEdge = edges[0]
  if (!firstEdge) return []
  const points = [firstEdge.from, firstEdge.to]
  for (const edge of edges.slice(1)) {
    const previous = points.at(-1)
    if (previous?.x === edge.from.x && previous.y === edge.from.y) {
      points.push(edge.to)
    } else {
      points.push(edge.from, edge.to)
    }
  }
  return points
}

function createSchematicMaps(
  circuitJson: CircuitJson,
): SchematicConversionMaps {
  const sourceComponents = circuitJson.filter(
    (element): element is SourceComponentElement =>
      element.type === "source_component",
  )
  const sourcePorts = circuitJson.filter(
    (element): element is SourcePort => element.type === "source_port",
  )
  const schematicPorts = circuitJson.filter(
    (element): element is SchematicPort => element.type === "schematic_port",
  )
  const schematicPortsByComponentId = new Map<string, SchematicPort[]>()
  for (const schematicPort of schematicPorts) {
    if (!schematicPort.schematic_component_id) continue
    const existing =
      schematicPortsByComponentId.get(schematicPort.schematic_component_id) ??
      []
    existing.push(schematicPort)
    schematicPortsByComponentId.set(
      schematicPort.schematic_component_id,
      existing,
    )
  }
  return {
    sourceComponentById: new Map(
      sourceComponents.map((component) => [
        component.source_component_id,
        component,
      ]),
    ),
    sourcePortById: new Map(
      sourcePorts.map((sourcePort) => [sourcePort.source_port_id, sourcePort]),
    ),
    schematicPortsByComponentId,
  }
}

export function convertSchematicCircuitJson(params: {
  circuitJson: CircuitJson
  title: string
  diagnostics: CircuitJsonToEasyEdaDiagnostic[]
}) {
  const maps = createSchematicMaps(params.circuitJson)
  const shapes: EasyEdaShape[] = []
  for (const schematicComponent of params.circuitJson.filter(
    (element): element is SchematicComponent =>
      element.type === "schematic_component",
  )) {
    shapes.push(createComponentLibrary({ schematicComponent, maps }))
  }
  for (const schematicTrace of params.circuitJson.filter(
    (element) => element.type === "schematic_trace",
  )) {
    const points = getOrderedTracePoints(schematicTrace.edges).map(
      toEasyEdaPoint,
    )
    if (points.length < 2) {
      params.diagnostics.push({
        code: "invalid-geometry",
        severity: "warning",
        message:
          "A schematic trace did not contain at least two connected points.",
        circuitElementType: schematicTrace.type,
        circuitElementId: schematicTrace.schematic_trace_id,
      })
      continue
    }
    shapes.push(
      new EasyEdaWire({
        fields: [
          points.map((point) => `${point.x} ${point.y}`).join(" "),
          "#008800",
          "1",
          "0",
          "none",
          toEasyEdaShapeId(schematicTrace.schematic_trace_id),
        ],
      }),
    )
  }
  return createEasyEdaSchematicDocument({ title: params.title, shapes })
}
