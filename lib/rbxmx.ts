// Generates valid .rbxmx XML files for Roblox Studio

export interface RbxPart {
  name: string
  size: { x: number; y: number; z: number }
  position: { x: number; y: number; z: number }
  color: string
  material: string
  anchored: boolean
  transparency?: number
  emissive?: boolean
  partType?: 'Part' | 'WedgePart' | 'CornerWedgePart'
  textureId?: string
}

const MATERIAL_TEXTURES: Record<string, string> = {
  'brick': 'rbxassetid://6372755229',
  'concrete': 'rbxassetid://6372755229',
  'wood': 'rbxassetid://6372755229',
  'metal': 'rbxassetid://6372755229',
  'marble': 'rbxassetid://6372755229',
  'fabric': 'rbxassetid://6372755229',
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

const ME: Record<string, number> = {
  smoothplastic: 256, plastic: 256,
  wood: 512, timber: 512,
  brick: 1040,
  concrete: 816, stone: 816,
  marble: 784,
  granite: 832,
  metal: 1280, steel: 1280,
  fabric: 1312, carpet: 1312,
  neon: 1376,
  glass: 1568,
  cobblestone: 1392,
  ice: 1536,
  sand: 1088,
  forcefield: 1408,
}

function getMat(m: string): number {
  return ME[(m || '').toLowerCase().trim().replace(/[\s_-]+/g, '')] ?? 256
}

const VALID_BRICK_COLORS = new Set([
  'White', 'Institutional white', 'Light grey', 'Medium stone grey',
  'Dark grey', 'Light stone grey', 'Dark stone grey', 'Really black',
  'Bright red', 'Dark red', 'Rust', 'Reddish brown', 'Bright orange',
  'Dark orange', 'Bright yellow', 'Sand yellow', 'Brick yellow',
  'Bright green', 'Dark green', 'Sand green', 'Medium green',
  'Bright blue', 'Navy blue', 'Sand blue', 'Light blue',
  'Hot pink', 'Cashmere', 'Bright bluish green', 'Tan',
  'Medium red', 'Bright violet', 'Lavender',
])

function sanitizeColor(color: string): string {
  if (!color) return 'Light grey'
  // If already a valid BrickColor name, use it directly
  if (VALID_BRICK_COLORS.has(color)) return color
  // Try case-insensitive match
  const lower = color.toLowerCase().trim()
  const match = Array.from(VALID_BRICK_COLORS).find(v => v.toLowerCase() === lower)
  if (match) return match
  // Log and fallback
  console.log('[rbxmx] unknown color:', color, '— falling back to Light grey')
  return 'Light grey'
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
  const materialEnum = getMat(part.material)
  const color = sanitizeColor(part.color)
  const transparency = Math.max(0, Math.min(1, part.transparency ?? 0))
  const itemClass = part.partType || 'Part'

  const sx = Math.max(0.05, Number(part.size.x) || 1)
  const sy = Math.max(0.05, Number(part.size.y) || 1)
  const sz = Math.max(0.05, Number(part.size.z) || 1)
  const px = Number(part.position.x) || 0
  const py = Number(part.position.y) || sy / 2
  const pz = Number(part.position.z) || 0

  const matLower = (part.material || '').toLowerCase()
  const texId = part.textureId || MATERIAL_TEXTURES[matLower] || ''
  const hasTex = !!texId && ['brick', 'wood', 'concrete', 'marble'].includes(matLower)

  return `
  <Item class="${itemClass}" referent="RBX${id}">
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
    </Properties>${part.emissive ? `
    <Item class="PointLight" referent="LIGHT_RBX${id}">
      <Properties>
        <float name="Brightness">1.5</float>
        <float name="Range">20</float>
        <Color3 name="Color">
          <R>1</R><G>0.98</G><B>0.9</B>
        </Color3>
        <bool name="Enabled">true</bool>
        <bool name="Shadows">true</bool>
      </Properties>
    </Item>` : ''}${hasTex ? `
    <Item class="Texture" referent="TEX_RBX${id}">
      <Properties>
        <Content name="Texture"><url>${texId}</url></Content>
        <float name="StudsPerTileU">4</float>
        <float name="StudsPerTileV">4</float>
        <token name="Face">1</token>
        <Color3 name="Color3"><R>1</R><G>1</G><B>1</B></Color3>
      </Properties>
    </Item>` : ''}
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

function getLightingXml(style: string): string {
  const isAsian = style.includes('peranakan') || style.includes('chinese') || style.includes('singapore')
  if (isAsian) {
    return `
  <Item class="Lighting" referent="LIGHTING">
    <Properties>
      <float name="Ambient">0.4</float>
      <Color3 name="ColorShift_Bottom"><R>0.98</R><G>0.9</G><B>0.7</B></Color3>
      <Color3 name="ColorShift_Top"><R>0.6</R><G>0.8</G><B>1</B></Color3>
      <float name="Brightness">2</float>
      <float name="ClockTime">15</float>
      <bool name="GlobalShadows">true</bool>
      <float name="OutdoorAmbient">0.5</float>
      <Color3 name="FogColor"><R>0.8</R><G>0.85</G><B>0.9</B></Color3>
      <float name="FogEnd">1000</float>
      <float name="FogStart">200</float>
    </Properties>
  </Item>`
  }
  return `
  <Item class="Lighting" referent="LIGHTING">
    <Properties>
      <float name="Brightness">2</float>
      <float name="ClockTime">14</float>
      <bool name="GlobalShadows">true</bool>
      <float name="OutdoorAmbient">0.5</float>
    </Properties>
  </Item>`
}

export function buildRbxmx(models: RbxModel[], style?: string): string {
  let id = 1
  let itemsXml = ''
  for (const model of models) {
    const result = generateModel(model, id)
    itemsXml += result.xml
    id = result.nextId
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <Meta name="ExplicitAutoJoints">true</Meta>${itemsXml}${getLightingXml((style || '').toLowerCase())}
</roblox>`
}
