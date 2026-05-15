import * as fs from 'fs'
import * as path from 'path'
import { compileBlueprint } from '../lib/blueprint-compiler'
import { buildRbxmx, RbxModel } from '../lib/rbxmx'
import { watermarkRbxmx } from '../lib/output-validator'
import type { ResearchResult } from '../lib/research-agent'

const mockResearch: ResearchResult = {
  buildingType: 'singapore_shophouse',
  floorCount: 3,
  floorHeight: 10,
  architecturalStyle: 'peranakan chinese colonial',
  hasGlassFront: false,
  hasColonnade: true,
  exteriorMaterial: 'smoothplastic',
  exteriorColor: 'Sand yellow',
  roofColor: 'Dark green',
  totalWidth: 40,
  totalDepth: 28,
  culturalNotes: '',
  confidence: 90,
  rooms: [
    { name: 'Reception', width: 14, depth: 10, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
    { name: 'Office',    width: 14, depth: 12, height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
    { name: 'Storage',  width: 10, depth: 8,  height: 10, furniture: [], wallColor: 'Light grey', floorColor: 'Medium stone grey', floorMaterial: 'concrete' },
  ],
}

console.log('[debug] Compiling blueprint...')
const compiled = compileBlueprint(mockResearch, 42)
const allParts = compiled.exterior

console.log('[debug] Building rbxmx...')
const model: RbxModel = { name: 'Test', parts: allParts, scripts: [] }
const xml = buildRbxmx([model])
const xmlFinal = watermarkRbxmx(xml, 'debug-gen-001', 'debug-user')

const outDir = path.join(__dirname)
const rbxmxPath = path.join(outDir, 'debug-output.rbxmx')
const reportPath = path.join(outDir, 'debug-report.txt')

fs.writeFileSync(rbxmxPath, xmlFinal, 'utf-8')
console.log('[debug] Wrote', rbxmxPath)

// ── Build debug report ─────────────────────────────────────────────────────
const lines = xmlFinal.split('\n')
const report: string[] = []

report.push(`=== DEBUG REPORT ===`)
report.push(`Generated: ${new Date().toISOString()}`)
report.push(`Total parts in compiled blueprint: ${allParts.length}`)
report.push(`XML total length: ${xmlFinal.length} chars`)
report.push(`XML total lines: ${lines.length}`)
report.push('')

// 1. Parts with empty/undefined name
report.push('--- Parts with empty or undefined name ---')
const emptyNames = allParts.filter(p => !p.name || p.name.trim() === '')
if (emptyNames.length === 0) {
  report.push('  NONE')
} else {
  emptyNames.forEach((p, i) => report.push(`  [${i}] name="${p.name}" pos=${JSON.stringify(p.position)}`))
}
report.push('')

// 2. Parts with bad size values
report.push('--- Parts with bad size (NaN, Infinity, <=0) ---')
const badSize = allParts.filter(p =>
  [p.size.x, p.size.y, p.size.z].some(v => isNaN(v) || !isFinite(v) || v <= 0)
)
if (badSize.length === 0) {
  report.push('  NONE')
} else {
  badSize.forEach(p => report.push(`  name="${p.name}" size=${JSON.stringify(p.size)}`))
}
report.push('')

// 3. Parts with bad position values
report.push('--- Parts with bad position (NaN, Infinity) ---')
const badPos = allParts.filter(p =>
  [p.position.x, p.position.y, p.position.z].some(v => isNaN(v) || !isFinite(v))
)
if (badPos.length === 0) {
  report.push('  NONE')
} else {
  badPos.forEach(p => report.push(`  name="${p.name}" pos=${JSON.stringify(p.position)}`))
}
report.push('')

// 4. All unique size/position values that are suspicious
report.push('--- All distinct NaN/Infinity values in parts ---')
let nanFound = false
for (const p of allParts) {
  const vals = [p.size.x, p.size.y, p.size.z, p.position.x, p.position.y, p.position.z]
  for (const v of vals) {
    if (isNaN(v) || !isFinite(v)) {
      report.push(`  name="${p.name}" → ${v}`)
      nanFound = true
    }
  }
}
if (!nanFound) report.push('  NONE')
report.push('')

// 5. First 50 lines of XML
report.push('--- First 50 lines of XML ---')
lines.slice(0, 50).forEach((l, i) => report.push(`  ${i + 1}: ${l}`))
report.push('')

// 6. Last 20 lines of XML
report.push('--- Last 20 lines of XML ---')
lines.slice(-20).forEach((l, i) => report.push(`  ${lines.length - 20 + i + 1}: ${l}`))
report.push('')

// 7. Lines containing NaN or Infinity
report.push('--- Lines containing "NaN" or "Infinity" ---')
const nanLines = lines
  .map((l, i) => ({ n: i + 1, l }))
  .filter(({ l }) => l.includes('NaN') || l.includes('Infinity'))
if (nanLines.length === 0) {
  report.push('  NONE')
} else {
  nanLines.forEach(({ n, l }) => report.push(`  line ${n}: ${l.trim()}`))
}
report.push('')

// 8. Malformed XML: unmatched < or >
report.push('--- Lines with potential unmatched angle brackets ---')
const malformed: string[] = []
for (let i = 0; i < lines.length; i++) {
  const l = lines[i]
  // Skip XML declarations and processing instructions
  if (l.trim().startsWith('<?') || l.trim().startsWith('<!--')) continue
  // Count raw < and > outside of quotes — simplified heuristic
  const opens = (l.match(/</g) || []).length
  const closes = (l.match(/>/g) || []).length
  if (opens !== closes) {
    malformed.push(`  line ${i + 1} (open=${opens} close=${closes}): ${l.trim().substring(0, 100)}`)
  }
}
if (malformed.length === 0) {
  report.push('  NONE')
} else {
  malformed.slice(0, 20).forEach(m => report.push(m))
  if (malformed.length > 20) report.push(`  ... and ${malformed.length - 20} more`)
}
report.push('')

// 9. XML structural checks
report.push('--- XML structural checks ---')
report.push(`  Starts with <?xml: ${xmlFinal.startsWith('<?xml') ? 'YES' : 'NO ← PROBLEM'}`)
report.push(`  Contains <roblox: ${xmlFinal.includes('<roblox') ? 'YES' : 'NO ← PROBLEM'}`)
report.push(`  Ends with </roblox>: ${xmlFinal.trimEnd().endsWith('</roblox>') ? 'YES' : 'NO ← PROBLEM'}`)
report.push(`  Contains NaN: ${xmlFinal.includes('NaN') ? 'YES ← PROBLEM' : 'NO'}`)
report.push(`  Contains Infinity: ${xmlFinal.includes('Infinity') ? 'YES ← PROBLEM' : 'NO'}`)
const partTagCount = (xmlFinal.match(/<Item class="Part"/g) || []).length
report.push(`  Part tag count in XML: ${partTagCount}`)
report.push('')

// 10. Show part list summary
report.push('--- Part list (name | size | position) ---')
allParts.slice(0, 50).forEach(p => {
  report.push(`  "${p.name}" | size(${p.size.x.toFixed(2)},${p.size.y.toFixed(2)},${p.size.z.toFixed(2)}) | pos(${p.position.x.toFixed(2)},${p.position.y.toFixed(2)},${p.position.z.toFixed(2)})`)
})
if (allParts.length > 50) report.push(`  ... and ${allParts.length - 50} more parts`)
report.push('')

fs.writeFileSync(reportPath, report.join('\n'), 'utf-8')
console.log('[debug] Wrote', reportPath)
console.log('[debug] DONE. Check scripts/debug-report.txt for diagnosis.')
