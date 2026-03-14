// lib/knowledge/index.ts — Smart knowledge loader

import { BUILDING_KNOWLEDGE } from './building'
import { VEHICLE_KNOWLEDGE } from './vehicles'
import { MAP_KNOWLEDGE } from './maps'
import { SCRIPTING_KNOWLEDGE } from './scripting'

export function getKnowledgeContext(prompt: string, systemType: string): string {
  const p = prompt.toLowerCase()
  const sections: string[] = []

  sections.push(SCRIPTING_KNOWLEDGE)

  if (systemType === 'builder' || p.includes('station') || p.includes('building') || p.includes('house') || p.includes('interior') || p.includes('room') || p.includes('shop') || p.includes('hospital') || p.includes('school') || p.includes('bank')) {
    sections.push(BUILDING_KNOWLEDGE)
  }

  if (systemType === 'modeling' || p.includes('car') || p.includes('vehicle') || p.includes('helicopter') || p.includes('truck') || p.includes('van') || p.includes('bike') || p.includes('boat') || p.includes('ship') || p.includes('gun') || p.includes('rifle') || p.includes('handcuff') || p.includes('taser')) {
    sections.push(VEHICLE_KNOWLEDGE)
  }

  if (systemType === 'project' || p.includes('map') || p.includes('city') || p.includes('town') || p.includes('world') || p.includes('district') || p.includes('pack')) {
    sections.push(MAP_KNOWLEDGE)
    sections.push(BUILDING_KNOWLEDGE)
    sections.push(VEHICLE_KNOWLEDGE)
  }

  return sections.join('\n\n')
}
