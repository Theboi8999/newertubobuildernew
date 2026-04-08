// Pre-built room templates with correct Roblox stud measurements
// Each template is relative to origin (0,0,0) — generator offsets them

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

// Offset all parts by dx, dy, dz
export function offsetRoom(template: RoomTemplate, dx: number, dy: number, dz: number): RoomPart[] {
  return template.parts.map(p => ({
    ...p,
    name: `${template.name}_${p.name}`,
    position: {
      x: p.position.x + dx,
      y: p.position.y + dy,
      z: p.position.z + dz,
    }
  }))
}

export const ROOM_TEMPLATES: Record<string, RoomTemplate> = {
  // 10x10 office room
  office: {
    name: 'Office',
    width: 10, depth: 10, height: 10,
    parts: [
      { name: 'Floor', size: { x: 10, y: 1, z: 10 }, position: { x: 0, y: 0.5, z: 0 }, color: 'Medium stone grey', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Desk', size: { x: 5, y: 2, z: 3 }, position: { x: 2, y: 2, z: -2 }, color: 'Reddish brown', material: 'wood', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'DeskTop', size: { x: 5, y: 0.2, z: 3 }, position: { x: 2, y: 3.1, z: -2 }, color: 'Brown', material: 'wood', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Chair', size: { x: 2, y: 2, z: 2 }, position: { x: 2, y: 1.5, z: 0.5 }, color: 'Black', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'ChairBack', size: { x: 2, y: 2, z: 0.3 }, position: { x: 2, y: 2.5, z: 1.5 }, color: 'Black', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Monitor', size: { x: 2, y: 1.5, z: 0.2 }, position: { x: 2, y: 4.2, z: -3 }, color: 'Dark grey', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'FilingCabinet', size: { x: 2, y: 4, z: 2 }, position: { x: -3, y: 3, z: -3 }, color: 'Medium stone grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
    ]
  },

  // 12x6 bunk room pair
  bunkroom: {
    name: 'Bunkroom',
    width: 12, depth: 8, height: 10,
    parts: [
      { name: 'Floor', size: { x: 12, y: 1, z: 8 }, position: { x: 0, y: 0.5, z: 0 }, color: 'Sand yellow', material: 'wood', anchored: true, transparency: 0, shape: 'Block' },
      // Bunk 1 bottom
      { name: 'Bed1Bottom', size: { x: 6, y: 1, z: 3 }, position: { x: -3, y: 1.5, z: -2 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Mattress1Bottom', size: { x: 5.5, y: 0.5, z: 2.5 }, position: { x: -3, y: 2.25, z: -2 }, color: 'White', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      // Bunk 1 top
      { name: 'Bed1Top', size: { x: 6, y: 1, z: 3 }, position: { x: -3, y: 5, z: -2 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Mattress1Top', size: { x: 5.5, y: 0.5, z: 2.5 }, position: { x: -3, y: 5.75, z: -2 }, color: 'White', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      // Bunk 1 ladder
      { name: 'Ladder1', size: { x: 0.3, y: 4, z: 0.3 }, position: { x: -0.5, y: 3.5, z: -0.3 }, color: 'Medium stone grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      // Bunk 2 bottom
      { name: 'Bed2Bottom', size: { x: 6, y: 1, z: 3 }, position: { x: 3, y: 1.5, z: -2 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Mattress2Bottom', size: { x: 5.5, y: 0.5, z: 2.5 }, position: { x: 3, y: 2.25, z: -2 }, color: 'White', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      // Bunk 2 top
      { name: 'Bed2Top', size: { x: 6, y: 1, z: 3 }, position: { x: 3, y: 5, z: -2 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Mattress2Top', size: { x: 5.5, y: 0.5, z: 2.5 }, position: { x: 3, y: 5.75, z: -2 }, color: 'White', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      // Lockers
      { name: 'Locker1', size: { x: 2, y: 6, z: 2 }, position: { x: -4, y: 4, z: 3 }, color: 'Medium stone grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Locker2', size: { x: 2, y: 6, z: 2 }, position: { x: -2, y: 4, z: 3 }, color: 'Medium stone grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Locker3', size: { x: 2, y: 6, z: 2 }, position: { x: 0, y: 4, z: 3 }, color: 'Medium stone grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Locker4', size: { x: 2, y: 6, z: 2 }, position: { x: 2, y: 4, z: 3 }, color: 'Medium stone grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
    ]
  },

  // 14x10 kitchen/dayroom
  kitchen: {
    name: 'Kitchen',
    width: 14, depth: 10, height: 10,
    parts: [
      { name: 'Floor', size: { x: 14, y: 1, z: 10 }, position: { x: 0, y: 0.5, z: 0 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      // Countertop
      { name: 'Counter', size: { x: 8, y: 3, z: 2 }, position: { x: -3, y: 2, z: -4 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'CounterTop', size: { x: 8, y: 0.3, z: 2 }, position: { x: -3, y: 3.15, z: -4 }, color: 'Medium stone grey', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      // Fridge
      { name: 'Fridge', size: { x: 2, y: 6, z: 2 }, position: { x: 5, y: 4, z: -4 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      // Dining table
      { name: 'DiningTable', size: { x: 8, y: 1, z: 4 }, position: { x: 0, y: 3.5, z: 2 }, color: 'Reddish brown', material: 'wood', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'TableLeg1', size: { x: 0.5, y: 3, z: 0.5 }, position: { x: -3.5, y: 1.5, z: 0.5 }, color: 'Reddish brown', material: 'wood', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'TableLeg2', size: { x: 0.5, y: 3, z: 0.5 }, position: { x: 3.5, y: 1.5, z: 0.5 }, color: 'Reddish brown', material: 'wood', anchored: true, transparency: 0, shape: 'Block' },
      // Chairs around table
      { name: 'DiningChair1', size: { x: 2, y: 2, z: 2 }, position: { x: -3, y: 1.5, z: 5 }, color: 'Black', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'DiningChair2', size: { x: 2, y: 2, z: 2 }, position: { x: 0, y: 1.5, z: 5 }, color: 'Black', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'DiningChair3', size: { x: 2, y: 2, z: 2 }, position: { x: 3, y: 1.5, z: 5 }, color: 'Black', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      // Sofa
      { name: 'SofaBase', size: { x: 6, y: 2, z: 3 }, position: { x: 4, y: 1.5, z: 3 }, color: 'Dark red', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'SofaBack', size: { x: 6, y: 2, z: 1 }, position: { x: 4, y: 2.5, z: 4.5 }, color: 'Dark red', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      // TV
      { name: 'TVStand', size: { x: 4, y: 2, z: 1.5 }, position: { x: 4, y: 1.5, z: -3 }, color: 'Black', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'TV', size: { x: 4, y: 3, z: 0.3 }, position: { x: 4, y: 4, z: -3.5 }, color: 'Black', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
    ]
  },

  // 20x20 fire apparatus bay (for 2 trucks)
  apparatus_bay: {
    name: 'ApparatusBay',
    width: 22, depth: 24, height: 14,
    parts: [
      { name: 'Floor', size: { x: 22, y: 1, z: 24 }, position: { x: 0, y: 0.5, z: 0 }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' },
      // Floor markings
      { name: 'FloorLine1', size: { x: 0.3, y: 0.1, z: 24 }, position: { x: -5.5, y: 1.05, z: 0 }, color: 'Bright yellow', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'FloorLine2', size: { x: 0.3, y: 0.1, z: 24 }, position: { x: 5.5, y: 1.05, z: 0 }, color: 'Bright yellow', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      // Bay doors (roll-up style - represented as panels)
      { name: 'BayDoor1Left', size: { x: 5, y: 12, z: 1 }, position: { x: -8, y: 7, z: -11.5 }, color: 'White', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'BayDoor1Right', size: { x: 5, y: 12, z: 1 }, position: { x: -3, y: 7, z: -11.5 }, color: 'White', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'BayDoor2Left', size: { x: 5, y: 12, z: 1 }, position: { x: 3, y: 7, z: -11.5 }, color: 'White', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'BayDoor2Right', size: { x: 5, y: 12, z: 1 }, position: { x: 8, y: 7, z: -11.5 }, color: 'White', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      // Overhead strip lights
      { name: 'Light1', size: { x: 8, y: 0.5, z: 1 }, position: { x: -5, y: 13.5, z: -5 }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0.3, shape: 'Block' },
      { name: 'Light2', size: { x: 8, y: 0.5, z: 1 }, position: { x: 5, y: 13.5, z: -5 }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0.3, shape: 'Block' },
      { name: 'Light3', size: { x: 8, y: 0.5, z: 1 }, position: { x: -5, y: 13.5, z: 5 }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0.3, shape: 'Block' },
      { name: 'Light4', size: { x: 8, y: 0.5, z: 1 }, position: { x: 5, y: 13.5, z: 5 }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0.3, shape: 'Block' },
      // Equipment wall
      { name: 'EquipmentBoard', size: { x: 10, y: 6, z: 0.5 }, position: { x: 0, y: 5, z: 11.5 }, color: 'Dark orange', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      // Hose rack
      { name: 'HoseRack', size: { x: 4, y: 4, z: 1 }, position: { x: -8, y: 4, z: 11 }, color: 'Dark red', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
    ]
  },

  // 8x6 holding cell
  holding_cell: {
    name: 'HoldingCell',
    width: 8, depth: 6, height: 10,
    parts: [
      { name: 'Floor', size: { x: 8, y: 1, z: 6 }, position: { x: 0, y: 0.5, z: 0 }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' },
      // Cell bars (front wall)
      { name: 'Bar1', size: { x: 0.3, y: 10, z: 0.3 }, position: { x: -3.5, y: 5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Bar2', size: { x: 0.3, y: 10, z: 0.3 }, position: { x: -2.5, y: 5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Bar3', size: { x: 0.3, y: 10, z: 0.3 }, position: { x: -1.5, y: 5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Bar4', size: { x: 0.3, y: 10, z: 0.3 }, position: { x: -0.5, y: 5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Bar5', size: { x: 0.3, y: 10, z: 0.3 }, position: { x: 0.5, y: 5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Bar6', size: { x: 0.3, y: 10, z: 0.3 }, position: { x: 1.5, y: 5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Bar7', size: { x: 0.3, y: 10, z: 0.3 }, position: { x: 2.5, y: 5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'Bar8', size: { x: 0.3, y: 10, z: 0.3 }, position: { x: 3.5, y: 5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      // Horizontal bar rails
      { name: 'RailTop', size: { x: 8, y: 0.3, z: 0.3 }, position: { x: 0, y: 9.5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'RailMid', size: { x: 8, y: 0.3, z: 0.3 }, position: { x: 0, y: 5, z: -2.5 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      // Bench/bed
      { name: 'CellBench', size: { x: 6, y: 1, z: 2 }, position: { x: 0, y: 2, z: 2 }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' },
      // Toilet
      { name: 'Toilet', size: { x: 1.5, y: 2, z: 1.5 }, position: { x: 3, y: 1.5, z: 2 }, color: 'White', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
    ]
  },

  // Reception/lobby area
  reception: {
    name: 'Reception',
    width: 16, depth: 12, height: 10,
    parts: [
      { name: 'Floor', size: { x: 16, y: 1, z: 12 }, position: { x: 0, y: 0.5, z: 0 }, color: 'Sand yellow', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      // Reception desk (L-shaped using 2 parts)
      { name: 'DeskMain', size: { x: 8, y: 3, z: 2 }, position: { x: -1, y: 2, z: -2 }, color: 'Dark grey', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'DeskSide', size: { x: 2, y: 3, z: 4 }, position: { x: -4, y: 2, z: 0 }, color: 'Dark grey', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'DeskTop', size: { x: 8, y: 0.3, z: 2 }, position: { x: -1, y: 3.15, z: -2 }, color: 'Black', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
      // Waiting chairs
      { name: 'WaitChair1', size: { x: 2, y: 2, z: 2 }, position: { x: 4, y: 1.5, z: 2 }, color: 'Bright blue', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'WaitChair2', size: { x: 2, y: 2, z: 2 }, position: { x: 6.5, y: 1.5, z: 2 }, color: 'Bright blue', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'WaitChair3', size: { x: 2, y: 2, z: 2 }, position: { x: 4, y: 1.5, z: 4.5 }, color: 'Bright blue', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'WaitChair4', size: { x: 2, y: 2, z: 2 }, position: { x: 6.5, y: 1.5, z: 4.5 }, color: 'Bright blue', material: 'fabric', anchored: true, transparency: 0, shape: 'Block' },
      // Noticeboard
      { name: 'Noticeboard', size: { x: 4, y: 3, z: 0.3 }, position: { x: 5, y: 5, z: -5.5 }, color: 'Reddish brown', material: 'wood', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'NoticeboardFrame', size: { x: 4.4, y: 3.4, z: 0.2 }, position: { x: 5, y: 5, z: -5.6 }, color: 'Brown', material: 'wood', anchored: true, transparency: 0, shape: 'Block' },
      // Sign above desk
      { name: 'ReceptionSign', size: { x: 6, y: 1, z: 0.3 }, position: { x: -1, y: 8, z: -4.5 }, color: 'Dark grey', material: 'SmoothPlastic', anchored: true, transparency: 0, shape: 'Block' },
    ]
  },

  // Garage bay for vehicles
  garage_bay: {
    name: 'GarageBay',
    width: 12, depth: 20, height: 12,
    parts: [
      { name: 'Floor', size: { x: 12, y: 1, z: 20 }, position: { x: 0, y: 0.5, z: 0 }, color: 'Medium stone grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'RollDoorLeft', size: { x: 5, y: 10, z: 0.5 }, position: { x: -3, y: 6, z: -9.5 }, color: 'White', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'RollDoorRight', size: { x: 5, y: 10, z: 0.5 }, position: { x: 3, y: 6, z: -9.5 }, color: 'White', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'DoorHeader', size: { x: 12, y: 2, z: 0.5 }, position: { x: 0, y: 11, z: -9.5 }, color: 'Light grey', material: 'concrete', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'FloorDrain', size: { x: 1, y: 0.1, z: 20 }, position: { x: 0, y: 1.05, z: 0 }, color: 'Dark grey', material: 'metal', anchored: true, transparency: 0, shape: 'Block' },
      { name: 'WorkLight1', size: { x: 4, y: 0.5, z: 0.5 }, position: { x: -3, y: 11.5, z: 0 }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0.2, shape: 'Block' },
      { name: 'WorkLight2', size: { x: 4, y: 0.5, z: 0.5 }, position: { x: 3, y: 11.5, z: 0 }, color: 'Bright yellow', material: 'neon', anchored: true, transparency: 0.2, shape: 'Block' },
    ]
  },
}

// Building type → which rooms to include and their offsets
export const BUILDING_BLUEPRINTS: Record<string, {
  rooms: Array<{ template: string; offsetX: number; offsetZ: number; label: string }>
  exteriorColor: string
  roofColor: string
  totalWidth: number
  totalDepth: number
}> = {
  fire_station: {
    exteriorColor: 'Bright red',
    roofColor: 'Dark grey',
    totalWidth: 44,
    totalDepth: 36,
    rooms: [
      { template: 'apparatus_bay', offsetX: -11, offsetZ: -6, label: 'Apparatus Bay' },
      { template: 'kitchen', offsetX: 11, offsetZ: -8, label: 'Kitchen/Dayroom' },
      { template: 'bunkroom', offsetX: 11, offsetZ: 8, label: 'Bunkroom' },
      { template: 'office', offsetX: -16, offsetZ: 12, label: 'Watch Office' },
      { template: 'reception', offsetX: 0, offsetZ: 14, label: 'Common Area' },
    ]
  },
  police_station: {
    exteriorColor: 'Dark blue',
    roofColor: 'Dark grey',
    totalWidth: 40,
    totalDepth: 36,
    rooms: [
      { template: 'reception', offsetX: 0, offsetZ: -10, label: 'Public Reception' },
      { template: 'office', offsetX: -12, offsetZ: 2, label: 'Officer Bullpen' },
      { template: 'office', offsetX: 0, offsetZ: 2, label: 'Detective Office' },
      { template: 'holding_cell', offsetX: 12, offsetZ: 2, label: 'Holding Cell 1' },
      { template: 'holding_cell', offsetX: 12, offsetZ: 10, label: 'Holding Cell 2' },
      { template: 'kitchen', offsetX: -12, offsetZ: 14, label: 'Break Room' },
    ]
  },
  hospital: {
    exteriorColor: 'White',
    roofColor: 'Light grey',
    totalWidth: 50,
    totalDepth: 40,
    rooms: [
      { template: 'reception', offsetX: 0, offsetZ: -14, label: 'Reception/Triage' },
      { template: 'office', offsetX: -15, offsetZ: 0, label: 'Doctor Office' },
      { template: 'office', offsetX: 0, offsetZ: 0, label: 'Treatment Room' },
      { template: 'bunkroom', offsetX: 15, offsetZ: 0, label: 'Patient Ward' },
      { template: 'kitchen', offsetX: -10, offsetZ: 14, label: 'Staff Room' },
    ]
  }
}

export function detectBuildingType(prompt: string): string | null {
  const p = prompt.toLowerCase()
  if (p.includes('fire') && (p.includes('station') || p.includes('house'))) return 'fire_station'
  if (p.includes('police') && p.includes('station')) return 'police_station'
  if (p.includes('hospital') || p.includes('medical center') || p.includes('medical centre')) return 'hospital'
  return null
}
