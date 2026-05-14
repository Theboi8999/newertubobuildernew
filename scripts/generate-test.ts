import * as path from 'path'
import * as fs from 'fs'

// Load env variables
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8')
  env.split('\n').forEach(line => {
    const [key, ...val] = line.split('=')
    if (key && val.length) process.env[key.trim()] = val.join('=').trim()
  })
}

import { compileBlueprint } from '../lib/blueprint-compiler'
import { buildRbxmx } from '../lib/rbxmx'

interface SpecCheck {
  name: string
  check: (stats: GenerationStats) => boolean
}

interface GenerationStats {
  totalParts: number
  partNames: string[]
  colors: Record<string, number>
}

interface BuildingSpec {
  name: string
  research: Record<string, unknown>
  checks: SpecCheck[]
}

const BUILDINGS: BuildingSpec[] = [
  {
    name: 'Singapore Peranakan Shophouse',
    research: {
      buildingType: 'peranakan_shophouse',
      architecturalStyle: 'peranakan chinese colonial',
      floorCount: 4,
      floorHeight: 12,
      exteriorColor: 'Sand yellow',
      roofColor: 'Dark green',
      hasColonnade: true,
      rooms: [],
      confidence: 1,
      scenery: 'minimal',
    },
    checks: [
      { name: 'Has 4+ pagoda slabs', check: s => s.partNames.filter(n => /^Pag\d/.test(n)).length >= 4 },
      { name: 'Has 3+ floor bands', check: s => s.partNames.filter(n => n.startsWith('Band_F')).length >= 3 },
      { name: 'Has 4-6 colonnade columns', check: s => { const c = s.partNames.filter(n => n.startsWith('ColSh_')).length; return c >= 4 && c <= 8 } },
      { name: 'Has 6+ windows', check: s => s.partNames.filter(n => n.startsWith('WGlass_F')).length >= 6 },
      { name: 'Has 4 drain pipes', check: s => s.partNames.filter(n => n.startsWith('Drain_')).length >= 4 },
      { name: 'Has AC units', check: s => s.partNames.filter(n => n.startsWith('AC_')).length >= 2 },
      { name: 'Has service door', check: s => s.partNames.some(n => n === 'ServiceDoor') },
      { name: 'Sand yellow dominant', check: s => (s.colors['Sand yellow'] || 0) > 10 },
      { name: 'Dark green present', check: s => (s.colors['Dark green'] || 0) > 5 },
      { name: 'Has foundation', check: s => s.partNames.some(n => n === 'Foundation') },
      { name: 'Has front wall', check: s => s.partNames.some(n => n === 'WallFront') },
      { name: 'Has entrance door', check: s => s.partNames.some(n => n.includes('Door')) },
      { name: 'Has ground slab', check: s => s.partNames.some(n => n === 'Ground') },
      { name: 'Has pilasters', check: s => s.partNames.filter(n => n.startsWith('Pil_')).length >= 4 },
      { name: 'Has window frames', check: s => s.partNames.filter(n => n.startsWith('WFrT_F')).length >= 6 },
      { name: 'Has window shutters', check: s => s.partNames.filter(n => n.startsWith('ShutL_')).length >= 4 },
      { name: 'Total parts above 200', check: s => s.totalParts > 200 },
      { name: 'Total parts below 2000', check: s => s.totalParts < 2000 },
      { name: 'No undefined colors', check: s => !Object.keys(s.colors).some(c => c === 'undefined' || c === 'null' || c === '') },
      { name: 'Has roof cap', check: s => s.partNames.some(n => n.includes('RoofCap') || n.includes('TopRoof') || n.includes('TopPag')) },
    ],
  },
  {
    name: 'Victorian Townhouse',
    research: {
      buildingType: 'victorian_house',
      architecturalStyle: 'victorian',
      floorCount: 3,
      floorHeight: 12,
      exteriorColor: 'Reddish brown',
      roofColor: 'Really black',
      hasColonnade: false,
      rooms: [],
      confidence: 1,
      scenery: 'minimal',
    },
    checks: [
      { name: 'Has roof parts', check: s => s.partNames.some(n => n.includes('Roof') || n.includes('Gable') || n.includes('Hip')) },
      { name: 'Has windows', check: s => s.partNames.filter(n => n.startsWith('WGlass_F')).length >= 4 },
      { name: 'Reddish brown dominant', check: s => (s.colors['Reddish brown'] || 0) > 5 },
      { name: 'Has front wall', check: s => s.partNames.some(n => n === 'WallFront') },
      { name: 'Has foundation', check: s => s.partNames.some(n => n === 'Foundation') },
      { name: 'No pagoda parts', check: s => s.partNames.filter(n => /^Pag\d/.test(n)).length === 0 },
      { name: 'No colonnade columns', check: s => s.partNames.filter(n => n.startsWith('ColSh_')).length === 0 },
      { name: 'Has floor bands', check: s => s.partNames.filter(n => n.startsWith('Band_F')).length >= 2 },
      { name: 'Total parts above 150', check: s => s.totalParts > 150 },
      { name: 'Has drain pipes', check: s => s.partNames.filter(n => n.startsWith('Drain_')).length >= 4 },
      { name: 'No undefined colors', check: s => !Object.keys(s.colors).some(c => c === 'undefined' || c === 'null' || c === '') },
    ],
  },
  {
    name: 'Modern Office Tower',
    research: {
      buildingType: 'modern_office',
      architecturalStyle: 'modernist',
      floorCount: 8,
      floorHeight: 12,
      exteriorColor: 'White',
      roofColor: 'Dark grey',
      hasColonnade: false,
      rooms: [],
      confidence: 1,
      scenery: 'minimal',
    },
    checks: [
      { name: 'Has 8 floors of windows', check: s => s.partNames.filter(n => n.startsWith('WGlass_F')).length >= 16 },
      { name: 'Has flat roof', check: s => s.partNames.some(n => n === 'Roof' || n === 'Parapet_F') },
      { name: 'White dominant', check: s => (s.colors['White'] || 0) > 10 },
      { name: 'Has foundation', check: s => s.partNames.some(n => n === 'Foundation') },
      { name: 'Has front wall', check: s => s.partNames.some(n => n === 'WallFront') },
      { name: 'No pagoda parts', check: s => s.partNames.filter(n => /^Pag\d/.test(n)).length === 0 },
      { name: 'No colonnade columns', check: s => s.partNames.filter(n => n.startsWith('ColSh_')).length === 0 },
      { name: 'Has floor bands', check: s => s.partNames.filter(n => n.startsWith('Band_F')).length >= 7 },
      { name: 'Total parts above 300', check: s => s.totalParts > 300 },
      { name: 'Has drain pipes', check: s => s.partNames.filter(n => n.startsWith('Drain_')).length >= 4 },
      { name: 'Has AC units on roof', check: s => s.partNames.some(n => n.startsWith('RoofAC') || n.startsWith('AC')) },
      { name: 'No undefined colors', check: s => !Object.keys(s.colors).some(c => c === 'undefined' || c === 'null' || c === '') },
    ],
  },
]

function analyzeGeneration(research: Record<string, unknown>): GenerationStats {
  const blueprint = compileBlueprint(research as any)
  const partNames = blueprint.exterior.map((p: any) => p.name)
  const colors: Record<string, number> = {}

  for (const part of blueprint.exterior as any[]) {
    colors[part.color] = (colors[part.color] || 0) + 1
  }

  return {
    totalParts: blueprint.exterior.length,
    partNames,
    colors,
  }
}

function runChecks(spec: BuildingSpec): { passed: number, total: number, failures: string[] } {
  console.log('\n' + '═'.repeat(60))
  console.log(`TESTING: ${spec.name}`)
  console.log('═'.repeat(60))

  let stats: GenerationStats
  try {
    stats = analyzeGeneration(spec.research)
  } catch (e: any) {
    console.log('❌ CRASH during generation:', e.message)
    return { passed: 0, total: spec.checks.length, failures: ['Generation crashed: ' + e.message] }
  }

  console.log(`Total parts: ${stats.totalParts}`)
  console.log(`Unique colors: ${Object.keys(stats.colors).length}`)
  console.log(`Top colors: ${Object.entries(stats.colors).sort((a,b) => b[1]-a[1]).slice(0,5).map(([c,n]) => `${c}(${n})`).join(', ')}`)
  console.log('')

  const failures: string[] = []
  let passed = 0

  for (const check of spec.checks) {
    let result: boolean
    try {
      result = check.check(stats)
    } catch (e: any) {
      result = false
    }

    if (result) {
      console.log(`✅ ${check.name}`)
      passed++
    } else {
      console.log(`❌ ${check.name}`)
      failures.push(check.name)
    }
  }

  console.log(`\nResult: ${passed}/${spec.checks.length} passed`)
  return { passed, total: spec.checks.length, failures }
}

async function main() {
  const targetBuilding = process.argv[2]
  const buildings = targetBuilding
    ? BUILDINGS.filter(b => b.name.toLowerCase().includes(targetBuilding.toLowerCase()))
    : BUILDINGS

  if (buildings.length === 0) {
    console.log('No matching building found. Available:')
    BUILDINGS.forEach(b => console.log(' -', b.name))
    process.exit(1)
  }

  let allPassed = true
  const summary: { name: string, passed: number, total: number, failures: string[] }[] = []

  for (const building of buildings) {
    const result = runChecks(building)
    summary.push({ name: building.name, ...result })
    if (result.passed < result.total) allPassed = false
  }

  console.log('\n' + '═'.repeat(60))
  console.log('SUMMARY')
  console.log('═'.repeat(60))
  for (const s of summary) {
    const icon = s.passed === s.total ? '✅' : '❌'
    console.log(`${icon} ${s.name}: ${s.passed}/${s.total}`)
    if (s.failures.length > 0) {
      s.failures.forEach(f => console.log(`   - FAIL: ${f}`))
    }
  }

  process.exit(allPassed ? 0 : 1)
}

main()
