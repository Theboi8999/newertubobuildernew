// Test script: npx tsx scripts/test-lua-gen.ts
// Set GROQ_API_KEY in your shell before running:
//   $env:GROQ_API_KEY="gsk_..."  (PowerShell)
// Verifies generateProceduralLua() produces valid Lua for a simple building.

async function main() {
  const { generateProceduralLua } = await import('../lib/lua-generator')

  const spec = {
    buildingType: 'modern_house',
    description: 'A clean two-storey contemporary house with large windows and a flat roof',
    architecturalStyle: 'modern contemporary',
    floors: 2,
    width: 30,
    depth: 20,
    floorHeight: 10,
    exteriorColor: 'Institutional white',
    roofColor: 'Dark grey',
    exteriorMaterial: 'SmoothPlastic',
  }

  console.log('Generating procedural Lua for:', spec.buildingType)
  console.log('---')

  const lua = await generateProceduralLua('modern_house', spec)

  console.log('--- OUTPUT ---')
  console.log(lua)
  console.log('--- STATS ---')
  console.log('Total length:', lua.length, 'chars')
  console.log('makePart calls:', (lua.match(/makePart\(/g) || []).length)
  console.log('Has terrain align:', lua.includes('PivotTo'))
}

main().catch(console.error)
