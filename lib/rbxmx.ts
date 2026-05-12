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

const COLOR3_MAP: Record<string, [number, number, number]> = {
  'Sand yellow':         [217, 185, 155],
  'Brick yellow':        [215, 197, 154],
  'Cashmere':            [211, 190, 150],
  'Dark green':          [0,   102, 0  ],
  'Bright green':        [75,  151, 75 ],
  'Medium green':        [52,  142, 64 ],
  'Sand green':          [120, 144, 130],
  'White':               [255, 255, 255],
  'Institutional white': [248, 248, 248],
  'Light grey':          [196, 196, 188],
  'Light gray':          [196, 196, 188],
  'Medium stone grey':   [163, 162, 165],
  'Medium stone gray':   [163, 162, 165],
  'Dark grey':           [99,  95,  98 ],
  'Dark gray':           [99,  95,  98 ],
  'Dark stone grey':     [116, 114, 117],
  'Light stone grey':    [229, 228, 223],
  'Really black':        [17,  17,  17 ],
  'Bright red':          [196, 40,  28 ],
  'Dark red':            [123, 46,  47 ],
  'Rust':                [143, 76,  42 ],
  'Reddish brown':       [105, 64,  40 ],
  'Bright blue':         [13,  105, 172],
  'Navy blue':           [0,   32,  96 ],
  'Light blue':          [162, 205, 226],
  'Sand blue':           [116, 134, 157],
  'Bright yellow':       [245, 205, 48 ],
  'Bright orange':       [218, 133, 65 ],
  'Dark orange':         [160, 95,  53 ],
  'Hot pink':            [255, 0,   191],
  'Bright violet':       [107, 50,  124],
  'Bright bluish green': [0,   143, 156],
  'Tan':                 [222, 198, 153],
}

function getColor3(colorName: string): string {
  const rgb = COLOR3_MAP[colorName] || COLOR3_MAP['Light grey'] || [196, 196, 188]
  const r = (rgb[0] / 255).toFixed(6)
  const g = (rgb[1] / 255).toFixed(6)
  const b = (rgb[2] / 255).toFixed(6)
  return `<Color3 name="Color3"><R>${r}</R><G>${g}</G><B>${b}</B></Color3>`
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
      <int name="BrickColor">194</int>
      ${getColor3(color)}
      <token name="Material">${safeMat}</token>
      <bool name="Anchored">${part.anchored ? 'true' : 'false'}</bool>
      <float name="Transparency">${transparency}</float>
      <bool name="CanCollide">true</bool>
      <bool name="CastShadow">true</bool>
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
