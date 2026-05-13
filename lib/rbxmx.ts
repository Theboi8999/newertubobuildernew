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

const BRICK_COLORS: Record<string, number> = {
  'White': 1,
  'Institutional white': 1,
  'Light grey': 1003,
  'Light gray': 1003,
  'Medium stone grey': 194,
  'Medium stone gray': 194,
  'Dark grey': 199,
  'Dark gray': 199,
  'Dark stone grey': 1040,
  'Light stone grey': 208,
  'Really black': 26,
  'Sand yellow': 226,
  'Brick yellow': 1031,
  'Reddish brown': 1014,
  'Dark red': 11,
  'Bright red': 21,
  'Rust': 1007,
  'Dark green': 28,
  'Bright green': 37,
  'Medium green': 29,
  'Sand green': 1006,
  'Bright blue': 23,
  'Navy blue': 108,
  'Light blue': 45,
  'Bright yellow': 24,
  'Cashmere': 1011,
  'Bright bluish green': 107,
  'Tan': 1001,
  'Hot pink': 1013,
  'Bright violet': 26,
  'Dark orange': 1008,
  'Bright orange': 1012,
}

function getBrickColorId(color: string): number {
  if (!color) return 194
  const id = BRICK_COLORS[color.trim()]
  if (!id) console.log('[rbxmx] unknown color:', color)
  return id || 194
}

const SAFE_MAT: Record<string, number> = {
  smoothplastic: 256, plastic: 256,
  wood: 512, timber: 512, woodplanks: 512,
  concrete: 816, stone: 816,
  marble: 784,
  metal: 1280, steel: 1280,
  fabric: 1312, carpet: 1312,
  neon: 1376,
  slate: 800,
  cobblestone: 1392,
  glass: 1568,
  sand: 1088,
  ice: 1536,
  forcefield: 1408,
}

function getMat(m: string): number {
  const key = (m || '').toLowerCase().trim().replace(/[\s_-]+/g, '')
  const result = SAFE_MAT[key]
  if (result === undefined) {
    console.log('[rbxmx] unknown/blocked material:', m, '→ smoothplastic')
    return 256
  }
  return result
}


function sanitizeColor(color: string): string {
  if (!color || color === 'undefined' || color === 'null') return 'Light grey'
  return color.trim()
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
  const n = part.name.toLowerCase()
  // Force material token at the XML level — bypasses any upstream material string issues
  const isGround = n.includes('ground') || n.includes('road') || n.includes('pavement') || n.includes('kerb')
  const isDoor = n.includes('door') || n.includes('bench_s') || n.includes('bench_b')
  const safeMat = isGround ? getMat('concrete') : isDoor ? getMat('wood') : 256
  const color = sanitizeColor(part.color)
  console.log('[rbxmx] writing part:', part.name.substring(0,30), 'color:', color, 'mat:', part.material, 'token:', safeMat)
  const transparency = Math.max(0, Math.min(1, part.transparency ?? 0))
  const itemClass = part.partType || 'Part'

  const sx = Math.max(0.05, Number(part.size.x) || 1)
  const sy = Math.max(0.05, Number(part.size.y) || 1)
  const sz = Math.max(0.05, Number(part.size.z) || 1)
  const px = Number(part.position.x) || 0
  const py = Number(part.position.y) || sy / 2
  const pz = Number(part.position.z) || 0

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
      <int name="BrickColor">${getBrickColorId(color)}</int>
      <token name="Material">${safeMat}</token>
      <bool name="Anchored">${part.anchored ? 'true' : 'false'}</bool>
      <float name="Transparency">${transparency}</float>
      <bool name="CanCollide">true</bool>
      <bool name="CastShadow">true</bool>
      <token name="TopSurface">0</token>
      <token name="BottomSurface">0</token>
      <token name="FrontSurface">0</token>
      <token name="BackSurface">0</token>
      <token name="LeftSurface">0</token>
      <token name="RightSurface">0</token>
    </Properties>${part.emissive ? `
    <Item class="PointLight" referent="LIGHT_RBX${id}">
      <Properties>
        <float name="Brightness">3</float>
        <float name="Range">25</float>
        <Color3 name="Color">
          <R>1</R><G>0.98</G><B>0.9</B>
        </Color3>
        <bool name="Enabled">true</bool>
        <bool name="Shadows">true</bool>
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
  </Item>
  <Item class="Atmosphere" referent="ATMOSPHERE_A">
    <Properties>
      <float name="Density">0.395</float>
      <float name="Offset">0.25</float>
      <Color3 name="Color"><R>0.784</R><G>0.784</G><B>0.784</B></Color3>
      <float name="Decay">1</float>
      <float name="Glare">0</float>
      <float name="Haze">0</float>
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
  </Item>
  <Item class="Atmosphere" referent="ATMOSPHERE_B">
    <Properties>
      <float name="Density">0.395</float>
      <float name="Offset">0.25</float>
      <Color3 name="Color"><R>0.784</R><G>0.784</G><B>0.784</B></Color3>
      <float name="Decay">1</float>
      <float name="Glare">0</float>
      <float name="Haze">0</float>
    </Properties>
  </Item>`
}

export function buildRbxmx(models: RbxModel[], style?: string, rootName?: string): string {
  let id = 1
  let itemsXml = ''
  for (const model of models) {
    const result = generateModel(model, id)
    itemsXml += result.xml
    id = result.nextId
  }

  const name = rootName || `${models[0]?.name || 'TurboBuilderAsset'}_${Date.now()}`

  const wrappedXml = `\n  <Item class="Model" referent="ROOT_MODEL">\n    <Properties>\n      <string name="Name">${escapeXml(name)}</string>\n    </Properties>${itemsXml}\n  </Item>`

  return `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <Meta name="ExplicitAutoJoints">true</Meta>${wrappedXml}${getLightingXml((style || '').toLowerCase())}
</roblox>`
}
