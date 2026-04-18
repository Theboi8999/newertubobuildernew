// lib/static-specs.ts — high-confidence static building specs, bypass all API calls
import type { ResearchResult } from './research-agent'

export const STATIC_BUILDING_SPECS: Record<string, ResearchResult> = {

  // ── Police Station ────────────────────────────────────────────────────────
  police_station: {
    buildingType: 'police_station',
    totalWidth: 80, totalDepth: 60,
    exteriorColor: 'Navy blue', roofColor: 'Dark grey',
    culturalNotes: 'UK/US police station — custody suite, CID, dispatch',
    confidence: 99,
    rooms: [
      {
        name: 'Main Lobby Reception', width: 20, depth: 14, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Reception Desk',   size: { x: 6, y: 1.2, z: 2 },   color: 'Dark grey',    material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Waiting Bench',    size: { x: 4, y: 1,   z: 1 },   color: 'Dark grey',    material: 'smoothplastic', quantity: 2, placement: 'east_wall' },
          { name: 'Info Board',       size: { x: 3, y: 2,   z: 0.2 }, color: 'White',        material: 'smoothplastic', quantity: 1, placement: 'west_wall' },
          { name: 'Security Screen',  size: { x: 4, y: 1.8, z: 0.2 }, color: 'Ghost white',  material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Waiting Chair',    size: { x: 1, y: 1,   z: 1 },   color: 'Dark grey',    material: 'fabric',        quantity: 4, placement: 'east_wall' },
        ],
      },
      {
        name: 'Patrol Officer Bullpen', width: 26, depth: 18, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Officer Desk',     size: { x: 3, y: 1,   z: 2 },   color: 'Dark grey',    material: 'smoothplastic', quantity: 4, placement: 'row' },
          { name: 'Office Chair',     size: { x: 1, y: 1,   z: 1 },   color: 'Black',        material: 'fabric',        quantity: 4, placement: 'row' },
          { name: 'Filing Cabinet',   size: { x: 1, y: 2,   z: 1.5 }, color: 'Medium stone grey', material: 'metal',   quantity: 2, placement: 'west_wall' },
          { name: 'Whiteboard',       size: { x: 4, y: 2,   z: 0.2 }, color: 'White',        material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Bulletin Board',   size: { x: 3, y: 2,   z: 0.2 }, color: 'Sand yellow',  material: 'wood',          quantity: 1, placement: 'north_wall' },
          { name: 'Printer',          size: { x: 1.5, y: 1, z: 1.5 }, color: 'White',        material: 'smoothplastic', quantity: 1, placement: 'east_wall' },
        ],
      },
      {
        name: 'Detective Division', width: 22, depth: 16, height: 10,
        wallColor: 'Sand yellow', floorColor: 'Reddish brown', floorMaterial: 'wood',
        furniture: [
          { name: 'Detective Desk',   size: { x: 3, y: 1,   z: 2 },   color: 'Reddish brown', material: 'wood',         quantity: 3, placement: 'row' },
          { name: 'Detective Chair',  size: { x: 1, y: 1,   z: 1 },   color: 'Black',         material: 'fabric',       quantity: 3, placement: 'row' },
          { name: 'Case Board',       size: { x: 5, y: 2.5, z: 0.2 }, color: 'Sand yellow',   material: 'wood',         quantity: 1, placement: 'north_wall' },
          { name: 'Filing Cabinet',   size: { x: 1, y: 2,   z: 1.5 }, color: 'Reddish brown', material: 'wood',         quantity: 1, placement: 'east_wall' },
          { name: 'Bookshelf',        size: { x: 1, y: 2,   z: 2 },   color: 'Reddish brown', material: 'wood',         quantity: 1, placement: 'west_wall' },
        ],
      },
      {
        name: 'Interrogation Room 1', width: 10, depth: 10, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Interview Table',  size: { x: 3, y: 1,   z: 2 },   color: 'Dark grey',    material: 'smoothplastic', quantity: 1, placement: 'center' },
          { name: 'Chair',            size: { x: 1, y: 1,   z: 1 },   color: 'Dark grey',    material: 'smoothplastic', quantity: 3, placement: 'center' },
          { name: 'One Way Mirror',   size: { x: 4, y: 2,   z: 0.2 }, color: 'Ghost white',  material: 'smoothplastic', quantity: 1, placement: 'east_wall' },
          { name: 'Recording Device', size: { x: 0.5, y: 0.5, z: 0.5 }, color: 'Black',      material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
        ],
      },
      {
        name: 'Interrogation Room 2', width: 10, depth: 10, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Interview Table',  size: { x: 3, y: 1,   z: 2 },   color: 'Dark grey',    material: 'smoothplastic', quantity: 1, placement: 'center' },
          { name: 'Chair',            size: { x: 1, y: 1,   z: 1 },   color: 'Dark grey',    material: 'smoothplastic', quantity: 3, placement: 'center' },
          { name: 'One Way Mirror',   size: { x: 4, y: 2,   z: 0.2 }, color: 'Ghost white',  material: 'smoothplastic', quantity: 1, placement: 'east_wall' },
        ],
      },
      {
        name: 'Holding Cells Block', width: 18, depth: 14, height: 10,
        wallColor: 'Medium stone grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Cell Bars',        size: { x: 0.3, y: 8, z: 8 },   color: 'Dark grey',    material: 'metal',         quantity: 2, placement: 'east_wall' },
          { name: 'Cell Bench',       size: { x: 4, y: 0.5, z: 1 },   color: 'Medium stone grey', material: 'concrete', quantity: 2, placement: 'south_wall' },
          { name: 'Guard Desk',       size: { x: 2, y: 1,   z: 1.5 }, color: 'Dark grey',    material: 'smoothplastic', quantity: 1, placement: 'west_wall' },
          { name: 'CCTV Monitor',     size: { x: 1.5, y: 1, z: 0.3 }, color: 'Black',        material: 'smoothplastic', quantity: 1, placement: 'west_wall' },
        ],
      },
      {
        name: 'Evidence Room', width: 14, depth: 12, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Evidence Shelf',   size: { x: 1, y: 3,   z: 6 },   color: 'Medium stone grey', material: 'metal',   quantity: 3, placement: 'north_wall' },
          { name: 'Processing Table', size: { x: 4, y: 1,   z: 2 },   color: 'Dark grey',    material: 'smoothplastic', quantity: 1, placement: 'center' },
          { name: 'Secure Locker',    size: { x: 1, y: 2,   z: 1 },   color: 'Dark grey',    material: 'metal',         quantity: 1, placement: 'east_wall' },
          { name: 'Intake Counter',   size: { x: 3, y: 1,   z: 1.5 }, color: 'Dark grey',    material: 'smoothplastic', quantity: 1, placement: 'south_wall' },
        ],
      },
      {
        name: 'Armoury Store', width: 12, depth: 10, height: 10,
        wallColor: 'Dark grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Weapon Rack',      size: { x: 0.5, y: 2.5, z: 4 }, color: 'Dark grey',    material: 'metal',         quantity: 2, placement: 'north_wall' },
          { name: 'Equipment Locker', size: { x: 1, y: 2,   z: 1 },   color: 'Dark grey',    material: 'metal',         quantity: 3, placement: 'east_wall' },
          { name: 'Vest Rack',        size: { x: 1, y: 1.8, z: 3 },   color: 'Dark grey',    material: 'metal',         quantity: 1, placement: 'west_wall' },
          { name: 'Ammo Cabinet',     size: { x: 1.5, y: 1.8, z: 1 }, color: 'Black',        material: 'metal',         quantity: 1, placement: 'south_wall' },
        ],
      },
      {
        name: 'Locker Room', width: 14, depth: 10, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Locker Bank',      size: { x: 1, y: 2.5, z: 6 },   color: 'Medium stone grey', material: 'metal',   quantity: 3, placement: 'north_wall' },
          { name: 'Bench',            size: { x: 4, y: 0.5, z: 0.8 }, color: 'Reddish brown', material: 'wood',         quantity: 2, placement: 'center' },
          { name: 'Mirror',           size: { x: 3, y: 1.8, z: 0.2 }, color: 'Ghost white',   material: 'smoothplastic', quantity: 1, placement: 'south_wall' },
        ],
      },
      {
        name: 'Break Room', width: 12, depth: 10, height: 10,
        wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'wood',
        furniture: [
          { name: 'Canteen Table',    size: { x: 4, y: 1,   z: 2 },   color: 'Reddish brown', material: 'wood',         quantity: 1, placement: 'center' },
          { name: 'Dining Chair',     size: { x: 1, y: 1,   z: 1 },   color: 'Reddish brown', material: 'wood',         quantity: 4, placement: 'center' },
          { name: 'Kitchen Counter',  size: { x: 5, y: 1,   z: 1.5 }, color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Fridge',           size: { x: 1.5, y: 3, z: 1.5 }, color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Microwave',        size: { x: 1, y: 0.6, z: 0.8 }, color: 'Dark grey',     material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Coffee Machine',   size: { x: 0.8, y: 1, z: 0.8 }, color: 'Black',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Vending Machine',  size: { x: 1, y: 3,   z: 1 },   color: 'Dark grey',     material: 'smoothplastic', quantity: 1, placement: 'east_wall' },
        ],
      },
      {
        name: 'Commanders Office', width: 14, depth: 12, height: 10,
        wallColor: 'Sand yellow', floorColor: 'Reddish brown', floorMaterial: 'wood',
        furniture: [
          { name: 'Executive Desk',   size: { x: 4, y: 1,   z: 2 },   color: 'Reddish brown', material: 'wood',         quantity: 1, placement: 'north_wall' },
          { name: 'Executive Chair',  size: { x: 1.2, y: 1.5, z: 1.2 }, color: 'Black',       material: 'fabric',       quantity: 1, placement: 'north_wall' },
          { name: 'Visitor Chair',    size: { x: 1, y: 1,   z: 1 },   color: 'Black',         material: 'fabric',       quantity: 2, placement: 'center' },
          { name: 'Bookcase',         size: { x: 1, y: 3,   z: 4 },   color: 'Reddish brown', material: 'wood',         quantity: 1, placement: 'west_wall' },
          { name: 'Awards Cabinet',   size: { x: 1.5, y: 2.5, z: 3 }, color: 'Reddish brown', material: 'wood',         quantity: 1, placement: 'east_wall' },
          { name: 'Flag Stand',       size: { x: 0.3, y: 3,  z: 0.3 }, color: 'Dark grey',    material: 'metal',        quantity: 1, placement: 'north_wall' },
        ],
      },
      {
        name: 'Dispatch Control Centre', width: 18, depth: 14, height: 10,
        wallColor: 'Dark grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Dispatch Console', size: { x: 3, y: 1, z: 2 },     color: 'Black',         material: 'smoothplastic', quantity: 3, placement: 'row' },
          { name: 'Operator Chair',   size: { x: 1, y: 1, z: 1 },     color: 'Black',         material: 'fabric',        quantity: 3, placement: 'row' },
          { name: 'Main Display',     size: { x: 6, y: 3, z: 0.3 },   color: 'Black',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Server Rack',      size: { x: 1, y: 3, z: 1.5 },   color: 'Dark grey',     material: 'metal',         quantity: 2, placement: 'east_wall' },
          { name: 'Radio Tower',      size: { x: 0.5, y: 4, z: 0.5 }, color: 'Dark grey',     material: 'metal',         quantity: 1, placement: 'east_wall' },
        ],
      },
      {
        name: 'Records Room', width: 12, depth: 10, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Archive Shelf',    size: { x: 1, y: 3,   z: 5 },   color: 'Medium stone grey', material: 'metal',   quantity: 3, placement: 'north_wall' },
          { name: 'Microfilm Reader', size: { x: 2, y: 1.5, z: 1.5 }, color: 'Dark grey',     material: 'smoothplastic', quantity: 1, placement: 'east_wall' },
          { name: 'Records Desk',     size: { x: 3, y: 1,   z: 1.5 }, color: 'Dark grey',     material: 'smoothplastic', quantity: 1, placement: 'center' },
          { name: 'Document Scanner', size: { x: 1.5, y: 0.8, z: 1 }, color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'east_wall' },
          { name: 'Shredder',         size: { x: 0.6, y: 1.2, z: 0.6 }, color: 'Dark grey',   material: 'smoothplastic', quantity: 1, placement: 'south_wall' },
        ],
      },
    ],
  },

  // ── Convenience Store ─────────────────────────────────────────────────────
  convenience_store: {
    buildingType: 'convenience_store',
    totalWidth: 48, totalDepth: 32,
    exteriorColor: 'Bright green', roofColor: 'White',
    culturalNotes: 'Japanese-style convenience store (konbini)',
    confidence: 95,
    rooms: [
      {
        name: 'Main Shopping Floor', width: 24, depth: 16, height: 10,
        wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Shelf Unit',       size: { x: 1, y: 4, z: 6 },     color: 'White',         material: 'smoothplastic', quantity: 4, placement: 'row' },
          { name: 'Display Fridge',   size: { x: 1.5, y: 5, z: 6 },   color: 'Dark grey',     material: 'metal',         quantity: 1, placement: 'east_wall' },
        ],
      },
      {
        name: 'Checkout Area', width: 12, depth: 8, height: 10,
        wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Checkout Counter', size: { x: 6, y: 1, z: 2 },     color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'south_wall' },
          { name: 'Register',         size: { x: 1, y: 1.2, z: 0.8 }, color: 'Dark grey',     material: 'smoothplastic', quantity: 2, placement: 'south_wall' },
          { name: 'Queue Barrier',    size: { x: 0.2, y: 1.2, z: 0.2 }, color: 'Medium stone grey', material: 'metal',  quantity: 4, placement: 'center' },
        ],
      },
      {
        name: 'Hot Food Counter', width: 8, depth: 6, height: 10,
        wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Hot Case Display', size: { x: 5, y: 1.5, z: 1.5 }, color: 'Dark grey',     material: 'metal',         quantity: 1, placement: 'north_wall' },
          { name: 'Coffee Station',   size: { x: 2, y: 1.5, z: 1.5 }, color: 'Dark grey',     material: 'smoothplastic', quantity: 1, placement: 'west_wall' },
        ],
      },
      {
        name: 'Staff Room', width: 10, depth: 8, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Staff Desk',       size: { x: 3, y: 1, z: 2 },     color: 'Reddish brown', material: 'wood',          quantity: 1, placement: 'north_wall' },
          { name: 'Locker',           size: { x: 1, y: 2.5, z: 1 },   color: 'Medium stone grey', material: 'metal',     quantity: 4, placement: 'east_wall' },
        ],
      },
      {
        name: 'Storage Room', width: 10, depth: 8, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Storage Shelf',    size: { x: 1, y: 3, z: 6 },     color: 'Medium stone grey', material: 'metal',     quantity: 3, placement: 'north_wall' },
          { name: 'Pallet Jack',      size: { x: 1, y: 0.5, z: 2 },   color: 'Dark grey',     material: 'metal',         quantity: 1, placement: 'south_wall' },
        ],
      },
      {
        name: 'Customer Toilet', width: 6, depth: 6, height: 10,
        wallColor: 'White', floorColor: 'White', floorMaterial: 'marble',
        furniture: [
          { name: 'Toilet',           size: { x: 1.2, y: 1, z: 1.5 }, color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Sink',             size: { x: 1, y: 0.3, z: 0.8 }, color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'east_wall' },
          { name: 'Mirror',           size: { x: 1.2, y: 1.5, z: 0.1 }, color: 'Ghost white', material: 'smoothplastic', quantity: 1, placement: 'east_wall' },
        ],
      },
    ],
  },

  // ── Hospital ──────────────────────────────────────────────────────────────
  hospital: {
    buildingType: 'hospital',
    totalWidth: 80, totalDepth: 60,
    exteriorColor: 'White', roofColor: 'Light grey',
    culturalNotes: 'NHS acute hospital — A&E, wards, outpatients',
    confidence: 92,
    rooms: [
      {
        name: 'Main Entrance', width: 20, depth: 14, height: 10,
        wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Info Desk',        size: { x: 6, y: 1.2, z: 2 },   color: 'Bright blue',   material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Waiting Chair',    size: { x: 1, y: 1,   z: 1 },   color: 'Bright blue',   material: 'fabric',        quantity: 6, placement: 'east_wall' },
          { name: 'Sign Post',        size: { x: 0.2, y: 3, z: 0.2 }, color: 'Bright blue',   material: 'metal',         quantity: 2, placement: 'center' },
        ],
      },
      {
        name: 'Reception Triage', width: 16, depth: 12, height: 10,
        wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Triage Desk',      size: { x: 5, y: 1.2, z: 2 },   color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Nurse Chair',      size: { x: 1, y: 1,   z: 1 },   color: 'Bright blue',   material: 'fabric',        quantity: 2, placement: 'north_wall' },
          { name: 'Waiting Seat',     size: { x: 4, y: 1,   z: 1 },   color: 'Bright blue',   material: 'fabric',        quantity: 2, placement: 'east_wall' },
        ],
      },
      {
        name: 'Emergency Bay', width: 20, depth: 16, height: 10,
        wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Hospital Bed',     size: { x: 2.5, y: 1, z: 6 },   color: 'White',         material: 'smoothplastic', quantity: 4, placement: 'row' },
          { name: 'Bed Curtain',      size: { x: 0.2, y: 3, z: 6 },   color: 'White',         material: 'fabric',        quantity: 4, placement: 'row' },
          { name: 'IV Stand',         size: { x: 0.3, y: 4, z: 0.3 }, color: 'Light grey',    material: 'metal',         quantity: 4, placement: 'row' },
          { name: 'Medical Cart',     size: { x: 1.5, y: 2, z: 1 },   color: 'Light grey',    material: 'metal',         quantity: 2, placement: 'west_wall' },
          { name: 'Monitor Unit',     size: { x: 1, y: 1.5, z: 0.8 }, color: 'Dark grey',     material: 'smoothplastic', quantity: 2, placement: 'north_wall' },
        ],
      },
      {
        name: 'General Ward', width: 20, depth: 16, height: 10,
        wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Ward Bed',         size: { x: 2.5, y: 1, z: 6 },   color: 'White',         material: 'smoothplastic', quantity: 4, placement: 'row' },
          { name: 'Bedside Cabinet',  size: { x: 0.8, y: 1, z: 0.8 }, color: 'Light grey',    material: 'smoothplastic', quantity: 4, placement: 'row' },
          { name: 'Nurses Station Desk', size: { x: 4, y: 1, z: 2 },  color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
        ],
      },
      {
        name: 'Operating Theatre', width: 18, depth: 16, height: 10,
        wallColor: 'Institutional white', floorColor: 'White', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Operating Table',  size: { x: 2.5, y: 1, z: 6 },   color: 'Light grey',    material: 'metal',         quantity: 1, placement: 'center' },
          { name: 'Surgical Light',   size: { x: 2, y: 0.5, z: 2 },   color: 'Institutional white', material: 'metal',   quantity: 2, placement: 'center' },
          { name: 'Equipment Tray',   size: { x: 1, y: 1, z: 2 },     color: 'Light grey',    material: 'metal',         quantity: 2, placement: 'east_wall' },
          { name: 'Anesthesia Unit',  size: { x: 1, y: 1.5, z: 1 },   color: 'Dark grey',     material: 'smoothplastic', quantity: 1, placement: 'west_wall' },
          { name: 'Monitor Tower',    size: { x: 1, y: 2, z: 1 },     color: 'Dark grey',     material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
        ],
      },
      {
        name: 'Pharmacy', width: 14, depth: 10, height: 10,
        wallColor: 'White', floorColor: 'White', floorMaterial: 'smoothplastic',
        furniture: [
          { name: 'Medicine Shelf',   size: { x: 1, y: 3, z: 5 },     color: 'White',         material: 'smoothplastic', quantity: 3, placement: 'north_wall' },
          { name: 'Dispensing Counter', size: { x: 5, y: 1.2, z: 2 }, color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'south_wall' },
          { name: 'Fridge Unit',      size: { x: 1.5, y: 3, z: 1.5 }, color: 'White',         material: 'metal',         quantity: 1, placement: 'east_wall' },
        ],
      },
      {
        name: 'Staff Room', width: 12, depth: 10, height: 10,
        wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'wood',
        furniture: [
          { name: 'Dining Table',     size: { x: 4, y: 1, z: 2 },     color: 'Reddish brown', material: 'wood',          quantity: 1, placement: 'center' },
          { name: 'Chair',            size: { x: 1, y: 1, z: 1 },     color: 'Bright blue',   material: 'fabric',        quantity: 4, placement: 'center' },
          { name: 'Kitchen Counter',  size: { x: 4, y: 1, z: 1.5 },   color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Fridge',           size: { x: 1.5, y: 3, z: 1.5 }, color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
        ],
      },
      {
        name: 'Store Room', width: 10, depth: 8, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Supply Shelf',     size: { x: 1, y: 3, z: 5 },     color: 'Medium stone grey', material: 'metal',     quantity: 3, placement: 'north_wall' },
          { name: 'Supply Trolley',   size: { x: 1.5, y: 2, z: 1 },   color: 'Light grey',    material: 'metal',         quantity: 2, placement: 'south_wall' },
        ],
      },
    ],
  },

  // ── Fire Station ──────────────────────────────────────────────────────────
  fire_station: {
    buildingType: 'fire_station',
    totalWidth: 50, totalDepth: 36,
    exteriorColor: 'Bright red', roofColor: 'Dark grey',
    culturalNotes: 'UK fire station — appliance bay, watch room, living quarters',
    confidence: 92,
    rooms: [
      {
        name: 'Apparatus Bay', width: 24, depth: 20, height: 14,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Bay Door Panel',   size: { x: 5, y: 12, z: 0.5 },  color: 'White',         material: 'metal',         quantity: 4, placement: 'north_wall' },
          { name: 'Floor Lane Line',  size: { x: 0.3, y: 0.1, z: 18 }, color: 'Bright yellow', material: 'smoothplastic', quantity: 2, placement: 'center' },
          { name: 'Hose Rack',        size: { x: 4, y: 4, z: 1 },     color: 'Bright red',    material: 'metal',         quantity: 1, placement: 'east_wall' },
          { name: 'Equipment Board',  size: { x: 8, y: 5, z: 0.5 },   color: 'Dark orange',   material: 'smoothplastic', quantity: 1, placement: 'south_wall' },
          { name: 'Ceiling Light',    size: { x: 8, y: 0.5, z: 1 },   color: 'Bright yellow', material: 'neon',          quantity: 4, placement: 'center' },
        ],
      },
      {
        name: 'Watch Room', width: 12, depth: 10, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Watch Desk',       size: { x: 5, y: 1.2, z: 2 },   color: 'Dark grey',     material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Control Panel',    size: { x: 3, y: 1, z: 1.5 },   color: 'Dark grey',     material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Turnout Board',    size: { x: 4, y: 2, z: 0.2 },   color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'west_wall' },
          { name: 'Chair',            size: { x: 1, y: 1, z: 1 },     color: 'Dark grey',     material: 'fabric',        quantity: 2, placement: 'north_wall' },
        ],
      },
      {
        name: 'Briefing Room', width: 14, depth: 10, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Briefing Table',   size: { x: 8, y: 1, z: 3 },     color: 'Reddish brown', material: 'wood',          quantity: 1, placement: 'center' },
          { name: 'Chair',            size: { x: 1, y: 1, z: 1 },     color: 'Dark grey',     material: 'fabric',        quantity: 6, placement: 'center' },
          { name: 'Whiteboard',       size: { x: 5, y: 2, z: 0.2 },   color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Projector Screen', size: { x: 4, y: 2.5, z: 0.1 }, color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
        ],
      },
      {
        name: 'Dormitory', width: 14, depth: 12, height: 10,
        wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'wood',
        furniture: [
          { name: 'Bunk Bed Frame',   size: { x: 2.5, y: 5, z: 6 },   color: 'Light grey',    material: 'metal',         quantity: 3, placement: 'east_wall' },
          { name: 'Mattress',         size: { x: 2.5, y: 0.5, z: 6 }, color: 'White',         material: 'fabric',        quantity: 3, placement: 'east_wall' },
          { name: 'Locker',           size: { x: 1, y: 2.5, z: 1 },   color: 'Medium stone grey', material: 'metal',     quantity: 4, placement: 'west_wall' },
          { name: 'Bedside Table',    size: { x: 0.8, y: 1, z: 0.8 }, color: 'Light grey',    material: 'smoothplastic', quantity: 3, placement: 'east_wall' },
        ],
      },
      {
        name: 'Kitchen Dayroom', width: 14, depth: 12, height: 10,
        wallColor: 'White', floorColor: 'Sand yellow', floorMaterial: 'wood',
        furniture: [
          { name: 'Kitchen Counter',  size: { x: 8, y: 1, z: 1.5 },   color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Dining Table',     size: { x: 6, y: 1, z: 3 },     color: 'Reddish brown', material: 'wood',          quantity: 1, placement: 'center' },
          { name: 'Dining Chair',     size: { x: 1, y: 1, z: 1 },     color: 'Dark grey',     material: 'fabric',        quantity: 6, placement: 'center' },
          { name: 'Fridge',           size: { x: 1.5, y: 3, z: 1.5 }, color: 'White',         material: 'smoothplastic', quantity: 1, placement: 'north_wall' },
          { name: 'Sofa',             size: { x: 5, y: 1.5, z: 2 },   color: 'Bright red',    material: 'fabric',        quantity: 1, placement: 'south_wall' },
          { name: 'TV',               size: { x: 4, y: 2.5, z: 0.2 }, color: 'Black',         material: 'smoothplastic', quantity: 1, placement: 'east_wall' },
        ],
      },
      {
        name: 'Locker Room', width: 10, depth: 8, height: 10,
        wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete',
        furniture: [
          { name: 'Turnout Locker',   size: { x: 1, y: 2.5, z: 1 },   color: 'Dark grey',     material: 'metal',         quantity: 6, placement: 'north_wall' },
          { name: 'Bench',            size: { x: 6, y: 0.5, z: 1 },   color: 'Reddish brown', material: 'wood',          quantity: 1, placement: 'center' },
          { name: 'Helmet Rack',      size: { x: 4, y: 1, z: 0.5 },   color: 'Dark grey',     material: 'metal',         quantity: 1, placement: 'south_wall' },
        ],
      },
    ],
  },
}
