// lib/model-library.ts
import { RbxPart } from './rbxmx'

function part(
  name: string,
  sx: number, sy: number, sz: number,
  px: number, py: number, pz: number,
  color: string, mat: string,
  transparency = 0,
  emissive = false,
): RbxPart {
  return { name, size: { x: sx, y: sy, z: sz }, position: { x: px, y: py, z: pz }, color, material: mat, anchored: true, transparency, emissive: emissive || undefined }
}

export function CHECKOUT_COUNTER(baseX: number, baseY: number, baseZ: number): RbxPart[] {
  const f = baseY + 1
  return [
    part('Checkout_CounterBase',   6,   1,   2,   baseX,       f + 0.5,   baseZ,        'White',            'smoothplastic'),
    part('Checkout_CounterTop',    6.2, 0.3, 2.3, baseX,       f + 1.15,  baseZ,        'Light grey',        'smoothplastic'),
    part('Checkout_FrontPanel',    6,   0.8, 0.2, baseX,       f + 0.9,   baseZ + 1.1,  'White',            'smoothplastic'),
    part('Checkout_MonitorBase',   0.6, 0.5, 0.5, baseX - 1.5, f + 1.55,  baseZ - 0.5,  'Dark grey',        'smoothplastic'),
    part('Checkout_MonitorScreen', 1.2, 0.9, 0.1, baseX - 1.5, f + 2.25,  baseZ - 0.5,  'Black',            'smoothplastic'),
    part('Checkout_BarrierPost1',  0.2, 1.2, 0.2, baseX + 3.5, f + 0.9,   baseZ - 2,    'Medium stone grey', 'metal'),
    part('Checkout_BarrierPost2',  0.2, 1.2, 0.2, baseX + 3.5, f + 0.9,   baseZ + 2,    'Medium stone grey', 'metal'),
    part('Checkout_Rope',          0.1, 0.1, 4,   baseX + 3.5, f + 1.4,   baseZ,        'Bright red',        'fabric'),
    part('Checkout_CashTray',      1,   0.1, 0.8, baseX + 1,   f + 1.2,   baseZ - 0.5,  'Dark grey',        'metal'),
    part('Checkout_Printer',       0.8, 0.5, 0.6, baseX + 2,   f + 1.55,  baseZ - 0.5,  'White',            'smoothplastic'),
    part('Checkout_Conveyor',      3,   0.2, 1.5, baseX - 0.5, f + 1.2,   baseZ,        'Dark grey',        'metal'),
  ]
}

export function SHELVING_UNIT(baseX: number, baseY: number, baseZ: number): RbxPart[] {
  const f = baseY + 1
  // Frame: h=5, floor-sitting → center at f + 2.5 (bottom at f, top at f+5)
  // Surfaces spaced 1.2 apart starting at f + 0.1 (h=0.2 sitting on floor)
  const parts: RbxPart[] = [
    part('Shelf_BackPanel', 4,   5,   0.3, baseX,     f + 2.5, baseZ + 2,   'White',      'smoothplastic'),
    part('Shelf_SideL',     0.3, 5,   4,   baseX - 2, f + 2.5, baseZ,       'Light grey', 'smoothplastic'),
    part('Shelf_SideR',     0.3, 5,   4,   baseX + 2, f + 2.5, baseZ,       'Light grey', 'smoothplastic'),
    part('Shelf_Surface1',  4,   0.2, 4,   baseX,     f + 0.1, baseZ,       'Light grey', 'smoothplastic'),
    part('Shelf_Surface2',  4,   0.2, 4,   baseX,     f + 1.3, baseZ,       'Light grey', 'smoothplastic'),
    part('Shelf_Surface3',  4,   0.2, 4,   baseX,     f + 2.5, baseZ,       'Light grey', 'smoothplastic'),
    part('Shelf_Surface4',  4,   0.2, 4,   baseX,     f + 3.7, baseZ,       'Light grey', 'smoothplastic'),
  ]
  const productColors = ['Bright red', 'Bright blue', 'Bright yellow', 'Bright green', 'Hot pink', 'Bright orange']
  for (let row = 0; row < 3; row++) {
    // Products sit on surfaces: surface tops at f+0.2, f+1.4, f+2.6 → product centers at f+0.4, f+1.6, f+2.8
    const py = f + 0.4 + row * 1.2
    for (let col = 0; col < 6; col++) {
      parts.push(part(
        `Shelf_Product_${row}_${col}`,
        0.5, 0.4, 0.5,
        baseX - 1.5 + col * 0.6, py, baseZ - 0.5,
        productColors[(row * 6 + col) % productColors.length], 'smoothplastic',
      ))
    }
  }
  return parts
}

export function REFRIGERATOR_UNIT(baseX: number, baseY: number, baseZ: number): RbxPart[] {
  const f = baseY + 1
  return [
    part('Fridge_BackPanel', 4,   6,   0.5, baseX,      f + 4,    baseZ + 2,   'Medium stone grey', 'metal'),
    part('Fridge_DoorL',     1.8, 5.5, 0.1, baseX - 1,  f + 3.75, baseZ - 2,   'Institutional white', 'smoothplastic', 0.4),
    part('Fridge_DoorR',     1.8, 5.5, 0.1, baseX + 1,  f + 3.75, baseZ - 2,   'Institutional white', 'smoothplastic', 0.4),
    part('Fridge_FrameL',    0.2, 6,   0.3, baseX - 2,  f + 4,    baseZ - 2,   'Dark grey',          'metal'),
    part('Fridge_FrameM',    0.2, 6,   0.3, baseX,      f + 4,    baseZ - 2,   'Dark grey',          'metal'),
    part('Fridge_FrameR',    0.2, 6,   0.3, baseX + 2,  f + 4,    baseZ - 2,   'Dark grey',          'metal'),
    part('Fridge_Shelf1',    3.5, 0.2, 3.5, baseX,      f + 2,    baseZ,        'White',             'smoothplastic'),
    part('Fridge_Shelf2',    3.5, 0.2, 3.5, baseX,      f + 3.5,  baseZ,        'White',             'smoothplastic'),
    part('Fridge_Shelf3',    3.5, 0.2, 3.5, baseX,      f + 5,    baseZ,        'White',             'smoothplastic'),
    part('Fridge_LightStrip',3.5, 0.2, 0.3, baseX,      f + 6.5,  baseZ - 1,   'Institutional white', 'neon', 0, true),
  ]
}

export function OFFICE_DESK(baseX: number, baseY: number, baseZ: number): RbxPart[] {
  const f = baseY + 1
  return [
    part('Desk_Surface',      4,   0.3, 2.5, baseX,       f + 2.15,  baseZ,        'Reddish brown', 'wood'),
    part('Desk_LegFL',        0.2, 2,   0.2, baseX - 1.8, f + 1,     baseZ - 1.1,  'Reddish brown', 'wood'),
    part('Desk_LegFR',        0.2, 2,   0.2, baseX + 1.8, f + 1,     baseZ - 1.1,  'Reddish brown', 'wood'),
    part('Desk_LegBL',        0.2, 2,   0.2, baseX - 1.8, f + 1,     baseZ + 1.1,  'Reddish brown', 'wood'),
    part('Desk_LegBR',        0.2, 2,   0.2, baseX + 1.8, f + 1,     baseZ + 1.1,  'Reddish brown', 'wood'),
    part('Desk_MonitorStand', 0.4, 0.8, 0.4, baseX - 1,   f + 2.7,   baseZ - 0.5,  'Dark grey',     'metal'),
    part('Desk_MonitorScreen',1.5, 1,   0.1, baseX - 1,   f + 3.4,   baseZ - 0.5,  'Black',         'smoothplastic'),
    part('Desk_Keyboard',     1.2, 0.1, 0.5, baseX,       f + 2.35,  baseZ - 0.3,  'Light grey',    'smoothplastic'),
    part('Desk_Mouse',        0.4, 0.1, 0.5, baseX + 0.9, f + 2.35,  baseZ - 0.3,  'Dark grey',     'smoothplastic'),
    part('Desk_Lamp',         0.2, 1.5, 0.2, baseX + 1.5, f + 3.05,  baseZ - 0.5,  'Institutional white', 'metal', 0, true),
    part('Desk_PaperStack',   0.8, 0.2, 0.6, baseX + 1,   f + 2.35,  baseZ + 0.5,  'White',         'smoothplastic'),
  ]
}

export function OFFICE_CHAIR(baseX: number, baseY: number, baseZ: number): RbxPart[] {
  const f = baseY + 1
  return [
    part('Chair_Seat',     1.5, 0.3, 1.5, baseX,      f + 1.9,  baseZ,        'Dark grey', 'fabric'),
    part('Chair_Cushion',  1.3, 0.2, 1.3, baseX,      f + 2.15, baseZ,        'Black',     'fabric'),
    part('Chair_Backrest', 1.4, 1.5, 0.3, baseX,      f + 3,    baseZ - 0.75, 'Dark grey', 'fabric'),
    part('Chair_Pole',     0.3, 1.8, 0.3, baseX,      f + 1,    baseZ,        'Medium stone grey', 'metal'),
    part('Chair_BaseA',    1.8, 0.15,0.3, baseX,      f + 0.15, baseZ,        'Dark grey', 'smoothplastic'),
    part('Chair_BaseB',    0.3, 0.15,1.8, baseX,      f + 0.15, baseZ,        'Dark grey', 'smoothplastic'),
    part('Chair_ArmL',     0.3, 0.2, 1,   baseX - 0.8,f + 2.5,  baseZ,        'Dark grey', 'smoothplastic'),
    part('Chair_ArmR',     0.3, 0.2, 1,   baseX + 0.8,f + 2.5,  baseZ,        'Dark grey', 'smoothplastic'),
  ]
}

export function POLICE_CELL(baseX: number, baseY: number, baseZ: number): RbxPart[] {
  const f = baseY + 1
  const parts: RbxPart[] = [
    part('Cell_Floor',        8,   0.5, 6,   baseX,      f - 0.75, baseZ,      'Medium stone grey', 'concrete'),
    part('Cell_WallBack',     8,   8,   0.5, baseX,      f + 4,    baseZ + 3,  'Medium stone grey', 'concrete'),
    part('Cell_WallL',        0.5, 8,   6,   baseX - 4,  f + 4,    baseZ,      'Medium stone grey', 'concrete'),
    part('Cell_WallR',        0.5, 8,   6,   baseX + 4,  f + 4,    baseZ,      'Medium stone grey', 'concrete'),
    part('Cell_RailTop',      8,   0.2, 0.2, baseX,      f + 7,    baseZ - 3,  'Dark grey', 'metal'),
    part('Cell_RailMid',      8,   0.2, 0.2, baseX,      f + 3.5,  baseZ - 3,  'Dark grey', 'metal'),
    part('Cell_Bench',        6,   0.3, 1.5, baseX,      f + 2,    baseZ + 2,  'Medium stone grey', 'concrete'),
    part('Cell_BenchSptL',    0.3, 2,   1.5, baseX - 2.5,f + 1,    baseZ + 2,  'Medium stone grey', 'concrete'),
    part('Cell_BenchSptR',    0.3, 2,   1.5, baseX + 2.5,f + 1,    baseZ + 2,  'Medium stone grey', 'concrete'),
    part('Cell_ToiletBase',   1.2, 1,   1.5, baseX + 3,  f + 1.5,  baseZ + 2,  'White', 'smoothplastic'),
    part('Cell_ToiletBowl',   1,   0.5, 1.2, baseX + 3,  f + 2.25, baseZ + 2,  'White', 'smoothplastic'),
    part('Cell_CeilLight',    2,   0.2, 0.5, baseX,      f + 7.8,  baseZ,      'Institutional white', 'neon', 0, true),
  ]
  for (let i = 0; i < 7; i++) {
    parts.push(part(`Cell_Bar${i + 1}`, 0.2, 7, 0.2, baseX - 3 + i, f + 4, baseZ - 3, 'Dark grey', 'metal'))
  }
  return parts
}

export function TOILET_CUBICLE(baseX: number, baseY: number, baseZ: number): RbxPart[] {
  const f = baseY + 1
  return [
    part('Cubicle_Floor',    4,   0.3, 4,   baseX,       f - 0.85, baseZ,       'White', 'marble'),
    part('Cubicle_WallBack', 4,   7,   0.3, baseX,       f + 3.5,  baseZ + 2,   'White', 'smoothplastic'),
    part('Cubicle_WallL',    0.3, 7,   4,   baseX - 2,   f + 3.5,  baseZ,       'White', 'smoothplastic'),
    part('Cubicle_WallR',    0.3, 7,   4,   baseX + 2,   f + 3.5,  baseZ,       'White', 'smoothplastic'),
    part('Cubicle_Door',     1.5, 5,   0.15,baseX,       f + 2.5,  baseZ - 2,   'Reddish brown', 'wood'),
    part('Cubicle_ToiletBase',1.2,1,   1.5, baseX,       f + 1.5,  baseZ + 1.2, 'White', 'smoothplastic'),
    part('Cubicle_ToiletSeat',1,  0.15,1.3, baseX,       f + 2.08, baseZ + 1.2, 'White', 'smoothplastic'),
    part('Cubicle_Cistern',  0.8, 1,   0.4, baseX,       f + 2.5,  baseZ + 1.9, 'White', 'smoothplastic'),
    part('Cubicle_Sink',     1,   0.3, 0.8, baseX - 0.5, f + 3.5,  baseZ - 1.5, 'White', 'smoothplastic'),
    part('Cubicle_Tap',      0.2, 0.5, 0.2, baseX - 0.5, f + 3.85, baseZ - 1.7, 'Medium stone grey', 'metal'),
    part('Cubicle_Mirror',   1.2, 1.5, 0.1, baseX - 0.5, f + 4.25, baseZ - 1.9, 'Institutional white', 'smoothplastic', 0.3),
  ]
}

export function RECEPTION_DESK(baseX: number, baseY: number, baseZ: number): RbxPart[] {
  const f = baseY + 1
  return [
    part('Reception_DeskMain',   8,   2,   2,   baseX,       f + 2,    baseZ,        'Reddish brown', 'smoothplastic'),
    part('Reception_DeskTop',    8.4, 0.3, 2.4, baseX,       f + 3.15, baseZ,        'Dark grey',     'smoothplastic'),
    part('Reception_BackPanel',  8,   5,   0.3, baseX,       f + 3.5,  baseZ + 2,    'Light grey',    'smoothplastic'),
    part('Reception_LogoPanel',  4,   2,   0.2, baseX,       f + 4.5,  baseZ + 2.2,  'Bright blue',   'smoothplastic'),
    part('Reception_Monitor1',   1.4, 1,   0.1, baseX - 2,   f + 4,    baseZ - 0.5,  'Black',         'smoothplastic'),
    part('Reception_Monitor2',   1.4, 1,   0.1, baseX + 2,   f + 4,    baseZ - 0.5,  'Black',         'smoothplastic'),
    part('Reception_Phone1',     0.7, 0.3, 0.5, baseX - 2.5, f + 3.3,  baseZ - 0.5,  'Dark grey',     'smoothplastic'),
    part('Reception_Phone2',     0.7, 0.3, 0.5, baseX + 2.5, f + 3.3,  baseZ - 0.5,  'Dark grey',     'smoothplastic'),
    part('Reception_Chair1Seat', 1.5, 0.4, 1.5, baseX - 5,   f + 1.7,  baseZ - 5,    'Sand blue',     'fabric'),
    part('Reception_Chair1Back', 1.5, 1.5, 0.3, baseX - 5,   f + 2.85, baseZ - 5.75, 'Sand blue',     'fabric'),
    part('Reception_Chair2Seat', 1.5, 0.4, 1.5, baseX - 2.5, f + 1.7,  baseZ - 5,    'Sand blue',     'fabric'),
    part('Reception_Chair2Back', 1.5, 1.5, 0.3, baseX - 2.5, f + 2.85, baseZ - 5.75, 'Sand blue',     'fabric'),
    part('Reception_Chair3Seat', 1.5, 0.4, 1.5, baseX,       f + 1.7,  baseZ - 5,    'Sand blue',     'fabric'),
    part('Reception_Chair3Back', 1.5, 1.5, 0.3, baseX,       f + 2.85, baseZ - 5.75, 'Sand blue',     'fabric'),
    part('Reception_CoffeeTable',2,   0.3, 1.2, baseX - 2.5, f + 1.65, baseZ - 3.5,  'Reddish brown', 'wood'),
  ]
}

export const PROP_LIBRARY = {
  CHECKOUT_COUNTER,
  SHELVING_UNIT,
  REFRIGERATOR_UNIT,
  OFFICE_DESK,
  OFFICE_CHAIR,
  POLICE_CELL,
  TOILET_CUBICLE,
  RECEPTION_DESK,
}

export function getPropsForRoom(roomName: string, roomX: number, roomZ: number, roomWidth: number, roomDepth: number): RbxPart[] {
  const n = roomName.toLowerCase()
  const insetX = roomWidth / 2 - 3
  const insetZ = roomDepth / 2 - 3

  if (n.includes('checkout') || n.includes('cashier') || n.includes('till') || n.includes('register')) {
    return PROP_LIBRARY.CHECKOUT_COUNTER(roomX, 0, roomZ + insetZ)
  }
  if (n.includes('refriger') || n.includes('fridge') || n.includes('cold') || n.includes('chiller')) {
    return [...PROP_LIBRARY.REFRIGERATOR_UNIT(roomX - 4, 0, roomZ), ...PROP_LIBRARY.REFRIGERATOR_UNIT(roomX + 4, 0, roomZ)]
  }
  if (n.includes('shelf') || n.includes('retail') || n.includes('sales') || n.includes('shop floor') || n.includes('showroom')) {
    return [...PROP_LIBRARY.SHELVING_UNIT(roomX - insetX + 2, 0, roomZ), ...PROP_LIBRARY.SHELVING_UNIT(roomX, 0, roomZ), ...PROP_LIBRARY.SHELVING_UNIT(roomX + insetX - 2, 0, roomZ)]
  }
  if (n.includes('reception') || n.includes('lobby') || n.includes('front desk') || n.includes('welcome') || n.includes('entrance hall')) {
    return PROP_LIBRARY.RECEPTION_DESK(roomX, 0, roomZ - insetZ + 3)
  }
  if (n.includes('office') || n.includes('admin') || n.includes('bureau') || n.includes('workstation') || n.includes('bullpen') || n.includes('open plan')) {
    return [...PROP_LIBRARY.OFFICE_DESK(roomX - 3, 0, roomZ - 2), ...PROP_LIBRARY.OFFICE_CHAIR(roomX - 3, 0, roomZ + 1), ...PROP_LIBRARY.OFFICE_DESK(roomX + 3, 0, roomZ - 2), ...PROP_LIBRARY.OFFICE_CHAIR(roomX + 3, 0, roomZ + 1)]
  }
  if (n.includes('cell') || n.includes('holding') || n.includes('detention') || n.includes('custody') || n.includes('brig')) {
    return PROP_LIBRARY.POLICE_CELL(roomX, 0, roomZ)
  }
  if (n.includes('toilet') || n.includes('bathroom') || n.includes('restroom') || n.includes('wc') || n.includes('lavatory') || n.includes('washroom') || n.includes('sanitary')) {
    return [...PROP_LIBRARY.TOILET_CUBICLE(roomX - 2.5, 0, roomZ), ...PROP_LIBRARY.TOILET_CUBICLE(roomX + 2.5, 0, roomZ)]
  }
  if (n.includes('meeting') || n.includes('conference') || n.includes('boardroom') || n.includes('briefing') || n.includes('seminar') || n.includes('committee')) {
    return [...PROP_LIBRARY.OFFICE_DESK(roomX, 0, roomZ), ...PROP_LIBRARY.OFFICE_CHAIR(roomX - 4, 0, roomZ - 2), ...PROP_LIBRARY.OFFICE_CHAIR(roomX - 2, 0, roomZ - 2), ...PROP_LIBRARY.OFFICE_CHAIR(roomX, 0, roomZ - 2), ...PROP_LIBRARY.OFFICE_CHAIR(roomX + 2, 0, roomZ - 2), ...PROP_LIBRARY.OFFICE_CHAIR(roomX + 4, 0, roomZ - 2)]
  }
  if (n.includes('locker') || n.includes('changing') || n.includes('dressing') || n.includes('cloakroom')) {
    return PROP_LIBRARY.OFFICE_CHAIR(roomX, 0, roomZ)
  }
  if (n.includes('storage') || n.includes('stock') || n.includes('warehouse') || n.includes('store room') || n.includes('archive') || n.includes('evidence')) {
    return [...PROP_LIBRARY.SHELVING_UNIT(roomX - insetX + 2, 0, roomZ), ...PROP_LIBRARY.SHELVING_UNIT(roomX + insetX - 2, 0, roomZ)]
  }
  if (n.includes('kitchen') || n.includes('canteen') || n.includes('cafeteria') || n.includes('break room') || n.includes('staff room') || n.includes('mess')) {
    return [...PROP_LIBRARY.OFFICE_DESK(roomX - 2, 0, roomZ), ...PROP_LIBRARY.OFFICE_CHAIR(roomX - 2, 0, roomZ + 2), ...PROP_LIBRARY.OFFICE_CHAIR(roomX + 2, 0, roomZ + 2)]
  }
  if (n.includes('ward') || n.includes('bay') || n.includes('patient') || n.includes('bed') || n.includes('recovery')) {
    return [...PROP_LIBRARY.OFFICE_DESK(roomX - 4, 0, roomZ), ...PROP_LIBRARY.OFFICE_DESK(roomX + 4, 0, roomZ)]
  }
  if (n.includes('gym') || n.includes('fitness') || n.includes('exercise') || n.includes('training')) {
    return [...PROP_LIBRARY.OFFICE_CHAIR(roomX - 3, 0, roomZ), ...PROP_LIBRARY.OFFICE_CHAIR(roomX + 3, 0, roomZ)]
  }

  return []
}
