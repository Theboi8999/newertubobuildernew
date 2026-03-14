export const MAP_KNOWLEDGE = `
=== TURBOBUILDER MAP KNOWLEDGE BASE — PRESTIGE TIER ===
Target quality: Reference images show Sydney CBD, coastal Caribbean town, 
London Palace exterior at night, UK city at night.
Key features: depth, layering, organic layout, night atmosphere, landmarks.

## WHAT SEPARATES PRESTIGE MAPS FROM AMATEUR

AMATEUR:
- Flat terrain, grid roads
- Box buildings identical height
- No street furniture
- No vegetation
- Flat lighting

PRESTIGE:
- Terrain variation (gentle hills, waterfront levels)
- Buildings varied height and style
- Full street furniture set on every block
- Organic tree clusters
- Dramatic night lighting: glowing windows, street lamps casting pools of light
- Construction details (cranes, scaffolding add depth)
- Waterfront elements where applicable

## MAP LAYOUT PRINCIPLES

### City Grid vs Organic
- Grid cities: perfectly aligned blocks (American style) — use 120x120 stud blocks
- Organic cities: slightly irregular (European/UK style) — vary block size 80-150 studs
- Coastal: buildings face water, roads curve to follow coastline

### Depth & Layering (Critical for prestige look)
Create 3 depth layers:
1. FOREGROUND: Immediate street level — road markings, bollards, bus stops, pedestrians props
2. MIDGROUND: Buildings 3-8 floors, trees, parked vehicles
3. BACKGROUND: Tall towers 10-20+ floors (can be simpler — seen from far)

### Building Height Variation (Essential)
Never same height buildings next to each other:
- Row house: 12-15 studs
- Shop: 15-20 studs
- Medium office: 30-50 studs
- Tower: 80-150 studs
- Mix these in every block

## ROADS — PRESTIGE STANDARD

Road surface: Dark stone grey, 0.5 studs thick
Marking system (all 0.1 stud tall):
- Center line: White dashed (4 on, 4 off, repeat)
- Lane markings: White dashed
- Stop line: solid White, 1 stud wide, full road width
- Crosswalk: 8x alternating White stripes, 2 studs wide each
- Give way: dashed white line + triangle markings
- Yellow box junction: grid of Yellow Neon or SmoothPlastic, 0.1 tall
- Arrows: directional decals at intersections
- Speed numbers: painted on road as decals
- UK: double yellow lines along curb edges

Road hierarchy:
- Main arterial: 24-28 studs wide (4 lanes + median)
- Secondary: 16-20 studs (2-3 lanes)
- Side streets: 10-12 studs (1 lane each direction)
- Lane width: 5-6 studs each

Curb: 0.5 tall x 0.5 wide, Light stone grey, runs full road length
Pavement: 6-8 studs wide each side, Light stone grey or Cobblestone

## STREET FURNITURE SET (Every block needs these)

ESSENTIAL per block:
- 2-4x Street lamp posts (14-16 studs tall, ornate or modern)
  - Ornate (UK/European): fluted pole, lantern top
  - Modern (city): straight pole, flat rectangular head
  - SpotLight component: Brightness 3, Range 40, facing down
- 2-4x Bollards (black or yellow, 0.5 cylinder x 2 studs)
- 1-2x Benches (slatted wood, metal legs, 4 studs long)
- 1-2x Bins/litter bins (cylinder or box, 1.5 studs tall)
- 4-8x Trees (organic clusters, varied heights)
- Street signs at intersections

OPTIONAL but adds quality:
- Bus shelter (3 glass walls + roof, bench inside, timetable board)
- Bike rack (metal frame)
- Newspaper stand
- ATM machine
- Parking meter
- Fire hydrant (short red/yellow cylinder with cap)
- Phone box (UK: red box)
- Post box (UK: red cylinder)
- Outdoor café seating (tables + chairs on pavement)
- Flower beds (low box with colored parts)
- Raised planters

## NIGHT ATMOSPHERE (Critical for prestige)
As seen in reference images:

GLOWING WINDOWS:
- Every building: Neon white/warm yellow parts behind windows
- Transparency: 0.2-0.4 (bright glow effect)
- Not every window lit — alternate on/off for realism (70% lit)
- Color: warm white (255, 240, 200) for offices, cooler (200, 220, 255) for fluorescent

STREET LIGHTS:
- Pools of light on road surface below each lamp
- Use SpotLight on lamp head: Brightness 3, Range 40, Angle 60
- Warm color: RGB 255, 200, 120 (sodium vapor) OR cool white (modern LED)

BUILDING UPLIGHTING:
- PointLight at base of landmark buildings pointing up
- Color: cool white or architectural color

TRAFFIC LIGHTS:
- Neon colored circles (Red, Yellow/Amber, Green)
- 3-section housing box on pole

CONSTRUCTION CRANE (adds depth, as seen in reference):
- Vertical mast: Metal, Dark stone grey, 60-80 studs tall
- Horizontal jib: extends 30-40 studs
- Counterweight arm: extends 15 studs other direction
- Yellow/black color
- Warning lights: Neon red at top

## LANDMARK SPECIFICATIONS

WATERFRONT (as seen in coastal reference):
- Sea/water: Terrain water or large flat blue part at Y=0
- Retaining wall: Cobblestone or Stone, 3-4 studs tall
- Jetty/dock: wooden planks extending 20-30 studs over water
- Beach: Sand terrain or flat Sandy yellow parts
- Palm trees along waterfront (lean slightly toward water)
- Outdoor terrace seating on waterfront buildings
- Flags: thin tall poles with colored flat parts

ROYAL/GOVERNMENT GATES (as seen in palace reference):
- Iron railings: thin black vertical bars every 1.5 studs, 8 studs tall
- Gate sections: wider bars + decorative top (spike or ornate finial)
- Gate posts: 2x2 stud pillars, 10 studs tall, stone colored
- Gate mechanism: hinges visible, central opening
- Yellow box junction in front of gate entrance
- Bollards flanking entrance

## THEMED PACK COORDINATION

All items in a pack MUST share:
- Identical color scheme (e.g. all NSW Police = white + blue + red)
- Same livery pattern on all vehicles
- Matching badge/crest on all items
- Coordinated naming (all start with department name)

EXAMPLE — NSW POLICE PACK:
✓ Chrysler 300 Highway Patrol (white, checkerboard)
✓ Toyota LandCruiser General Duties (white, blue stripe)  
✓ Ford Ranger 4WD (white, blue stripe)
✓ Police Helicopter (white, blue stripe, "POLICE" on belly)
✓ Uniform: white shirt, dark trousers, broad brimmed hat
✓ Equipment: handcuffs, radio, taser, OC spray, baton
All items: white/blue livery, NSW Police badge, consistent

## MAP QUALITY CHECKLIST
✓ 3 depth layers (foreground/mid/background)
✓ Building heights varied (never uniform)
✓ Full street furniture on every block
✓ Trees in organic clusters, not lines
✓ Road markings complete (lines, crosswalks, stop lines)
✓ Night atmosphere: glowing windows + street light pools
✓ At least 1 landmark (tower, waterfront, gate, monument)
✓ Terrain variation (not perfectly flat)
✓ Districts clearly defined
✓ Construction details for depth (crane, scaffolding)
✓ 100+ parts minimum
`
