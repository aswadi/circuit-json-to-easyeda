import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import {
  EasyEdaLibrary,
  EasyEdaPin,
  EasyEdaWire,
  parseEasyEdaSource,
} from "easyedats"
import { convertCircuitJsonToEasyEda } from "lib"

const schematicCircuitJson: CircuitJson = [
  {
    type: "source_component",
    source_component_id: "source_component_r1",
    ftype: "simple_resistor",
    name: "R1",
    resistance: 150,
    supplier_part_numbers: { jlcpcb: ["C22843"] },
  },
  {
    type: "source_port",
    source_port_id: "source_port_r1_1",
    source_component_id: "source_component_r1",
    name: "pin1",
    pin_number: 1,
    port_hints: ["pin1", "anode"],
  },
  {
    type: "source_port",
    source_port_id: "source_port_r1_2",
    source_component_id: "source_component_r1",
    name: "pin2",
    pin_number: 2,
    port_hints: ["pin2", "cathode"],
  },
  {
    type: "schematic_component",
    schematic_component_id: "schematic_component_r1",
    source_component_id: "source_component_r1",
    center: { x: 0, y: 0 },
    size: { width: 4, height: 2 },
    is_box_with_pins: true,
    symbol_name: "boxresistor_right",
    symbol_display_value: "150Ω",
  },
  {
    type: "schematic_port",
    schematic_port_id: "schematic_port_r1_1",
    schematic_component_id: "schematic_component_r1",
    source_port_id: "source_port_r1_1",
    center: { x: -2.5, y: 0 },
    facing_direction: "left",
    distance_from_component_edge: 0.5,
    pin_number: 1,
    display_pin_label: "1",
    is_connected: true,
  },
  {
    type: "schematic_port",
    schematic_port_id: "schematic_port_r1_2",
    schematic_component_id: "schematic_component_r1",
    source_port_id: "source_port_r1_2",
    center: { x: 2.5, y: 0 },
    facing_direction: "right",
    distance_from_component_edge: 0.5,
    pin_number: 2,
    display_pin_label: "2",
    is_connected: true,
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "schematic_trace_1",
    edges: [
      { from: { x: 2.5, y: 0 }, to: { x: 5, y: 0 } },
      { from: { x: 5, y: 0 }, to: { x: 5, y: -2 } },
    ],
    junctions: [],
  },
]

test("converts schematic components and traces through easyedats", () => {
  const result = convertCircuitJsonToEasyEda({
    circuitJson: schematicCircuitJson,
    kind: "schematic",
    title: "Flashlight",
  })
  const reparsed = parseEasyEdaSource(result.easyEdaSource)

  expect(result.easyEdaDocument.kind).toBe("schematic")
  expect(reparsed.kind).toBe("schematic")
  expect(result.diagnostics).toEqual([])
  const library = result.easyEdaDocument.shapes.find(
    (shape) => shape instanceof EasyEdaLibrary,
  ) as EasyEdaLibrary
  expect(library.customAttributes.get("name")).toBe("R1")
  expect(library.customAttributes.get("JLCPCB Part")).toBe("C22843")
  expect(
    library.children.filter((shape) => shape instanceof EasyEdaPin),
  ).toHaveLength(2)
  expect(
    result.easyEdaDocument.shapes.filter(
      (shape) => shape instanceof EasyEdaWire,
    ),
  ).toHaveLength(1)
})
