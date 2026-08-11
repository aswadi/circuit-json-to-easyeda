import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import {
  EasyEdaLibrary,
  EasyEdaPad,
  EasyEdaTrack,
  parseEasyEdaSource,
} from "easyedats"
import { convertCircuitJsonToEasyEda } from "lib"

const pcbCircuitJson: CircuitJson = [
  {
    type: "source_component",
    source_component_id: "source_component_d1",
    ftype: "simple_led",
    name: "D1",
    supplier_part_numbers: { jlcpcb: ["C2290"] },
  },
  {
    type: "source_port",
    source_port_id: "source_port_d1_1",
    source_component_id: "source_component_d1",
    name: "pin1",
    pin_number: 1,
    port_hints: ["pin1", "anode"],
  },
  {
    type: "pcb_board",
    pcb_board_id: "pcb_board_1",
    center: { x: 0, y: 0 },
    width: 30,
    height: 12,
    thickness: 1.6,
    num_layers: 2,
    material: "fr4",
    solder_mask_color: "green",
    silkscreen_color: "white",
    position_mode: "none",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_d1",
    source_component_id: "source_component_d1",
    center: { x: 5, y: 0 },
    width: 2,
    height: 1,
    layer: "top",
    rotation: 0,
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_d1_1",
    source_port_id: "source_port_d1_1",
    pcb_component_id: "pcb_component_d1",
    x: 4.2,
    y: 0,
    layers: ["top"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_d1_1",
    pcb_component_id: "pcb_component_d1",
    pcb_port_id: "pcb_port_d1_1",
    layer: "top",
    shape: "rect",
    x: 4.2,
    y: 0,
    width: 0.8,
    height: 0.95,
    port_hints: ["1"],
  },
  {
    type: "pcb_silkscreen_path",
    pcb_silkscreen_path_id: "pcb_silk_d1",
    pcb_component_id: "pcb_component_d1",
    layer: "top",
    route: [
      { x: 4, y: -1 },
      { x: 6, y: -1 },
      { x: 6, y: 1 },
    ],
    stroke_width: 0.2,
  },
  {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_1",
    source_trace_id: "source_trace_1",
    route: [
      {
        route_type: "wire",
        x: 4.2,
        y: 0,
        width: 0.2,
        layer: "top",
        start_pcb_port_id: "pcb_port_d1_1",
      },
      { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
    ],
  },
]

test("converts PCB footprints and copper through easyedats", () => {
  const result = convertCircuitJsonToEasyEda({
    circuitJson: pcbCircuitJson,
    kind: "pcb",
    title: "Flashlight PCB",
  })
  const reparsed = parseEasyEdaSource(result.easyEdaSource)

  expect(result.easyEdaDocument.kind).toBe("pcb")
  expect(reparsed.kind).toBe("pcb")
  expect(result.diagnostics).toEqual([])
  const library = result.easyEdaDocument.shapes.find(
    (shape) => shape instanceof EasyEdaLibrary,
  ) as EasyEdaLibrary
  expect(library.customAttributes.get("name")).toBe("D1")
  expect(library.customAttributes.get("JLCPCB Part")).toBe("C2290")
  expect(
    library.children.filter((shape) => shape instanceof EasyEdaPad),
  ).toHaveLength(1)
  expect(
    result.easyEdaDocument.shapes.filter(
      (shape) => shape instanceof EasyEdaTrack,
    ),
  ).toHaveLength(2)
})
