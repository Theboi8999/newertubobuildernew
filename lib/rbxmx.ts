// Generates valid .rbxmx XML files for Roblox Studio

export interface RbxPart {
  name: string
  size: { x: number; y: number; z: number }
  position: { x: number; y: number; z: number }
  color: string
  material: string
  anchored: boolean
  transparency?: number
  shape?: 'Block' | 'Sphere' | 'Cylinder' | 'Wedge'
}

export interface RbxScript {
  name: string
  type: 'Script' | 'LocalScript' | 'ModuleScript'
  source: string
}

export interface RbxModel {
  name: string
  parts: RbxPart[]
  scripts: RbxScript[]
  children?: RbxModel[]
}

// Correct Roblox material enum values
const MATERIAL_ENUM: Record<string, number> = {
  'plastic': 256,
  'smoothplastic': 256,
  'wood': 512,
  'woodplanks': 512,
  'slate': 800,
  'concrete': 816,
  'cobblestone': 832,
  'brick': 848,
  'grass': 1024,
  'sand': 1040,
  'fabric': 1312,
  'glass': 1568,
  'forcefield': 1584,
  'ice': 1536,
  'metal': 1280,
  'corrugatedmetal': 1296,
  'diamondplate': 1552,
  'foil': 1312,
  'neon': 1632,
  'marble': 784,
  'granite': 832,
  'ground': 1040,
}

// Correct Roblox shape enum values
const SHAPE_ENUM: Record<string, number> = {
  'block': 0,
  'sphere': 1,
  'ball': 1,
  'cylinder': 2,
  'wedge': 3,
}

// Valid Roblox BrickColors - map invalid ones to nearest valid
const VALID_COLORS: Record<string, string> = {
  'transparent': 'Institutional white',
  'dark red': 'Crimson',
  'dark blue': 'Navy blue',
  'dark grey': 'Dark grey',
  'dark gray': 'Dark grey',
  'light gray': 'Light grey',
  'grey': 'Medium stone grey',
  'gray': 'Medium stone grey',
  'orange': 'Bright orange',
  'dark orange': 'Neon orange',
  'yellow': 'Bright yellow',
  'green': 'Bright green',
  'blue': 'Bright blue',
  'red': 'Bright red',
  'pink': 'Hot pink',
  'purple': 'Bright violet',
  'brown': 'Reddish brown',
  'tan': 'Brick yellow',
  'beige': 'Brick yellow',
  'cream': 'White',
  'silver': 'Medium stone grey',
  'gold': 'Bright yellow',
  'teal': 'Teal',
  'cyan': 'Cyan',
}

function sanitizeColor(color: string): string {
  const lower = color.toLowerCase().trim()
  return VALID_COLORS[lower] || color
}

function getMaterial(material: string): number {
  const lower = material.toLowerCase().trim()
  return MATERIAL_ENUM[lower] || 256 // default to SmoothPlastic
}

function getShape(shape: string): number {
  const lower = (shape || 'block').toLowerCase().trim()
  return SHAPE_ENUM[lower] || 0 // default to Block
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generatePart(part: RbxPart, id: number): string {
  const materialEnum = getMaterial(part.material)
  const color = sanitizeColor(part.color)
  const transparency = Math.max(0, Math.min(1, part.transparency ?? 0))

  // Ensure valid numbers
  const sx = Math.max(0.05, Number(part.size.x) || 1)
  const sy = Math.max(0.05, Number(part.size.y) || 1)
  const sz = Math.max(0.05, Number(part.size.z) || 1)
  const px = Number(part.position.x) || 0
  const py = Number(part.position.y) || sy / 2
  const pz = Number(part.position.z) || 0

  return `
  <Item class="Part" referent="RBX${id}">
    <Properties>
      <string name="Name">${escapeXml(part.name)}</string>
      <Vector3 name="Size">
        <X>${sx}</X><Y>${sy}</Y><Z>${sz}</Z>
      </Vector3>
      <CoordinateFrame name="CFrame">
        <X>${px}</X><Y>${py}</Y><Z>${pz}</Z>
        <R00>1</R00><R01>0</R01><R02>0</R02>
        <R10>0</R10><R11>1</R11><R12>0</R12>
        <R20>0</R20><R21>0</R21><R22>1</R22>
      </CoordinateFrame>
      <BrickColor name="BrickColor">${escapeXml(color)}</BrickColor>
      <token name="Material">${materialEnum}</token>
      <bool name="Anchored">${part.anchored ? 'true' : 'false'}</bool>
      <float name="Transparency">${transparency}</float>
      <bool name="CanCollide">true</bool>
      <bool name="CastShadow">true</bool>
    </Properties>
  </Item>`
}

function generateScript(script: RbxScript, id: number): string {
  return `
  <Item class="${script.type}" referent="RBX${id}">
    <Properties>
      <string name="Name">${escapeXml(script.name)}</string>
      <ProtectedString name="Source"><![CDATA[${script.source}]]></ProtectedString>
      <bool name="Disabled">false</bool>
    </Properties>
  </Item>`
}

function generateModel(model: RbxModel, startId: number): { xml: string; nextId: number } {
  let id = startId
  let xml = `
  <Item class="Model" referent="RBX${id++}">
    <Properties>
      <string name="Name">${escapeXml(model.name)}</string>
    </Properties>`

  for (const part of model.parts) {
    xml += generatePart(part, id++)
  }
  for (const script of model.scripts || []) {
    xml += generateScript(script, id++)
  }
  for (const child of model.children || []) {
    const result = generateModel(child, id)
    xml += result.xml
    id = result.nextId
  }
  xml += `\n  </Item>`
  return { xml, nextId: id }
}

export function buildRbxmx(models: RbxModel[]): string {
  let id = 1
  let itemsXml = ''
  for (const model of models) {
    const result = generateModel(model, id)
    itemsXml += result.xml
    id = result.nextId
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <Meta name="ExplicitAutoJoints">true</Meta>${itemsXml}
</roblox>`
}
