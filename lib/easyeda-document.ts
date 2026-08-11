import {
  EasyEdaPcb,
  EasyEdaSchematic,
  type EasyEdaShape,
} from "easyedats/lib/index"

const schematicCanvas =
  "CA~1200~1200~#FFFFFF~yes~#CCCCCC~10~1200~1200~line~10~pixel~5"
const pcbCanvas =
  "CA~2400~2400~#000000~yes~#FFFFFF~10~1200~1200~line~5~mil~9~45~visible~0.5"

const pcbLayers = [
  "1~TopLayer~#FF0000~true~true~true",
  "2~BottomLayer~#0000FF~true~false~true",
  "3~TopSilkLayer~#FFFF00~true~false~true",
  "4~BottomSilkLayer~#808000~true~false~true",
  "5~TopPasterLayer~#808080~false~false~false",
  "6~BottomPasterLayer~#800000~false~false~false",
  "7~TopSolderLayer~#800080~false~false~false",
  "8~BottomSolderLayer~#AA00FF~false~false~false",
  "9~Ratlines~#6464FF~false~false~true",
  "10~BoardOutline~#FF00FF~true~false~true",
  "11~Multi-Layer~#C0C0C0~true~false~true",
  "12~Document~#FFFFFF~true~false~true",
]

export function createEasyEdaSchematicDocument(params: {
  title: string
  shapes: EasyEdaShape[]
}): EasyEdaSchematic {
  return new EasyEdaSchematic({
    head: "1~1.11.3~",
    canvas: schematicCanvas,
    shapes: params.shapes,
    properties: { title: params.title },
    propertyOrder: ["head", "canvas", "shape", "title"],
  })
}

export function createEasyEdaPcbDocument(params: {
  title: string
  shapes: EasyEdaShape[]
}): EasyEdaPcb {
  return new EasyEdaPcb({
    head: "3~1.11.3~",
    canvas: pcbCanvas,
    shapes: params.shapes,
    layers: pcbLayers,
    properties: { title: params.title },
    propertyOrder: ["head", "canvas", "shape", "layers", "title"],
  })
}
