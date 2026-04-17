// lib/research.ts
// Hardcoded building reference knowledge — used when Groq research API is not available.
// The generator also calls the ai_knowledge table via getKnowledgeForPrompt() for
// any additional facts that have been added through the admin research panel.

export interface ResearchResult {
  query: string
  references: string[]
  summary: string
}

const BUILDING_KNOWLEDGE: Record<string, string> = {
  fire_station: `UK Fire Station Layout Reference:
- Appliance bay: 2-3 bays, each 7m wide x 15m deep x 5m tall, large roller shutter doors
- Watch room: small office at front, overlooks station yard, radio equipment, call logging
- Dormitory: 6-8 single beds with lockers, upstairs or rear ground floor
- Kitchen/mess room: large table seats 8, full kitchen, sofas, TV, notice boards
- Gym room: treadmills, weights
- Gear room/drying room: connects directly to appliance bay, bunker gear hanging on pegs
- BA (breathing apparatus) room: testing equipment, air cylinders
- Station office: admin desk, filing cabinets
- Exterior: red brick, large white roller doors, flagpole, drill yard at rear
- Typical UK fire station footprint: 30m x 20m`,

  police_station: `UK Police Station Layout Reference:
- Public reception: enquiry desk with reinforced screen, waiting area with chairs, CCTV monitors
- Custody suite: booking desk, fingerprint station, 6-10 cells (each 3m x 2m), cell corridor
- Cells: steel door with viewing hatch, bench/bed, toilet, intercom
- CID office: open plan desks with computers, evidence board, printer
- Briefing room: rows of chairs facing whiteboard/screen
- Interview rooms: small, one table two chairs per side, recording equipment
- Locker room: officers personal lockers, shower room
- Armoury: secure cage, firearm storage
- Custody officer desk: raised desk overlooking cell area
- Car park: marked bays, ANPR camera
- Exterior: blue lamp above entrance, force crest signage`,

  hospital: `Hospital/Medical Centre Layout Reference:
- Reception/triage: reception desk, waiting chairs, triage booth, hand sanitiser stations
- A&E bays: cubicles with curtains, each with bed, monitoring equipment, crash cart nearby
- Resus room: large central table, defibrillator, crash trolley, overhead lights
- Doctors office: desk, examination table, filing cabinets
- Nurses station: central hub, medication trolleys, computers
- Patient ward: rows of beds with curtains, IV stands, lockers
- Operating theatre: central table, overhead surgical lights, instrument trays
- Pharmacy: medication dispensing counter, shelving
- Staff room: sofas, lockers, coffee machine, notice board`,

  school: `School Layout Reference:
- Classrooms: rows of desks facing whiteboard, teachers desk at front, 20-30 student capacity
- Corridors: wide hallways with lockers on walls, notice boards
- Assembly hall/gym: large open space, stage at one end, basketball markings on floor
- Canteen: rows of tables, serving counter, kitchen behind
- Library: bookshelves, reading tables, computers
- Science lab: benches with sinks, safety equipment, fume cupboards
- Staffroom: sofas, desks, coffee machine, notice boards
- Toilets: multiple cubicles, sinks`,

  garage: `Auto Garage/Workshop Reference:
- Workshop floor: vehicle lifts (2-post or 4-post), oil drains in floor, tyre changing area
- Reception desk: parts counter, computer, waiting area with chairs
- Parts storage: shelving units, parts bins
- Office: manager desk, filing cabinets, phone
- MOT bay: separate area with pit or ramp, MOT testing equipment
- Tyre storage: rack of tyres
- Tools: toolboxes on wheels, air compressor, diagnostic equipment
- Exterior: forecourt, pump area if petrol station, signage`,

  ambulance_station: `Ambulance Station Layout Reference:
- Vehicle bay: 2-4 bays for ambulances, wide roller doors, floor markings
- Equipment storage: shelves for stretchers, oxygen, first aid supplies
- Crew room: sofas, TV, kitchen, lockers
- Office: duty manager desk, radios, dispatch equipment
- Clean/dirty utility rooms: for restocking and cleaning equipment
- Exterior: yellow/green livery consistent with UK ambulance service`,
}

export async function researchTopic(prompt: string, systemType: string): Promise<ResearchResult> {
  const p = prompt.toLowerCase()
  let knowledge = ''

  // Match known building types
  if (p.includes('fire') && (p.includes('station') || p.includes('house'))) {
    knowledge = BUILDING_KNOWLEDGE.fire_station
  } else if (p.includes('police') || p.includes('constabulary')) {
    knowledge = BUILDING_KNOWLEDGE.police_station
  } else if (p.includes('hospital') || p.includes('medical') || p.includes('clinic')) {
    knowledge = BUILDING_KNOWLEDGE.hospital
  } else if (p.includes('school') || p.includes('college') || p.includes('academy')) {
    knowledge = BUILDING_KNOWLEDGE.school
  } else if (p.includes('garage') || p.includes('workshop') || p.includes('mechanic')) {
    knowledge = BUILDING_KNOWLEDGE.garage
  } else if (p.includes('ambulance')) {
    knowledge = BUILDING_KNOWLEDGE.ambulance_station
  }

  return {
    query: prompt,
    references: knowledge ? [knowledge] : [],
    summary: knowledge,
  }
}
