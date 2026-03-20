// Generates valid .rbxmx XML files for Roblox Studio

export interface RbxPart {
  name: string
  size: { x: number; y: number; z: number }
  position: { x: number; y: number; z: number }
  color: string // BrickColor name
  material: string // Enum.Material
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

const MATERIAL_MAP: Record<string, string> = {
  concrete: 'Concrete',
  brick: 'Brick',
  metal: 'Metal',
  wood: 'Wood',
  glass: 'Glass',
  plastic: 'SmoothPlastic',
  grass: 'Grass',
  ground: 'Ground',
  cobblestone: 'Cobblestone',
  marble: 'Marble',
  fabric: 'Fabric',
  neon: 'Neon',
  foil: 'Foil',
  forcefield: 'ForceField',
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
  const material = MATERIAL_MAP[part.material.toLowerCase()] || 'SmoothPlastic'
  const shape = part.shape || 'Block'
  return `
    <Item class="Part" referent="RBX${id}">
      <Properties>
        <string name="Name">${escapeXml(part.name)}</string>
        <token name="shape">${['Block','Ball','Cylinder','Wedge'].indexOf(shape === 'Sphere' ? 'Ball' : shape)}</token>
        <Vector3 name="size">
          <X>${part.size.x}</X><Y>${part.size.y}</Y><Z>${part.size.z}</Z>
        </Vector3>
        <CoordinateFrame name="CFrame">
          <X>${part.position.x}</X><Y>${part.position.y}</Y><Z>${part.position.z}</Z>
          <R00>1</R00><R01>0</R01><R02>0</R02>
          <R10>0</R10><R11>1</R11><R12>0</R12>
          <R20>0</R20><R21>0</R21><R22>1</R22>
        </CoordinateFrame>
        <BrickColor name="BrickColor">${part.color}</BrickColor>
        <token name="Material">${Object.values(MATERIAL_MAP).indexOf(material) + 256}</token>
        <bool name="Anchored">${part.anchored}</bool>
        <float name="Transparency">${part.transparency ?? 0}</float>
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
  for (const script of model.scripts) {
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

  return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <Meta name="ExplicitAutoJoints">true</Meta>${itemsXml}
</roblox>`
}
