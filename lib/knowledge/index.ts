export const BUILDING_KB = `
BUILDING STANDARDS — VETERAN LEVEL:
Doors: 4 studs wide x 8 tall. Double doors: 8 wide. Door frames: 0.5 stud border.
Ceilings: 10-12 studs ground floor, 8-10 upper floors. Walls: 1 stud thick exterior, 0.5 interior.
Windows: 4w x 5h, 2 studs from floor, Glass material 0.3 transparency. 5-part frame.
Floors: SmoothPlastic or Concrete, 1 stud thick. Skirting board: 0.5h x 0.2d along walls.

POLICE STATION: Reception counter (8w x 1h x 3d, SmoothPlastic) with bulletproof glass partition (transparent Glass 0.3).
Holding cells: 8 studs wide x 10 deep, Steel bars every 0.5 studs (thin Metal cylinders 0.2 diameter).
Cell door: sliding Metal bars. Toilet and sink inside each cell. Panic button on wall.
Briefing room: rows of 3-person benches facing whiteboard (10w x 8h white Part on wall).
Locker room: individual lockers (1w x 2h x 0.8d) in rows, benches in front, mirror on wall.
CID office: open plan, individual desks (2x0.8x1.2) with monitors (0.1 thick dark screen Part).
Evidence storage: floor-to-ceiling shelving units with labelled boxes.
Sally port / garage bay: 16w x 12h roller door, drainage channel on floor.
Custody desk: raised platform, fingerprint scanner, property storage behind.

FIRE STATION: Engine bays 18w x 20d x 14h, smooth Concrete floor with drainage.
Sliding brass pole between floors (cylinder 0.3 diameter, Neon gold colour).
Crew quarters: individual cubicles with bed (4x1x2), locker, personal space.
Watch room: overlooking engine bay through large windows, radio desk, whiteboard.
Kitchen: counter (L-shape), hob, sink, fridge (1x2x1 white), table with chairs.
Drill yard: marked bays, training tower (3 floors), hydrant point.

HOSPITAL: Triage desk with computer monitors and waiting number system.
Resus bay: curtained off, crash trolley (0.6x1x0.2 with drawers), defibrillator on wall.
Treatment bays: curtain rail (thin rod at ceiling), examination bed, equipment trolley.
Nurses station: horseshoe shaped desk, multiple monitors, drug cabinet (locked, metal).
Ambulance bay: raised kerb, undercover roof, double doors to A&E corridor.
Corridors: wide enough for stretchers (8 studs), handrails both sides, vinyl floor.

MATERIALS BY CONTEXT:
Exterior walls: Brick (emergency services), Concrete (modern/industrial), SmoothPlastic (commercial).
Interior floors: SmoothPlastic (offices), Concrete (garages), Wood (residential).
Windows: Glass 0.3 transparency. Night lighting: Neon colour panels behind frosted Glass.
Roofs: SmoothPlastic dark grey, slight overhang (2 studs). Flat roofs have parapet wall (2h).
`

export const VEHICLE_KB = `
VEHICLE STANDARDS — VETERAN LEVEL:
Car body minimum 15 parts. Main body: 12x4x6. Hood separate: 5x0.5x4. Roof: 8x1x4.
Wheels: 3 parts — tyre (Cylinder 2.4x2.4x0.6 black, rotated 90deg Z), hub (Cylinder 1.8x1.8x0.4 grey), wheel nut centre.
Windshield: Wedge part, Glass 0.15-0.2 transparency. Rear window: similar angle.
Side mirrors: small box (0.4x0.3x0.1) on arms (0.05x0.3x0.05).
Door handles: thin box (0.8x0.1x0.05) on each door.
Number plates front and rear: (1.2x0.3x0.05) white SmoothPlastic with SurfaceGui text.
Interior: seats (2x1x1.5 per seat), steering wheel (torus or thin cylinder), dashboard.

POLICE LIVERY:
German Polizei: body silver, green stripe from front wheel arch to rear, "POLIZEI" SurfaceGui on doors. Federal eagle badge decal. Blue/silver ELS.
UK Police: white body, blue/yellow Battenburg (alternating squares 1x1 stud) on lower doors and boot. "POLICE" in blue on doors. Blue ELS.
NSW Police: blue/white horizontal split. "POLICE" white on blue. Red/blue ELS.
US Police: black and white or all white depending on department. Red/blue ELS.

ELS SYSTEM: Light bar Parts on roof named ELS_Red_1, ELS_Blue_1, ELS_Amber_1 etc. Material Neon.
Script toggles transparency between 0 (on) and 1 (off) alternating red/blue at 0.1 second intervals.
Siren: Sound object in VehicleSeat, toggle with Q key via LocalScript + RemoteEvent.

HELICOPTER: Main rotor 20 studs diameter (4 blades, Neon tip). Tail rotor 6 studs. Skids 16 apart.
Searchlight: SpotLight under belly, toggleable. Belly camera mount (cosmetic).
Copilot UI: ScreenGui showing locked target name, camera feed frame, spotlight toggle button.

FIRE ENGINE: Aerial ladder: sections extend via TweenService CFrame animation.
Side compartments: doors open via HingeConstraint. Hose reel at rear.
Water hose tool: ParticleEmitter when activated, extinguishes Fire instances in range.

WEAPONS:
Firearms: 3D model from separate parts (receiver, barrel, stock, magazine, sight).
Firing: LocalScript detects input, RemoteEvent to server, Raycast from camera for hit detection.
Damage: Humanoid:TakeDamage(). Headshot (upper body) x2 multiplier.
Visual: BillboardGui health bar, muzzle flash (short-lived Neon part at barrel tip).
Handcuffs: Activate fires RemoteEvent, server checks range (10 studs), sets target WalkSpeed=0 JumpHeight=0, adds visual weld.
`

export const SCRIPTING_KB = `
LUAU STANDARDS — VETERAN PATTERNS:
Always use task.wait() not wait(). task.spawn() not spawn(). task.delay() not delay().
RemoteEvents in ReplicatedStorage, created on server, fired from client, handled on server.
ModuleScripts for shared state (ELS state, vehicle config, game settings).
Never trust client for damage, money, or game state. Always validate server-side.
Use pcall() for all DataStore operations. Use :FindFirstChild() with null checks.

ELS MODULE PATTERN:
local ELS = {}
local lights = { Red = {}, Blue = {}, Amber = {} }
local active = false
function ELS.toggle(vehicle) active = not active
  if active then
    task.spawn(function()
      while active do
        for _, p in lights.Red do p.Transparency = 0 end
        for _, p in lights.Blue do p.Transparency = 1 end
        task.wait(0.1)
        for _, p in lights.Red do p.Transparency = 1 end
        for _, p in lights.Blue do p.Transparency = 0 end
        task.wait(0.1)
      end
    end)
  else
    for _, p in lights.Red do p.Transparency = 1 end
    for _, p in lights.Blue do p.Transparency = 1 end
  end
end
return ELS

HANDCUFF PATTERN:
Server: RemoteEvent.OnServerEvent:Connect(function(officer, target)
  local hum = target:FindFirstChild("Humanoid")
  if hum and (target.HumanoidRootPart.Position - officer.HumanoidRootPart.Position).Magnitude < 10 then
    hum.WalkSpeed = 0; hum.JumpHeight = 0
    -- weld hands
  end
end)

DOOR SYSTEM: ProximityPrompt on door, server toggles CFrame rotation via TweenService.
ELEVATOR: Multiple floors, BindableEvent between floors, door open/close TweenService.
DATASTORE: wrap in pcall, retry up to 3 times, use UpdateAsync not SetAsync.
`

export const MAP_KB = `
MAP & PROJECT STANDARDS:
City blocks: 100x100 stud plots, 10 stud roads between. Main roads 20 studs, side streets 12.
Road materials: Concrete. Road markings: thin (0.1h) white/yellow Neon or SmoothPlastic parts.
Buildings vary 2-6 floors for skyline depth. Setback from road: 4-8 studs.
Trees: cylinder trunk (Brown Wood 1x8x1) + sphere canopy (Forest Green SmoothPlastic 6x6x6). Clusters of 3-5.
Street furniture every 20 studs: lamp post (cylinder 0.5x12x0.5 metal + light point), bench (4x0.8x1.5), bin (0.8x1.2x0.8).
Curbs: 0.5h x 0.5w raised edge along all roads, light grey Concrete.
Pavements: 3 studs wide each side, SmoothPlastic slightly lighter than road.
Night: windows glow (Neon yellow/warm white behind Glass), street lights active, neon signs.

THEMED PACKS: All vehicles same base livery. Buildings share colour palette (UK: blue/yellow; German: silver/green).
Generate each asset as separate Model in the same rbxmx file, labelled clearly.
Include SpawnLocation (green 6x1x6 SmoothPlastic with decal) at logical entry point.
`

export function getKnowledge(prompt: string, systemType: string, style?: string, size?: string): string {
  const p = prompt.toLowerCase()
  const parts: string[] = [SCRIPTING_KB]

  if (systemType === 'builder' || p.match(/station|building|shop|hospital|school|bank|house|room|interior|hotel|custody|prison|office/))
    parts.push(BUILDING_KB)

  if (systemType === 'modeling' || p.match(/car|vehicle|helicopter|truck|van|boat|ship|gun|rifle|weapon|handcuff|taser|tool|ambulance|engine/))
    parts.push(VEHICLE_KB)

  if (systemType === 'project' || p.match(/map|city|town|world|pack|district|campus|street/)) {
    parts.push(MAP_KB)
    if (!parts.includes(BUILDING_KB)) parts.push(BUILDING_KB)
    if (!parts.includes(VEHICLE_KB)) parts.push(VEHICLE_KB)
  }

  let ctx = parts.join('\n\n')
  if (style) ctx += `\n\nSTYLE DIRECTION: Generate in ${style} architectural/design style. Apply this throughout all materials, proportions, and aesthetic details.`
  if (size) {
    const partCounts: Record<string, string> = {
      Small: 'minimum 15 parts, focused detail',
      Medium: 'minimum 25 parts, good detail',
      Large: 'minimum 40 parts, high detail with extras',
      Massive: 'minimum 60 parts, maximum detail, full surroundings',
    }
    ctx += `\n\nSIZE: ${size} — ${partCounts[size] || 'appropriate detail level'}.`
  }
  return ctx
}
