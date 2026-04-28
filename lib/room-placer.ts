export interface Room {
  name: string
  x: number
  z: number
  width: number
  depth: number
  type: string
}

interface BSPNode {
  x: number
  z: number
  width: number
  depth: number
  left?: BSPNode
  right?: BSPNode
  room?: Room
}

const MIN_ROOM_W = 8
const MIN_ROOM_D = 8
const SPLIT_RATIO_MIN = 0.35
const SPLIT_RATIO_MAX = 0.65

function splitNode(node: BSPNode, depth: number): void {
  if (depth <= 0) return
  if (node.width < MIN_ROOM_W * 2 && node.depth < MIN_ROOM_D * 2) return

  const splitHorizontal = node.depth > node.width
    ? true
    : node.width > node.depth
      ? false
      : Math.random() > 0.5

  const ratio = SPLIT_RATIO_MIN + Math.random() * (SPLIT_RATIO_MAX - SPLIT_RATIO_MIN)

  if (splitHorizontal) {
    const splitZ = Math.floor(node.depth * ratio)
    if (splitZ < MIN_ROOM_D || node.depth - splitZ < MIN_ROOM_D) return
    node.left = { x: node.x, z: node.z, width: node.width, depth: splitZ }
    node.right = { x: node.x, z: node.z + splitZ, width: node.width, depth: node.depth - splitZ }
  } else {
    const splitX = Math.floor(node.width * ratio)
    if (splitX < MIN_ROOM_W || node.width - splitX < MIN_ROOM_W) return
    node.left = { x: node.x, z: node.z, width: splitX, depth: node.depth }
    node.right = { x: node.x + splitX, z: node.z, width: node.width - splitX, depth: node.depth }
  }

  splitNode(node.left!, depth - 1)
  splitNode(node.right!, depth - 1)
}

function getLeaves(node: BSPNode): BSPNode[] {
  if (!node.left && !node.right) return [node]
  const leaves: BSPNode[] = []
  if (node.left) leaves.push(...getLeaves(node.left))
  if (node.right) leaves.push(...getLeaves(node.right))
  return leaves
}

function assignRoomsToLeaves(
  leaves: BSPNode[],
  roomSpecs: Array<{ name: string; width: number; depth: number; type: string }>
): Room[] {
  const rooms: Room[] = []
  const usedLeaves = new Set<number>()

  const sorted = [...roomSpecs].sort((a, b) => (b.width * b.depth) - (a.width * a.depth))

  for (const spec of sorted) {
    let bestLeaf = -1
    let bestWaste = Infinity

    for (let i = 0; i < leaves.length; i++) {
      if (usedLeaves.has(i)) continue
      const leaf = leaves[i]
      if (leaf.width >= spec.width && leaf.depth >= spec.depth) {
        const waste = (leaf.width * leaf.depth) - (spec.width * spec.depth)
        if (waste < bestWaste) {
          bestWaste = waste
          bestLeaf = i
        }
      }
    }

    if (bestLeaf === -1) {
      for (let i = 0; i < leaves.length; i++) {
        if (!usedLeaves.has(i)) { bestLeaf = i; break }
      }
    }

    if (bestLeaf === -1) continue

    const leaf = leaves[bestLeaf]
    usedLeaves.add(bestLeaf)

    const margin = 1
    const rw = Math.min(spec.width, leaf.width - margin * 2)
    const rd = Math.min(spec.depth, leaf.depth - margin * 2)
    const rx = leaf.x + margin + (leaf.width - margin * 2 - rw) / 2
    const rz = leaf.z + margin + (leaf.depth - margin * 2 - rd) / 2

    rooms.push({
      name: spec.name,
      x: rx + rw / 2,
      z: rz + rd / 2,
      width: rw,
      depth: rd,
      type: spec.type
    })
  }

  return rooms
}

export function placeRoomsWithBSP(
  totalWidth: number,
  totalDepth: number,
  roomSpecs: Array<{ name: string; width: number; depth: number; type: string }>,
  seed?: number
): Room[] {
  let seedVal = seed || 42
  const seededRandom = () => {
    seedVal = (seedVal * 1664525 + 1013904223) & 0xffffffff
    return (seedVal >>> 0) / 0xffffffff
  }

  const origRandom = Math.random
  Math.random = seededRandom

  try {
    const root: BSPNode = { x: 2, z: 2, width: totalWidth - 4, depth: totalDepth - 4 }
    const depth = Math.min(5, Math.ceil(Math.log2(roomSpecs.length + 1)))
    splitNode(root, depth)
    const leaves = getLeaves(root)
    return assignRoomsToLeaves(leaves, roomSpecs)
  } finally {
    Math.random = origRandom
  }
}

export function getRoomType(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('reception') || n.includes('lobby') || n.includes('entrance') || n.includes('foyer')) return 'reception'
  if (n.includes('office') || n.includes('admin') || n.includes('bullpen') || n.includes('desk')) return 'office'
  if (n.includes('cell') || n.includes('holding') || n.includes('detention') || n.includes('custody')) return 'cell'
  if (n.includes('toilet') || n.includes('bathroom') || n.includes('wc') || n.includes('lavatory')) return 'toilet'
  if (n.includes('shop') || n.includes('retail') || n.includes('sales') || n.includes('floor') || n.includes('market')) return 'shopping'
  if (n.includes('storage') || n.includes('stock') || n.includes('evidence') || n.includes('archive')) return 'storage'
  if (n.includes('kitchen') || n.includes('break') || n.includes('canteen') || n.includes('mess')) return 'kitchen'
  if (n.includes('meeting') || n.includes('conference') || n.includes('boardroom') || n.includes('briefing')) return 'meeting'
  if (n.includes('corridor') || n.includes('hallway') || n.includes('passage') || n.includes('stair')) return 'corridor'
  if (n.includes('garage') || n.includes('bay') || n.includes('vehicle')) return 'garage'
  return 'default'
}
