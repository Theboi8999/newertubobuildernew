export interface RoomPart {
  name: string
  size: { x: number; y: number; z: number }
  position: { x: number; y: number; z: number }
  color: string
  material: string
  anchored: boolean
  transparency: number
  shape: string
}

export interface RoomTemplate {
  name: string
  width: number
  depth: number
  height: number
  parts: RoomPart[]
}

export function offsetRoom(template: RoomTemplate, dx: number, dy: number, dz: number): RoomPart[] {
  return template.parts.map(p => ({
    ...p,
    name: `${template.name}_${p.name}`,
    position: { x: p.position.x + dx, y: p.position.y + dy, z: p.position.z + dz }
  }))
}

const stopWords = new Set([
  'a', 'an', 'the', 'with', 'full', 'interior', 'exterior', 'build',
  'me', 'make', 'create', 'generate', 'please', 'can', 'you', 'i',
  'want', 'need', 'my', 'our', 'some', 'and', 'or', 'of', 'for',
  'in', 'on', 'at', 'to', 'from', 'by', 'as', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
  'must', 'roblox', 'studio', 'game', 'map', 'asset', 'model',
  'style', 'type', 'large', 'small', 'big', 'complete', 'detailed',
  'furnished', 'realistic', 'accurate', 'uk', 'us', 'usa',
])

export function detectBuildingType(prompt: string): string {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))

  return words.slice(0, 4).join('_')
}
