import * as fs from 'fs'
import * as path from 'path'
import { analysePrompt } from '../lib/prompt-intelligence'
import { applyStyleDefaults, matchStyleLibrary } from '../lib/style-library'
import { preGate } from '../lib/quality-gate'
import { compileBlueprint } from '../lib/blueprint-compiler'
import { checkBuildingQuality } from '../lib/quality-checker'
import { buildRbxmx, RbxModel } from '../lib/rbxmx'
import { watermarkRbxmx } from '../lib/output-validator'
import type { ResearchResult } from '../lib/research-agent'

// ── Output plumbing ────────────────────────────────────────────────────────────

const lines: string[] = []

function log(...args: unknown[]) {
  const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')
  console.log(msg)
  lines.push(msg)
}

function header(title: string) {
  const bar = '═'.repeat(60)
  log('')
  log(bar)
  log(title)
  log(bar)
}

function subheader(title: string) {
  log('')
  log(`── ${title} ──`)
}

// ── Base mock research result for "Singapore Peranakan shophouse 4 floors" ────
// This simulates what the AI research step would return before any overrides.

const BASE_RESEARCH: ResearchResult = {
  buildingType: 'singapore_peranakan_shophouse',
  floorCount: 2,                       // AI often underestimates — overrides will fix
  floorHeight: 10,
  architecturalStyle: 'modern',        // before style library match
  hasGlassFront: false,
  hasColonnade: false,                 // before override
  exteriorMaterial: 'smoothplastic',
  exteriorColor: 'Light grey',         // before override
  roofColor: 'Dark grey',             // before override
  totalWidth: 40,
  totalDepth: 28,
  culturalNotes: 'Peranakan shophouses feature five-foot ways, ornate tiles, shuttered windows',
  confidence: 85,
  rooms: [
    { name: 'Reception', width: 14, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
    { name: 'Office',    width: 14, depth: 12, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
    { name: 'Storage',  width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
  ],
}

const PROMPT = 'Singapore Peranakan shophouse 4 floors'
const SEED = 42

// ── STEP 1: PROMPT ANALYSIS ───────────────────────────────────────────────────

header('=== STEP 1: PROMPT ANALYSIS ===')
log('Prompt:', PROMPT)
const intent = analysePrompt(PROMPT)
log('analysePrompt output:')
log(intent)

// ── STEP 2: RESEARCH RESULT ───────────────────────────────────────────────────

header('=== STEP 2: RESEARCH RESULT (simulated AI output — pre-override) ===')
log('NOTE: In production this comes from groqGenerate. Using representative mock.')
log('buildingType:', BASE_RESEARCH.buildingType)
log('floorCount:', BASE_RESEARCH.floorCount)
log('floorHeight:', BASE_RESEARCH.floorHeight)
log('architecturalStyle:', BASE_RESEARCH.architecturalStyle)
log('exteriorColor:', BASE_RESEARCH.exteriorColor)
log('roofColor:', BASE_RESEARCH.roofColor)
log('accentColor:', BASE_RESEARCH.accentColor ?? 'not set')
log('hasColonnade:', BASE_RESEARCH.hasColonnade)
log('hasGlassFront:', BASE_RESEARCH.hasGlassFront)
log('hasPagodaRoof:', BASE_RESEARCH.hasPagodaRoof ?? 'not set')
log('confidence:', BASE_RESEARCH.confidence)
log('rooms:')
BASE_RESEARCH.rooms.forEach((r, i) => {
  log(`  [${i}] ${r.name}: ${r.width}w × ${r.depth}d × ${r.height}h | wall:${r.wallColor} floor:${r.floorColor}/${r.floorMaterial}`)
})
log('Full ResearchResult:')
log(BASE_RESEARCH)

// ── STEP 3: STYLE LIBRARY MATCH ──────────────────────────────────────────────

header('=== STEP 3: STYLE LIBRARY MATCH ===')
const rawResearch = { ...BASE_RESEARCH }
const afterStyle = applyStyleDefaults(rawResearch)

const matchKey = (() => {
  const text = (BASE_RESEARCH.buildingType + ' ' + BASE_RESEARCH.architecturalStyle).toLowerCase()
  const keys = ['peranakan', 'shophouse', 'chinese colonial', 'pagoda', 'victorian', 'georgian',
    'gothic', 'tudor', 'art-deco', 'art deco', 'brutalist', 'industrial', 'mediterranean', 'baroque',
    'glass', 'skyscraper', 'castle', 'mosque', 'church', 'parliament', 'courthouse', 'museum',
    'library', 'hospital', 'hotel', 'school', 'police', 'stadium', 'airport', 'temple', 'japanese',
    'bank', 'fire', 'warehouse', 'apartment', 'modern']
  return keys.find(k => text.includes(k)) ?? null
})()

log('Search text:', `"${BASE_RESEARCH.buildingType} ${BASE_RESEARCH.architecturalStyle}"`)
log('Matched style key:', matchKey ?? 'NONE — no match, research returned unchanged')

subheader('Before → After for every field changed by applyStyleDefaults')
const fields = Object.keys(BASE_RESEARCH) as (keyof ResearchResult)[]
let anyChanged = false
for (const field of fields) {
  const before = (rawResearch as unknown as Record<string, unknown>)[field]
  const after  = (afterStyle  as unknown as Record<string, unknown>)[field]
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    log(`  ${field}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`)
    anyChanged = true
  }
}
if (!anyChanged) log('  (no fields changed)')
log('Full result after applyStyleDefaults:')
log(afterStyle)

// ── STEP 4: FORCED OVERRIDES ─────────────────────────────────────────────────

header('=== STEP 4: FORCED OVERRIDES (generator.ts logic) ===')
let research = { ...afterStyle }

const btLower = research.buildingType.toLowerCase()
const promptLower = PROMPT.toLowerCase()

const isPeranakan = btLower.includes('peranakan') || btLower.includes('shophouse') ||
  btLower.includes('singapore') || promptLower.includes('peranakan') ||
  promptLower.includes('shophouse') || promptLower.includes('singapore')
const isVictorian = btLower.includes('victorian') || btLower.includes('police') ||
  promptLower.includes('victorian') || promptLower.includes('police station')
const isModernGlass = (btLower.includes('office') || btLower.includes('corporate') ||
  promptLower.includes('glass office')) && !isPeranakan && !isVictorian

log('isPeranakan:', isPeranakan)
log('isVictorian:', isVictorian)
log('isModernGlass:', isModernGlass)

const beforeOverride = { ...research }

if (isPeranakan) {
  research.exteriorColor = 'Sand yellow'
  research.roofColor = 'Dark green'
  research.hasColonnade = true
  research.architecturalStyle = 'peranakan chinese colonial'
  research.floorCount = 4
}
if (isVictorian && !isPeranakan) {
  if (research.exteriorColor === 'Light grey') research.exteriorColor = 'Reddish brown'
  research.exteriorMaterial = 'brick'
  if (research.floorCount < 2) research.floorCount = 2
  research.architecturalStyle = 'victorian brick classical'
}
if (isModernGlass) {
  research.hasGlassFront = true
}

// Apply floorCountHint from analysePrompt
if (intent.floorCountHint && intent.floorCountHint > 1) {
  log(`floorCountHint from analysePrompt: ${intent.floorCountHint} — but isPeranakan override already set floorCount=${research.floorCount}`)
  // In production: only applied if not already set by forced overrides
  // research.floorCount = intent.floorCountHint
}

subheader('Changes applied by forced overrides')
const overrideFields = Object.keys(beforeOverride) as (keyof ResearchResult)[]
let anyOverrideChanged = false
for (const field of overrideFields) {
  const before = (beforeOverride as unknown as Record<string, unknown>)[field]
  const after  = (research      as unknown as Record<string, unknown>)[field]
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    log(`  ${field}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`)
    anyOverrideChanged = true
  }
}
if (!anyOverrideChanged) log('  (no fields changed by forced overrides)')
log('Final ResearchResult going into compilation:')
log(research)

// ── STEP 5: PRE-GATE ─────────────────────────────────────────────────────────

header('=== STEP 5: PRE-GATE RESULT ===')
const gate = preGate(research)
log('passed:', gate.passed)
log('issues:', gate.issues.length === 0 ? '(none)' : gate.issues)
log('warnings:', gate.warnings.length === 0 ? '(none)' : gate.warnings)

if (!gate.passed) {
  log('⚠️  PRE-GATE FAILED — in production this would trigger a research retry')
}

// ── STEP 6: BLUEPRINT COMPILATION ────────────────────────────────────────────

header('=== STEP 6: BLUEPRINT COMPILATION ===')
log('Calling compileBlueprint with seed:', SEED, 'exteriorOnly: true (rooms excluded from analysis)')
const compiled = compileBlueprint(research, SEED)

const tw = compiled.totalWidth
const td = compiled.totalDepth
// floorCount used by buildExterior — clamped to max(3, min(10, r.floorCount))
const fcUsed = Math.max(3, Math.min(10, research.floorCount || 4))
const fhUsed = 12  // buildExterior hardcodes fh=12

log('')
log('Footprint: tw =', tw, ', td =', td)
log('floorCount going into buildExterior:', research.floorCount, '→ clamped to:', fcUsed)
log('floorHeight: hardcoded to', fhUsed, '(buildExterior ignores r.floorHeight)')
log('Total exterior parts:', compiled.exterior.length)
log('Room layout (', compiled.roomLayout.length, 'rooms):')
compiled.roomLayout.forEach((r, i) => {
  log(`  [${i}] ${r.name} (${r.type}) @ x=${r.x.toFixed(1)} z=${r.z.toFixed(1)} | ${r.width.toFixed(1)}w × ${r.depth.toFixed(1)}d`)
})

subheader('Exterior part breakdown by name prefix')
const categories: Record<string, number> = {}
for (const part of compiled.exterior) {
  // Categorize by first token of name
  const prefix = part.name.replace(/_?\d+.*$/, '').replace(/[LR]$/, '')
    .replace(/(Front|Back|Left|Right|Top|Bot|Cap|Base|Tip|Ridge|Slab).*$/, '')
    .trim()
  const cat = prefix.length > 2 ? prefix : 'Other'
  categories[cat] = (categories[cat] || 0) + 1
}
const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1])
sortedCats.forEach(([cat, count]) => log(`  ${count.toString().padStart(4)}x  ${cat}`))

// ── STEP 7: PART AUDIT ───────────────────────────────────────────────────────

header('=== STEP 7: PART AUDIT ===')
const allParts = compiled.exterior

subheader('Color distribution')
const colorCount: Record<string, number> = {}
for (const p of allParts) {
  colorCount[p.color || 'MISSING'] = (colorCount[p.color || 'MISSING'] || 0) + 1
}
Object.entries(colorCount).sort((a, b) => b[1] - a[1]).forEach(([color, count]) => {
  log(`  ${count.toString().padStart(4)}x  ${color}`)
})

subheader('Material distribution')
const matCount: Record<string, number> = {}
for (const p of allParts) {
  matCount[p.material || 'MISSING'] = (matCount[p.material || 'MISSING'] || 0) + 1
}
Object.entries(matCount).sort((a, b) => b[1] - a[1]).forEach(([mat, count]) => {
  log(`  ${count.toString().padStart(4)}x  ${mat}`)
})

subheader('Suspicious parts (size dimension < 0.5 or y position < 0)')
let suspicious = 0
for (const p of allParts) {
  const smallDim = [p.size.x, p.size.y, p.size.z].filter(v => v < 0.5)
  const negY = p.position.y < 0
  if (smallDim.length > 0 || negY) {
    log(`  SUSPICIOUS: "${p.name}" size=(${p.size.x},${p.size.y},${p.size.z}) pos=(${p.position.x},${p.position.y.toFixed(2)},${p.position.z})`)
    suspicious++
  }
}
if (suspicious === 0) log('  (none found)')

subheader('Emissive parts (PointLight)')
const emissiveParts = allParts.filter(p => p.emissive)
log(`  ${emissiveParts.length} emissive parts:`, emissiveParts.map(p => p.name).join(', ') || '(none)')

subheader('Part names containing "Window" or "Glass" or "Pag" or "Col"')
const windowParts = allParts.filter(p => /window|glass|wglass|wrec|wfr/i.test(p.name))
const pagodaParts = allParts.filter(p => /^pag/i.test(p.name))
const colParts    = allParts.filter(p => /^col/i.test(p.name))
log(`  Window/Glass parts: ${windowParts.length}`)
windowParts.slice(0, 20).forEach(p => log(`    ${p.name}`))
log(`  Pagoda parts: ${pagodaParts.length}`)
pagodaParts.slice(0, 10).forEach(p => log(`    ${p.name}`))
log(`  Colonnade parts: ${colParts.length}`)
colParts.slice(0, 10).forEach(p => log(`    ${p.name}`))

subheader('Windows by facade (Front/Back/Left/Right side wall)')
const faceCount: Record<string, number> = { Front: 0, Back: 0, Left: 0, Right: 0 }
for (const p of windowParts) {
  if (/_F\d/i.test(p.name)) {
    if (/Front|_F\d_/i.test(p.name) || p.position.z < 2) faceCount.Front++
    else if (/Back|_B\d/i.test(p.name) || p.position.z > td - 2) faceCount.Back++
    else if (/Left|SWL/i.test(p.name)) faceCount.Left++
    else if (/Right|SWR/i.test(p.name)) faceCount.Right++
  }
}
log('  Front wall windows:', faceCount.Front)
log('  Back wall windows:', faceCount.Back)
log('  Left wall windows:', faceCount.Left)
log('  Right wall windows:', faceCount.Right)

// ── STEP 8: QUALITY CHECK ────────────────────────────────────────────────────

header('=== STEP 8: QUALITY CHECK ===')
const quality = checkBuildingQuality(allParts, research, research.buildingType, compiled.roomLayout)
log('Overall score:', quality.percentage + '%')
log('')
log('Individual checks:')
for (const check of quality.checks) {
  const status = check.passed ? '✅' : '❌'
  log(`  ${status} [${check.score.toString().padStart(3)}] ${check.name}: ${check.note}${check.expected ? ` | expected: ${check.expected}` : ''}${check.found ? ` | found: ${check.found}` : ''}`)
}
log('')
log('Suggestions:')
if (quality.suggestions.length === 0) {
  log('  (none)')
} else {
  quality.suggestions.forEach(s => log('  • ' + s))
}

// ── STEP 9: FINAL XML STATS ──────────────────────────────────────────────────

header('=== STEP 9: FINAL XML STATS ===')
const model: RbxModel = { name: 'Trace_Shophouse', parts: allParts, scripts: [] }
const xml = buildRbxmx([model])
const xmlFinal = watermarkRbxmx(xml, 'trace-001', 'trace-user')

const xmlLines = xmlFinal.split('\n')
const partTagCount = (xmlFinal.match(/<Item class="Part"/g) || []).length
const partNameRegex = /<string name="Name">([^<]+)<\/string>/g
const partNameMatches: string[][] = []
let partNameMatch: RegExpExecArray | null
while ((partNameMatch = partNameRegex.exec(xmlFinal)) !== null) {
  partNameMatches.push([partNameMatch[0], partNameMatch[1]])
}
const _partNameStrings = partNameMatches.map(m => m[1])

// Extract names more cleanly: Part items have Name immediately after class="Part"
const partBlockRegex = /<Item class="Part"[^>]*>[\s\S]*?<string name="Name">([^<]+)<\/string>/g
const partBlocks: string[][] = []
let partBlockMatch: RegExpExecArray | null
while ((partBlockMatch = partBlockRegex.exec(xmlFinal)) !== null) {
  partBlocks.push([partBlockMatch[0], partBlockMatch[1]])
}
const partNames = partBlocks.map(m => m[1])

log('Total XML length:', xmlFinal.length, 'chars')
log('Total XML lines:', xmlLines.length)
log('Total <Item class="Part"> count:', partTagCount)
log('XML starts with <?xml:', xmlFinal.startsWith('<?xml') ? 'YES' : 'NO ← PROBLEM')
log('XML ends with </roblox>:', xmlFinal.trimEnd().endsWith('</roblox>') ? 'YES' : 'NO ← PROBLEM')
log('Contains NaN:', xmlFinal.includes('NaN') ? 'YES ← PROBLEM' : 'NO')
log('Contains Infinity:', xmlFinal.includes('Infinity') ? 'YES ← PROBLEM' : 'NO')
log('Contains XML comments (<!--):', xmlFinal.includes('<!--') ? 'YES ← PROBLEM' : 'NO')
log('Contains SurfaceAppearance:', xmlFinal.includes('SurfaceAppearance') ? 'YES' : 'NO')

subheader('First 10 Part names in XML')
partNames.slice(0, 10).forEach((n, i) => log(`  [${i + 1}] ${n}`))

subheader('Last 10 Part names in XML')
partNames.slice(-10).forEach((n, i) => log(`  [${partNames.length - 10 + i + 1}] ${n}`))

subheader('First 15 lines of XML')
xmlLines.slice(0, 15).forEach((l, i) => log(`  ${i + 1}: ${l}`))

// ── Write outputs ─────────────────────────────────────────────────────────────

const outDir = path.join(__dirname)
fs.writeFileSync(path.join(outDir, 'trace-output.txt'), lines.join('\n'), 'utf-8')
fs.writeFileSync(path.join(outDir, 'trace-output.rbxmx'), xmlFinal, 'utf-8')
log('')
log('Wrote scripts/trace-output.txt')
log('Wrote scripts/trace-output.rbxmx')
log('TRACE COMPLETE.')
