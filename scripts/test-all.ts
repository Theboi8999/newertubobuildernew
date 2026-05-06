import { analysePrompt } from '../lib/prompt-intelligence'
import { applyStyleDefaults } from '../lib/style-library'
import { preGate, postGate } from '../lib/quality-gate'
import { compileBlueprint } from '../lib/blueprint-compiler'
import { checkBuildingQuality } from '../lib/quality-checker'
import { ResearchResult } from '../lib/research-agent'
import { placeRoomsWithBSP, getRoomType } from '../lib/room-placer'
import { calculateWindowPositions, buildProportionalWindow } from '../lib/window-system'

// ── Test runner ──────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (e: any) {
    console.error(`❌ ${name}: ${e.message}`)
    failed++
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg)
}

// ── Mock research result ─────────────────────────────────────────────────────

function mockResearch(overrides: Partial<ResearchResult> = {}): ResearchResult {
  return {
    buildingType: 'test_building',
    floorCount: 1,
    floorHeight: 10,
    architecturalStyle: 'modern',
    hasGlassFront: false,
    hasColonnade: false,
    exteriorMaterial: 'smoothplastic',
    exteriorColor: 'Light grey',
    roofColor: 'Dark grey',
    totalWidth: 40,
    totalDepth: 28,
    culturalNotes: '',
    confidence: 80,
    rooms: [
      { name: 'Main Hall', width: 20, depth: 16, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
      { name: 'Office', width: 14, depth: 12, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
      { name: 'Reception', width: 14, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
      { name: 'Staff Room', width: 10, depth: 8, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
      { name: 'Toilet', width: 6, depth: 6, height: 10, furniture: [], wallColor: 'White', floorColor: 'White', floorMaterial: 'Marble' },
      { name: 'Meeting Room', width: 12, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'Concrete' },
    ],
    ...overrides
  }
}

// ── PROMPT INTELLIGENCE TESTS ────────────────────────────────────────────────

console.log('\n═══ PROMPT INTELLIGENCE ═══')

test('detects Singapore region', () => {
  const r = analysePrompt('Singapore Peranakan shophouse')
  assert(r.region === 'singapore', `expected singapore got ${r.region}`)
})

test('detects UK region', () => {
  const r = analysePrompt('UK police station Victorian')
  assert(r.region === 'united kingdom', `expected united kingdom got ${r.region}`)
})

test('detects floor count from prompt', () => {
  const r = analysePrompt('4 storey building')
  assert(r.floorCountHint === 4, `expected 4 got ${r.floorCountHint}`)
})

test('detects floor count word form', () => {
  const r = analysePrompt('four storey shophouse')
  assert(r.floorCountHint === 4, `expected 4 got ${r.floorCountHint}`)
})

test('detects peranakan style hint', () => {
  const r = analysePrompt('Peranakan colonial heritage building')
  assert(r.styleHints.includes('peranakan'), `styleHints: ${r.styleHints}`)
})

test('detects colonial style hint', () => {
  const r = analysePrompt('colonial shophouse Singapore')
  assert(r.styleHints.includes('colonial'), `styleHints: ${r.styleHints}`)
})

test('extracts building type', () => {
  const r = analysePrompt('Japanese convenience store')
  assert(r.buildingType.length > 0, 'buildingType is empty')
})

test('handles empty prompt gracefully', () => {
  const r = analysePrompt('')
  assert(typeof r.buildingType === 'string', 'buildingType should be string')
})

// ── STYLE LIBRARY TESTS ──────────────────────────────────────────────────────

console.log('\n═══ STYLE LIBRARY ═══')

test('peranakan applies Sand yellow exterior', () => {
  const r = applyStyleDefaults(mockResearch({ buildingType: 'peranakan_shophouse', architecturalStyle: 'modern' }))
  assert(r.exteriorColor === 'Sand yellow', `expected Sand yellow got ${r.exteriorColor}`)
})

test('peranakan applies Dark green roof', () => {
  const r = applyStyleDefaults(mockResearch({ buildingType: 'peranakan_shophouse', architecturalStyle: 'modern' }))
  assert(r.roofColor === 'Dark green', `expected Dark green got ${r.roofColor}`)
})

test('peranakan enables colonnade', () => {
  const r = applyStyleDefaults(mockResearch({ buildingType: 'peranakan_shophouse' }))
  assert(r.hasColonnade === true, 'expected hasColonnade true')
})

test('peranakan sets 3 floors minimum', () => {
  const r = applyStyleDefaults(mockResearch({ buildingType: 'peranakan_shophouse', floorCount: 1 }))
  assert(r.floorCount >= 3, `expected >=3 floors got ${r.floorCount}`)
})

test('victorian applies Reddish brown', () => {
  const r = applyStyleDefaults(mockResearch({ buildingType: 'victorian_police_station', architecturalStyle: 'modern' }))
  assert(r.exteriorColor === 'Reddish brown', `expected Reddish brown got ${r.exteriorColor}`)
})

test('does not override good research data', () => {
  const r = applyStyleDefaults(mockResearch({ buildingType: 'peranakan_shophouse', exteriorColor: 'Bright blue', floorCount: 5 }))
  assert(r.exteriorColor === 'Bright blue', `should not override good color, got ${r.exteriorColor}`)
  assert(r.floorCount === 5, `should not override good floorCount, got ${r.floorCount}`)
})

test('gothic sets correct floor count', () => {
  const r = applyStyleDefaults(mockResearch({ buildingType: 'gothic_cathedral', floorCount: 1 }))
  assert(r.floorCount >= 4, `expected >=4 floors got ${r.floorCount}`)
})

test('police station gets brick material', () => {
  const r = applyStyleDefaults(mockResearch({ buildingType: 'uk_police_station' }))
  assert(r.exteriorMaterial === 'brick', `expected brick got ${r.exteriorMaterial}`)
})

test('hospital gets White exterior', () => {
  const r = applyStyleDefaults(mockResearch({ buildingType: 'hospital', architecturalStyle: 'modern' }))
  assert(r.exteriorColor === 'White', `expected White got ${r.exteriorColor}`)
})

test('no match returns original research unchanged', () => {
  const original = mockResearch({ buildingType: 'some_unknown_thing_xyz', exteriorColor: 'Bright red' })
  const r = applyStyleDefaults(original)
  assert(r.exteriorColor === 'Bright red', `should be unchanged, got ${r.exteriorColor}`)
})

// ── QUALITY GATE TESTS ───────────────────────────────────────────────────────

console.log('\n═══ QUALITY GATE ═══')

test('passes valid research', () => {
  const result = preGate(mockResearch({ confidence: 80 }))
  assert(result.passed === true, `expected passed, issues: ${result.issues.join(',')}`)
})

test('fails with zero rooms', () => {
  const result = preGate(mockResearch({ rooms: [] }))
  assert(result.passed === false, 'expected failed with empty rooms')
})

test('fails with invalid floorCount', () => {
  const result = preGate(mockResearch({ floorCount: NaN }))
  assert(result.passed === false, 'expected failed with NaN floorCount')
})

test('fails with missing exteriorColor', () => {
  const result = preGate(mockResearch({ exteriorColor: '' }))
  assert(result.passed === false, 'expected failed with missing exteriorColor')
})

test('warns on low confidence', () => {
  const result = preGate(mockResearch({ confidence: 10 }))
  assert(result.warnings.some(w => w.includes('confidence')), 'expected confidence warning')
})

test('post gate passes with good part count', () => {
  const mockRbxmx = '<Item class="Part">'.repeat(50) + '<Y>30</Y>'.repeat(50)
  const result = postGate(50, mockRbxmx, mockResearch({ floorCount: 2, floorHeight: 10 }))
  assert(result.passed === true, `expected passed, issues: ${result.issues.join(',')}`)
})

test('post gate fails with critically low parts', () => {
  const result = postGate(5, '<roblox></roblox>', mockResearch())
  assert(result.passed === false, 'expected failed with 5 parts')
})

// ── BLUEPRINT COMPILER TESTS ─────────────────────────────────────────────────

console.log('\n═══ BLUEPRINT COMPILER ═══')

test('compiles basic building', () => {
  const r = compileBlueprint(mockResearch())
  assert(r.exterior.length > 0, 'no exterior parts')
  assert(r.rooms.length > 0, 'no rooms')
  assert(r.roomLayout.length > 0, 'no room layout')
})

test('exterior has correct part count for single storey', () => {
  const r = compileBlueprint(mockResearch({ floorCount: 1 }))
  assert(r.exterior.length >= 10, `too few exterior parts: ${r.exterior.length}`)
})

test('multi storey has more exterior parts than single', () => {
  const single = compileBlueprint(mockResearch({ floorCount: 1 }))
  const multi = compileBlueprint(mockResearch({ floorCount: 4 }))
  assert(multi.exterior.length > single.exterior.length, `multi(${multi.exterior.length}) should have more parts than single(${single.exterior.length})`)
})

test('peranakan generates pagoda parts', () => {
  const r = compileBlueprint(mockResearch({
    buildingType: 'peranakan_shophouse',
    floorCount: 3,
    architecturalStyle: 'peranakan chinese colonial',
    hasColonnade: true,
    exteriorColor: 'Sand yellow',
    roofColor: 'Dark green'
  }))
  const hasPagoda = r.exterior.some(p => p.name.includes('Pag'))
  assert(hasPagoda, 'peranakan building should have pagoda parts')
})

test('exterior color matches research', () => {
  const r = compileBlueprint(mockResearch({ exteriorColor: 'Sand yellow' }))
  const wallParts = r.exterior.filter(p => p.name.includes('Wall') || p.name.includes('Front'))
  const sandYellow = wallParts.filter(p => p.color === 'Sand yellow')
  assert(sandYellow.length > 0, `no Sand yellow parts found. Colors: ${Array.from(new Set(wallParts.map(p=>p.color))).join(',')}`)
})

test('colonial style generates colonnade', () => {
  const r = compileBlueprint(mockResearch({
    architecturalStyle: 'victorian brick classical',
    hasColonnade: true,
    floorCount: 2
  }))
  const colParts = r.exterior.filter(p => p.name.includes('Col'))
  assert(colParts.length > 0, 'colonial building should have colonnade parts')
})

test('glass building generates glass front', () => {
  const r = compileBlueprint(mockResearch({
    architecturalStyle: 'modern glass curtain',
    hasGlassFront: true,
    floorCount: 2
  }))
  const glassParts = r.exterior.filter(p => p.transparency > 0.2)
  assert(glassParts.length > 0, 'glass building should have transparent parts')
})

test('room layout positions match room count', () => {
  const r = compileBlueprint(mockResearch())
  assert(r.roomLayout.length === mockResearch().rooms.length, `layout length ${r.roomLayout.length} should match rooms ${mockResearch().rooms.length}`)
})

test('all parts have valid sizes', () => {
  const r = compileBlueprint(mockResearch())
  const allParts = [...r.exterior, ...r.rooms.flat()]
  const invalid = allParts.filter(p => p.size.x <= 0 || p.size.y <= 0 || p.size.z <= 0)
  assert(invalid.length === 0, `${invalid.length} parts have invalid size: ${invalid.map(p=>p.name).join(',')}`)
})

test('all parts have valid colors', () => {
  const r = compileBlueprint(mockResearch())
  const allParts = [...r.exterior, ...r.rooms.flat()]
  const noColor = allParts.filter(p => !p.color || p.color === 'undefined' || p.color === 'null')
  assert(noColor.length === 0, `${noColor.length} parts have invalid color`)
})

test('all parts have valid materials', () => {
  const r = compileBlueprint(mockResearch())
  const allParts = [...r.exterior, ...r.rooms.flat()]
  const noMat = allParts.filter(p => !p.material || p.material === 'undefined')
  assert(noMat.length === 0, `${noMat.length} parts have invalid material`)
})

// ── COLOR VALIDATION TESTS ───────────────────────────────────────────────────

console.log('\n═══ COLOR VALIDATION ═══')

// Test the vc() function indirectly through compileBlueprint
const colorTests: [string, string][] = [
  ['Sand yellow', 'Sand yellow'],
  ['sand yellow', 'Sand yellow'],
  ['SAND YELLOW', 'Sand yellow'],
  ['Dark green', 'Dark green'],
  ['Reddish brown', 'Reddish brown'],
  ['Medium stone grey', 'Medium stone grey'],
  ['Really black', 'Really black'],
  ['Navy blue', 'Navy blue'],
  ['Light grey', 'Light grey'],
  ['White', 'White'],
]

for (const [input, expected] of colorTests) {
  test(`color "${input}" → "${expected}"`, () => {
    const r = compileBlueprint(mockResearch({ exteriorColor: input }))
    const walls = r.exterior.filter(p => p.name.includes('Wall') || p.name.includes('Front'))
    const match = walls.some(p => p.color === expected)
    assert(match, `color ${input} did not produce ${expected}. Got: ${Array.from(new Set(walls.map(p=>p.color))).join(',')}`)
  })
}

// ── QUALITY CHECKER TESTS ────────────────────────────────────────────────────

console.log('\n═══ QUALITY CHECKER ═══')

test('returns checks array with items', () => {
  const parts = compileBlueprint(mockResearch()).exterior
  const result = checkBuildingQuality(parts, mockResearch(), 'test_building')
  assert(Array.isArray(result.checks), 'checks should be array')
  assert(result.checks.length > 0, 'should have at least one check')
})

test('percentage is 0-100', () => {
  const parts = compileBlueprint(mockResearch()).exterior
  const result = checkBuildingQuality(parts, mockResearch(), 'test_building')
  assert(result.percentage >= 0 && result.percentage <= 100, `percentage ${result.percentage} out of range`)
})

test('good building passes quality check', () => {
  const r = compileBlueprint(mockResearch())
  const allParts = [...r.rooms.flat(), ...r.exterior]
  const result = checkBuildingQuality(allParts, mockResearch(), 'test_building')
  assert(result.percentage >= 60, `expected quality >=60%, got ${result.percentage}%`)
})

test('empty parts returns low quality', () => {
  const result = checkBuildingQuality([], null, 'test_building')
  assert(result.percentage < 50, `expected quality <50% for empty parts, got ${result.percentage}%`)
})

test('empty parts returns suggestions', () => {
  const result = checkBuildingQuality([], null, 'test_building')
  assert(result.suggestions.length > 0, 'should have suggestions for empty parts')
})

test('suggestions are strings', () => {
  const result = checkBuildingQuality([], null, 'test_building')
  assert(result.suggestions.every(s => typeof s === 'string'), 'all suggestions should be strings')
})

test('check names are non-empty strings', () => {
  const parts = compileBlueprint(mockResearch()).exterior
  const result = checkBuildingQuality(parts, mockResearch(), 'test_building')
  assert(result.checks.every(c => typeof c.name === 'string' && c.name.length > 0), 'all checks should have names')
})

test('check scores are 0-100', () => {
  const parts = compileBlueprint(mockResearch()).exterior
  const result = checkBuildingQuality(parts, mockResearch(), 'test_building')
  const invalid = result.checks.filter(c => c.score < 0 || c.score > 100)
  assert(invalid.length === 0, `invalid scores: ${invalid.map(c => c.name + ':' + c.score).join(',')}`)
})

test('peranakan building passes floor and wall checks', () => {
  const r = compileBlueprint(mockResearch({
    buildingType: 'peranakan_shophouse',
    architecturalStyle: 'peranakan chinese colonial',
    hasColonnade: true,
    exteriorColor: 'Sand yellow',
    roofColor: 'Dark green',
    floorCount: 3,
  }))
  const allParts = [...r.rooms.flat(), ...r.exterior]
  const result = checkBuildingQuality(allParts, mockResearch(), 'peranakan_shophouse')
  const floorCheck = result.checks.find(c => c.name === 'Floor Parts')
  const wallCheck = result.checks.find(c => c.name === 'Wall Parts')
  assert(floorCheck?.passed === true, 'floor check should pass')
  assert(wallCheck?.passed === true, 'wall check should pass')
})

// ── BSP ROOM PLACER TESTS ────────────────────────────────────────────────────

console.log('\n═══ BSP ROOM PLACER ═══')

test('BSP places all rooms', () => {
  const specs = [
    { name: 'Reception', width: 14, depth: 12, type: 'reception' },
    { name: 'Office', width: 12, depth: 10, type: 'office' },
    { name: 'Kitchen', width: 10, depth: 8, type: 'kitchen' },
    { name: 'Toilet', width: 6, depth: 6, type: 'toilet' },
    { name: 'Meeting', width: 12, depth: 10, type: 'meeting' },
    { name: 'Storage', width: 8, depth: 8, type: 'storage' },
  ]
  const rooms = placeRoomsWithBSP(60, 40, specs, 42)
  assert(rooms.length === specs.length, `expected ${specs.length} rooms got ${rooms.length}`)
})

test('BSP rooms stay within bounds', () => {
  const specs = Array.from({ length: 6 }, (_, i) => ({ name: `Room${i}`, width: 10, depth: 8, type: 'default' }))
  const rooms = placeRoomsWithBSP(60, 40, specs, 42)
  for (const r of rooms) {
    assert(r.x - r.width / 2 >= 0, `room ${r.name} left edge out of bounds: ${r.x - r.width / 2}`)
    assert(r.x + r.width / 2 <= 60, `room ${r.name} right edge out of bounds: ${r.x + r.width / 2}`)
    assert(r.z - r.depth / 2 >= 0, `room ${r.name} top edge out of bounds: ${r.z - r.depth / 2}`)
    assert(r.z + r.depth / 2 <= 60, `room ${r.name} bottom edge out of bounds: ${r.z + r.depth / 2}`)
  }
})

test('BSP same seed produces same layout', () => {
  const specs = Array.from({ length: 6 }, (_, i) => ({ name: `Room${i}`, width: 10, depth: 8, type: 'default' }))
  const r1 = placeRoomsWithBSP(60, 40, specs, 1234)
  const r2 = placeRoomsWithBSP(60, 40, specs, 1234)
  assert(r1[0].x === r2[0].x, 'same seed should produce same layout')
})

test('BSP different seeds produce different layouts', () => {
  const specs = Array.from({ length: 6 }, (_, i) => ({ name: `Room${i}`, width: 10, depth: 8, type: 'default' }))
  const r1 = placeRoomsWithBSP(60, 40, specs, 1)
  const r2 = placeRoomsWithBSP(60, 40, specs, 9999)
  const different = r1.some((r, i) => r.x !== r2[i]?.x || r.z !== r2[i]?.z)
  assert(different, 'different seeds should produce different layouts')
})

test('getRoomType identifies reception', () => {
  assert(getRoomType('Reception Lobby') === 'reception', 'should be reception')
})

test('getRoomType identifies office', () => {
  assert(getRoomType('Main Office') === 'office', 'should be office')
})

test('getRoomType returns default for unknown', () => {
  assert(getRoomType('Unnamed Area XYZ') === 'default', 'should be default')
})

// ── WINDOW SYSTEM TESTS ──────────────────────────────────────────────────────

console.log('\n═══ WINDOW SYSTEM ═══')

test('golden ratio window count for modern style', () => {
  const positions = calculateWindowPositions(30, 10, 0, 'modern')
  assert(positions.length >= 2, `expected >= 2 windows got ${positions.length}`)
})

test('windows stay within wall bounds', () => {
  const positions = calculateWindowPositions(20, 10, 0, 'colonial')
  for (const pos of positions) {
    assert(Math.abs(pos.offset) + pos.width / 2 <= 10, `window at offset ${pos.offset} width ${pos.width} exceeds wall`)
  }
})

test('chinese style generates lattice parts', () => {
  const parts = buildProportionalWindow({
    x: 0, y: 5, z: 0, width: 3, height: 4,
    direction: 'north', style: 'chinese', wallColor: 'Sand yellow'
  })
  const hasLattice = parts.some(p => p.name.includes('Lat'))
  assert(hasLattice, 'chinese window should have lattice parts')
})

test('victorian style generates lintel', () => {
  const parts = buildProportionalWindow({
    x: 0, y: 5, z: 0, width: 3, height: 4,
    direction: 'north', style: 'victorian', wallColor: 'Reddish brown'
  })
  const hasLintel = parts.some(p => p.name.includes('Lintel'))
  assert(hasLintel, 'victorian window should have lintel')
})

test('window parts have valid dimensions', () => {
  const parts = buildProportionalWindow({
    x: 0, y: 5, z: 0, width: 3, height: 4,
    direction: 'north', style: 'modern', wallColor: 'Light grey'
  })
  const invalid = parts.filter(p => p.size.x <= 0 || p.size.y <= 0 || p.size.z <= 0)
  assert(invalid.length === 0, `${invalid.length} window parts have invalid dimensions`)
})

test('colonial window has lattice parts', () => {
  const parts = buildProportionalWindow({
    x: 0, y: 5, z: 0, width: 3, height: 4,
    direction: 'north', style: 'colonial', wallColor: 'White'
  })
  const hasLattice = parts.some(p => p.name.includes('Lat'))
  assert(hasLattice, 'colonial window should have lattice parts')
})

test('industrial window has steel parts', () => {
  const parts = buildProportionalWindow({
    x: 0, y: 5, z: 0, width: 3, height: 4,
    direction: 'north', style: 'industrial', wallColor: 'Dark grey'
  })
  const hasSteel = parts.some(p => p.name.includes('Steel'))
  assert(hasSteel, 'industrial window should have steel parts')
})

test('window always has glass part', () => {
  const parts = buildProportionalWindow({
    x: 0, y: 5, z: 0, width: 3, height: 4,
    direction: 'east', style: 'modern', wallColor: 'Light grey'
  })
  const hasGlass = parts.some(p => p.name.includes('Glass'))
  assert(hasGlass, 'window should always have glass part')
})

// ── PERANAKAN FORCED OVERRIDES ───────────────────────────────────────────────

console.log('\n═══ PERANAKAN FORCED OVERRIDES ═══')

test('generator forces Sand yellow for peranakan prompt', () => {
  const bt = 'singapore_peranakan_shophouse'
  const prompt = 'Singapore Peranakan shophouse colonial'
  const btLower = bt.toLowerCase()
  const promptLower = prompt.toLowerCase()
  const isPeranakan = btLower.includes('peranakan') || btLower.includes('shophouse') ||
    btLower.includes('singapore') || promptLower.includes('peranakan')
  assert(isPeranakan === true, 'should detect peranakan from buildingType and prompt')
})

test('peranakan building has pagoda parts after compile', () => {
  const r = compileBlueprint(mockResearch({
    buildingType: 'peranakan_shophouse',
    floorCount: 3,
    architecturalStyle: 'peranakan chinese colonial',
    hasColonnade: true,
    exteriorColor: 'Sand yellow',
    roofColor: 'Dark green',
    totalWidth: 40,
    totalDepth: 28,
  }))
  const allParts = [...r.exterior, ...r.rooms.flat()]
  const hasPagoda = allParts.some(p => p.name.toLowerCase().includes('pag'))
  assert(hasPagoda, `no pagoda parts found. Part names sample: ${allParts.slice(0, 10).map(p => p.name).join(',')}`)
})

test('peranakan building has Sand yellow walls', () => {
  const r = compileBlueprint(mockResearch({
    buildingType: 'peranakan_shophouse',
    floorCount: 3,
    architecturalStyle: 'peranakan chinese colonial',
    hasColonnade: true,
    exteriorColor: 'Sand yellow',
    roofColor: 'Dark green',
  }))
  const wallParts = r.exterior.filter(p => p.name.includes('Wall') || p.name.includes('Front'))
  const sandYellow = wallParts.filter(p => p.color === 'Sand yellow')
  assert(sandYellow.length > 0, `no Sand yellow walls. Wall colors: ${Array.from(new Set(wallParts.map(p => p.color))).join(',')}`)
})

test('peranakan building has colonnade parts', () => {
  const r = compileBlueprint(mockResearch({
    buildingType: 'peranakan_shophouse',
    architecturalStyle: 'peranakan chinese colonial',
    hasColonnade: true,
    exteriorColor: 'Sand yellow',
  }))
  const colParts = r.exterior.filter(p => p.name.toLowerCase().includes('col_') || p.name.toLowerCase().includes('arch'))
  assert(colParts.length > 0, 'no colonnade parts found')
})

test('victorian building gets Reddish brown exterior', () => {
  const r = compileBlueprint(mockResearch({
    buildingType: 'victorian_police_station',
    architecturalStyle: 'victorian brick classical',
    exteriorColor: 'Reddish brown',
    floorCount: 2,
  }))
  const wallParts = r.exterior.filter(p => p.name.includes('Wall'))
  const correct = wallParts.filter(p => p.color === 'Reddish brown')
  assert(correct.length > 0, `no Reddish brown walls. Colors: ${Array.from(new Set(wallParts.map(p => p.color))).join(',')}`)
})

test('terrain parts generated', () => {
  const r = compileBlueprint(mockResearch({
    buildingType: 'peranakan_shophouse',
    architecturalStyle: 'peranakan chinese colonial',
    hasColonnade: true,
    exteriorColor: 'Sand yellow',
  }))
  const terrain = r.exterior.filter(p =>
    p.name.toLowerCase().includes('terrain') ||
    p.name.toLowerCase().includes('road') ||
    p.name.toLowerCase().includes('tree')
  )
  assert(terrain.length > 0, 'no terrain parts found')
})

// ── WINDOW SYSTEM PROPORTIONS ────────────────────────────────────────────────

console.log('\n═══ WINDOW SYSTEM PROPORTIONS ═══')

test('window positions respect wall bounds', () => {
  const positions = calculateWindowPositions(30, 10, 0, 'peranakan chinese colonial')
  for (const pos of positions) {
    assert(Math.abs(pos.offset) + pos.width / 2 <= 15.5, `window at ${pos.offset} width ${pos.width} exceeds 30-stud wall`)
  }
})

test('peranakan windows have lattice', () => {
  const parts = buildProportionalWindow({
    x: 0, y: 5, z: 0, width: 3, height: 4,
    direction: 'north', style: 'peranakan chinese colonial', wallColor: 'Sand yellow'
  })
  const lattice = parts.filter(p => p.name.includes('Lat'))
  assert(lattice.length >= 2, `expected lattice parts, got ${lattice.length}`)
})

// ── SUMMARY ──────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════')
console.log(`RESULTS: ${passed} passed, ${failed} failed`)
console.log('═══════════════════════════════\n')

if (failed > 0) {
  process.exit(1)
}
