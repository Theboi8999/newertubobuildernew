// Generates valid .rbxmx XML files for Roblox Studio

const COLOR3_VALUES: Record<string, [number, number, number]> = {
  'White': [1, 1, 1],
  'Institutional white': [0.973, 0.973, 0.973],
  'Light grey': [0.639, 0.635, 0.647],
  'Light gray': [0.639, 0.635, 0.647],
  'Medium stone grey': [0.639, 0.635, 0.647],
  'Medium stone gray': [0.639, 0.635, 0.647],
  'Dark grey': [0.388, 0.373, 0.384],
  'Dark gray': [0.388, 0.373, 0.384],
  'Dark stone grey': [0.388, 0.373, 0.384],
  'Light stone grey': [0.784, 0.784, 0.784],
  'Really black': [0.067, 0.067, 0.067],
  'Sand yellow': [0.706, 0.639, 0.490],
  'Brick yellow': [0.843, 0.773, 0.604],
  'Reddish brown': [0.482, 0.227, 0.122],
  'Dark red': [0.455, 0.0, 0.0],
  'Bright red': [0.769, 0.157, 0.110],
  'Rust': [0.561, 0.298, 0.165],
  'Dark green': [0.157, 0.498, 0.278],
  'Bright green': [0.294, 0.592, 0.294],
  'Medium green': [0.631, 0.769, 0.561],
  'Sand green': [0.467, 0.565, 0.510],
  'Bright blue': [0.051, 0.412, 0.675],
  'Navy blue': [0.0, 0.125, 0.376],
  'Light blue': [0.706, 0.824, 0.894],
  'Bright yellow': [0.961, 0.804, 0.188],
  'Cashmere': [0.851, 0.773, 0.604],
  'Bright bluish green': [0.0, 0.561, 0.612],
  'Tan': [0.902, 0.851, 0.702],
  'Hot pink': [1.0, 0.0, 0.561],
  'Bright violet': [0.420, 0.196, 0.486],
  'Dark orange': [0.627, 0.373, 0.208],
  'Bright orange': [0.855, 0.522, 0.255],
}

// ── Color / material helpers (exported for pass files) ─────────────────────────
const VC_MAP: Record<string, string> = {
  'white': 'White', 'institutional white': 'Institutional white', 'light grey': 'Light grey',
  'light gray': 'Light grey', 'medium stone grey': 'Medium stone grey', 'medium stone gray': 'Medium stone grey',
  'dark grey': 'Dark grey', 'dark gray': 'Dark grey', 'light stone grey': 'Light stone grey',
  'dark stone grey': 'Dark stone grey', 'really black': 'Really black', 'black': 'Really black',
  'bright red': 'Bright red', 'dark red': 'Dark red', 'rust': 'Rust', 'reddish brown': 'Reddish brown',
  'bright orange': 'Bright orange', 'dark orange': 'Dark orange', 'bright yellow': 'Bright yellow',
  'sand yellow': 'Sand yellow', 'brick yellow': 'Brick yellow', 'bright green': 'Bright green',
  'dark green': 'Dark green', 'sand green': 'Sand green', 'medium green': 'Medium green',
  'bright blue': 'Bright blue', 'navy blue': 'Navy blue', 'sand blue': 'Sand blue',
  'light blue': 'Light blue', 'hot pink': 'Hot pink', 'cashmere': 'Cashmere',
  'teal': 'Bright bluish green', 'cyan': 'Bright bluish green', 'brown': 'Reddish brown',
  'beige': 'Sand yellow', 'cream': 'White', 'grey': 'Light grey', 'gray': 'Light grey',
  'green': 'Bright green', 'blue': 'Bright blue', 'red': 'Bright red',
  'yellow': 'Bright yellow', 'orange': 'Bright orange', 'pink': 'Hot pink',
}
const VM_MAP: Record<string, string> = {
  smoothplastic: 'smoothplastic', plastic: 'smoothplastic',
  wood: 'wood', timber: 'wood', oak: 'wood', pine: 'wood', teak: 'wood', bamboo: 'wood',
  brick: 'brick', sandstone: 'brick', terracotta: 'brick', clay: 'brick',
  limestone: 'smoothplastic', lime: 'smoothplastic',
  concrete: 'concrete', stone: 'concrete', granite: 'concrete', tile: 'concrete',
  pavement: 'concrete', paving: 'concrete', tarmac: 'concrete', asphalt: 'concrete',
  slate: 'concrete', cobblestone: 'cobblestone',
  metal: 'metal', steel: 'metal', copper: 'metal', aluminium: 'metal', aluminum: 'metal', iron: 'metal', zinc: 'metal', cladding: 'metal',
  fabric: 'fabric', carpet: 'fabric',
  marble: 'marble',
  neon: 'neon',
  glass: 'glass', glazed: 'glass',
  render: 'smoothplastic', stucco: 'smoothplastic', plaster: 'smoothplastic', painted: 'smoothplastic',
  grass: 'concrete',
}

export function vc(c: string): string {
  if (!c) return 'Light grey'
  const k = c.toLowerCase().trim()
  if (VC_MAP[k]) return VC_MAP[k]
  for (const [key, val] of Object.entries(VC_MAP)) {
    if (k.includes(key) || key.includes(k)) return val
  }
  return 'Light grey'
}

export function vm(m: string): string {
  return VM_MAP[(m || '').toLowerCase().trim()] || 'smoothplastic'
}

export function p(
  name: string, sx: number, sy: number, sz: number,
  px: number, py: number, pz: number,
  color: string, material: string,
  transparency = 0, emissive = false
): RbxPart {
  return {
    name,
    size: { x: safeNum(Math.max(0.1, sx), 1), y: safeNum(Math.max(0.1, sy), 1), z: safeNum(Math.max(0.1, sz), 1) },
    position: { x: safeNum(px, 0), y: safeNum(py, 0), z: safeNum(pz, 0) },
    color: vc(color),
    material: vm(material),
    anchored: true,
    transparency: Math.max(0, Math.min(1, transparency)),
    emissive,
  }
}

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
  surfaceAppearance?: string
}

const PBR_TEXTURES: Record<string, {color:string;normal:string;roughness:string;metalness:string}> = {
  'plaster': {
    color:     'rbxassetid://6372755229',
    normal:    'rbxassetid://6372755230',
    roughness: 'rbxassetid://6372755231',
    metalness: '',
  },
  'aged_plaster': {
    color:     'rbxassetid://7547304948',
    normal:    'rbxassetid://7547304949',
    roughness: 'rbxassetid://7547304950',
    metalness: '',
  },
  'concrete_clean': {
    color:     'rbxassetid://6372755229',
    normal:    'rbxassetid://6372755232',
    roughness: 'rbxassetid://6372755233',
    metalness: '',
  },
  'painted_wall': {
    color:     'rbxassetid://9854489785',
    normal:    'rbxassetid://9854489786',
    roughness: '',
    metalness: '',
  },
}

function getSurfaceAppearanceXml(textureKey: string, ref: string): string {
  const t = PBR_TEXTURES[textureKey]
  if (!t) return ''
  // Empty Content properties must use <null></null> — blank strings corrupt the file
  const colorContent = t.color ? `<url>${t.color}</url>` : '<null></null>'
  const metalnessContent = t.metalness ? `<url>${t.metalness}</url>` : '<null></null>'
  const normalContent = t.normal ? `<url>${t.normal}</url>` : '<null></null>'
  const roughnessContent = t.roughness ? `<url>${t.roughness}</url>` : '<null></null>'
  return `
    <Item class="SurfaceAppearance" referent="${ref}_SA">
      <Properties>
        <token name="AlphaMode">0</token>
        <Content name="ColorMap">${colorContent}</Content>
        <Content name="MetalnessMap">${metalnessContent}</Content>
        <Content name="NormalMap">${normalContent}</Content>
        <Content name="RoughnessMap">${roughnessContent}</Content>
      </Properties>
    </Item>`
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

export const BRICK_COLOR_IDS: Record<string, number> = {
  'White': 1,
  'Grey': 2,
  'Light yellow': 5,
  'Brick yellow': 11,
  'Light green': 6,
  'Light reddish violet': 9,
  'Pastel Blue': 12,
  'Light orange brown': 13,
  'Nougat': 18,
  'Bright red': 21,
  'Med. reddish violet': 22,
  'Bright blue': 23,
  'Bright yellow': 24,
  'Earth orange': 25,
  'Black': 26,
  'Dark grey': 27,
  'Dark green': 28,
  'Medium green': 29,
  'Lig. Yellowish orange': 31,
  'Bright green': 37,
  'Dark orange': 38,
  'Light bluish violet': 39,
  'Transparent': 40,
  'Tr. Red': 41,
  'Tr. Lg blue': 42,
  'Tr. Blue': 43,
  'Tr. Yellow': 44,
  'Light blue': 45,
  'Tr. Flu. Reddish orange': 47,
  'Tr. Green': 48,
  'Tr. Flu. Green': 49,
  'Phosph. White': 50,
  'Light red': 100,
  'Medium red': 101,
  'Medium blue': 102,
  'Light grey': 103,
  'Bright violet': 104,
  'Br. yellowish orange': 105,
  'Bright orange': 106,
  'Bright bluish green': 107,
  'Earth yellow': 108,
  'Bright bluish violet': 110,
  'Tr. Brown': 111,
  'Medium bluish violet': 112,
  'Tr. Medi. reddish violet': 113,
  'Med. yellowish green': 115,
  'Med. bluish green': 116,
  'Light bluish green': 118,
  'Br. yellowish green': 119,
  'Lig. yellowish green': 120,
  'Med. yellowish orange': 121,
  'Br. reddish orange': 123,
  'Bright reddish violet': 124,
  'Light orange': 125,
  'Tr. Bright bluish violet': 126,
  'Gold': 127,
  'Dark nougat': 128,
  'Silver': 131,
  'Neon orange': 133,
  'Neon green': 134,
  'Sand blue': 135,
  'Sand violet': 136,
  'Medium orange': 137,
  'Sand yellow': 138,
  'Earth blue': 140,
  'Earth green': 141,
  'Tr. Flu. Blue': 143,
  'Sand blue metallic': 145,
  'Sand violet metallic': 146,
  'Sand yellow metallic': 147,
  'Dark grey metallic': 148,
  'Black metallic': 149,
  'Light grey metallic': 150,
  'Sand green': 151,
  'Sand red': 153,
  'Dark red': 154,
  'Tr. Flu. Yellow': 157,
  'Tr. Flu. Red': 158,
  'Gun metallic': 168,
  'Red flip/flop': 176,
  'Yellow flip/flop': 180,
  'Silver flip/flop': 215,
  'Curry': 190,
  'Fire Yellow': 191,
  'Flame yellowish orange': 192,
  'Reddish brown': 192,
  'Flame reddish orange': 193,
  'Medium stone grey': 194,
  'Royal blue': 195,
  'Dark Royal blue': 196,
  'Bright reddish lilac': 198,
  'Dark stone grey': 199,
  'Lemon metalic': 200,
  'Light stone grey': 208,
  'Dark Curry': 209,
  'Faded green': 210,
  'Turquoise': 211,
  'Light Royal blue': 212,
  'Medium Royal blue': 213,
  'Rust': 216,
  'Brown': 217,
  'Reddish lilac': 218,
  'Lilac': 219,
  'Light lilac': 220,
  'Bright purple': 221,
  'Light purple': 222,
  'Light pink': 223,
  'Light brick yellow': 224,
  'Warm yellowish orange': 225,
  'Cool yellow': 226,
  'Dove blue': 227,
  'Medium lilac': 229,
  'Slime green': 230,
  'Smoky grey': 232,
  'Dark blue': 233,
  'Parsley green': 234,
  'Steel blue': 235,
  'Storm blue': 236,
  'Lapis': 237,
  'Dark indigo': 238,
  'Sea green': 239,
  'Shamrock': 240,
  'Fossil': 241,
  'Mulberry': 242,
  'Forest green': 243,
  'Cadet blue': 244,
  'Electric blue': 245,
  'Eggplant': 246,
  'Moss': 247,
  'Artichoke': 248,
  'Sage green': 249,
  'Ghost grey': 250,
  'Lily white': 251,
  'Orchid': 252,
  'Dirt brown': 253,
  'Coral': 254,
  'Pastel orange': 255,
  'Cashmere': 255,
  'Pale rose': 256,
  'Pearl': 257,
  'Fog': 258,
  'Salmon': 259,
  'Blossom': 260,
  'Royal purple': 261,
  'Burgundy': 262,
  'Flint': 263,
  'Seaweed': 264,
  'Institutional white': 199,
  'Mid gray': 194,
  'Really black': 26,
  'Really red': 21,
  'Deep orange': 106,
  'Alder': 252,
  'Dusty Rose': 239,
  'Olive': 119,
  'New Yeller': 226,
  'Navy blue': 196,
  'Deep blue': 233,
  'Cyan': 107,
  'CGA brown': 127,
  'Magenta': 22,
  'Pink': 222,
  'Deep red': 154,
  'Hot pink': 104,
  'Teal': 107,
  'Toothpaste': 107,
  'Lime green': 119,
  'Camo': 119,
  'Grime': 119,
  'Lavender': 220,
  'Pastel light blue': 212,
  'Pastel blue-green': 107,
  'Pastel green': 29,
  'Pastel yellow': 31,
  'Dark tan': 128,
  'Medium tan': 18,
  'Light gray': 103,
  'Dark gray': 27,
  'Medium stone gray': 194,
}

function getBrickColorId(colorName: string): number {
  if (!colorName) return 194
  // Try exact match first
  if (BRICK_COLOR_IDS[colorName] !== undefined) {
    return BRICK_COLOR_IDS[colorName]
  }
  // Try case-insensitive match
  const lower = colorName.toLowerCase()
  for (const [key, val] of Object.entries(BRICK_COLOR_IDS)) {
    if (key.toLowerCase() === lower) return val
  }
  // Try partial match
  for (const [key, val] of Object.entries(BRICK_COLOR_IDS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val
  }
  // Default to medium stone grey
  console.warn('[rbxmx] unknown color:', colorName, '— defaulting to Medium stone grey (194)')
  return 194
}

export const ME: Record<string, number> = {
  smoothplastic: 256, plastic: 256,
  render: 256, stucco: 256, plaster: 256, painted: 256,
  brick: 1040, sandstone: 1040, terracotta: 1040, clay: 1040,
  limestone: 256, lime: 256,
  wood: 512, timber: 512, woodplanks: 512, oak: 512, pine: 512, teak: 512, bamboo: 512,
  concrete: 816, stone: 816, slate: 816, granite: 832, tile: 816, tiles: 816,
  pavement: 816, paving: 816, tarmac: 816, asphalt: 816,
  cobblestone: 1168,
  marble: 784,
  metal: 1344, steel: 1344, copper: 1344, aluminium: 1344, aluminum: 1344, iron: 1344, zinc: 1344, cladding: 1344,
  corrodedmetal: 1952,
  fabric: 1184, carpet: 1184,
  neon: 1632,
  glass: 1568, glazed: 1568,
  sand: 1088,
  ice: 1536,
  forcefield: 1408,
}

function getMat(m: string): number {
  const key = (m || '').toLowerCase().trim().replace(/[\s_-]+/g, '')
  const result = ME[key]
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

function sanitizeName(n: string): string {
  return n.replace(/&/g, 'and').replace(/[<>'"]/g, '_')
}

function safeNum(n: number, fallback: number): number {
  return (isFinite(n) && !isNaN(n)) ? n : fallback
}

function generatePart(part: RbxPart, id: number): string {
  const safeName = sanitizeName(part.name || `Part_${id}`)
  const n = safeName.toLowerCase()
  // Force material token at the XML level — bypasses any upstream material string issues
  const isGround = n.includes('ground') || n.includes('road') || n.includes('pavement') || n.includes('kerb')
  const isDoor = (n.includes('door') && !n.includes('frame') && !n.includes('gar') && !n.includes('drive')) || n.includes('bench_s') || n.includes('bench_b')
  const color = sanitizeColor(part.color || 'Light grey')
  const matStr = part.material || 'smoothplastic'
  const safeMat = isGround ? getMat('concrete') : isDoor ? getMat('wood') : getMat(matStr)
  console.log('[rbxmx] writing part:', safeName.substring(0,30), 'color:', color, 'mat:', matStr, 'token:', safeMat)
  const transparency = Math.max(0, Math.min(1, part.transparency ?? 0))
  const itemClass = part.partType || 'Part'

  const sx = safeNum(Math.max(0.05, Number(part.size.x) || 1), 1)
  const sy = safeNum(Math.max(0.05, Number(part.size.y) || 1), 1)
  const sz = safeNum(Math.max(0.05, Number(part.size.z) || 1), 1)
  const px = safeNum(Number(part.position.x) || 0, 0)
  const py = safeNum(Number(part.position.y) || sy / 2, sy / 2)
  const pz = safeNum(Number(part.position.z) || 0, 0)

  return `
  <Item class="${itemClass}" referent="RBX${id}">
    <Properties>
      <string name="Name">${escapeXml(safeName)}</string>
      <Vector3 name="Size">
        <X>${sx}</X><Y>${sy}</Y><Z>${sz}</Z>
      </Vector3>
      <CoordinateFrame name="CFrame">
        <X>${px}</X><Y>${py}</Y><Z>${pz}</Z>
        <R00>1</R00><R01>0</R01><R02>0</R02>
        <R10>0</R10><R11>1</R11><R12>0</R12>
        <R20>0</R20><R21>0</R21><R22>1</R22>
      </CoordinateFrame>
      <int name="BrickColor">${getBrickColorId(color)}</int>${(() => { const rgb = COLOR3_VALUES[color]; return rgb ? `\n      <Color3 name="Color"><R>${rgb[0]}</R><G>${rgb[1]}</G><B>${rgb[2]}</B></Color3>` : '' })()}
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
        <Color3 name="Color">4294967295</Color3>
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
  const geoLat = isAsian ? `\n      <float name="GeographicLatitude">1.352</float>` : ''
  const colorShift = isAsian ? `
      <Color3 name="ColorShift_Bottom"><R>0.98</R><G>0.9</G><B>0.7</B></Color3>
      <Color3 name="ColorShift_Top"><R>0.6</R><G>0.8</G><B>1</B></Color3>` : ''
  return `
  <Item class="Lighting" referent="LIGHTING">
    <Properties>
      <string name="Technology">Future</string>
      <float name="Brightness">3</float>
      <float name="ClockTime">14</float>${geoLat}
      <Color3 name="Ambient"><R>0.3</R><G>0.3</G><B>0.3</B></Color3>
      <Color3 name="OutdoorAmbient"><R>0.55</R><G>0.55</G><B>0.58</B></Color3>${colorShift}
      <bool name="GlobalShadows">true</bool>
      <float name="ExposureCompensation">0.2</float>
      <float name="FogEnd">1000</float>
      <float name="FogStart">800</float>
    </Properties>
    <Item class="Atmosphere" referent="ATMOSPHERE">
      <Properties>
        <float name="Density">0.3</float>
        <float name="Offset">0.25</float>
        <Color3 name="Color"><R>0.784</R><G>0.784</G><B>0.784</B></Color3>
        <float name="Decay">1</float>
        <float name="Glare">0.1</float>
        <float name="Haze">0.2</float>
      </Properties>
    </Item>
    <Item class="Sky" referent="SKY">
      <Properties>
        <bool name="CelestialBodiesShown">true</bool>
      </Properties>
    </Item>
    <Item class="BloomEffect" referent="BLOOM">
      <Properties>
        <float name="Intensity">0.4</float>
        <float name="Size">24</float>
        <float name="Threshold">0.95</float>
        <bool name="Enabled">true</bool>
      </Properties>
    </Item>
    <Item class="DepthOfFieldEffect" referent="DOF">
      <Properties>
        <float name="FarIntensity">0.05</float>
        <float name="FocusDistance">50</float>
        <float name="InFocusRadius">30</float>
        <float name="NearIntensity">0</float>
        <bool name="Enabled">true</bool>
      </Properties>
    </Item>
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

  // Lighting service is NOT included — services cannot exist in .rbxmx model files
  // (only .rbxlx place files support DataModel services). Including <Item class="Lighting">
  // causes Roblox Studio to reject the file as corrupted.
  return `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <Meta name="ExplicitAutoJoints">true</Meta>${wrappedXml}
</roblox>`
}
