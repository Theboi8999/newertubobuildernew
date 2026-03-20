import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SYSTEMS = {
  builder: {
    id: 'builder',
    label: 'Builder System',
    tagline: 'Environments & Structures',
    description: 'Generate complete Roblox environments — police stations, fire stations, shops, monuments, parks, and full interiors. Ready-to-import .rbxmx files.',
    icon: '🏗️',
    color: '#6C3AED',
    colorLight: '#9B6DFF',
    examples: ['Police station with full interior', 'Downtown shopping district', 'Fire station with garage bays', 'City park with benches and trees'],
    badge: 'BUILDER',
  },
  modeling: {
    id: 'modeling',
    label: 'Modeling & Asset System',
    tagline: 'Scripted Tools & Vehicles',
    description: 'Create fully scripted tools and vehicles — guns, handcuffs, cars, helicopters — with working ELS lighting, sirens, custom liveries, and special functions.',
    icon: '🚗',
    color: '#00D4FF',
    colorLight: '#66E5FF',
    examples: ['Police car with ELS and prisoner transport', 'Fire engine with hose system', 'Helicopter with working rotors', 'Tactical gear set with animations'],
    badge: 'MODELING',
  },
  project: {
    id: 'project',
    label: 'Project System',
    tagline: 'Maps & Themed Packs',
    description: 'Describe a full roleplay world — the AI builds the entire thing. Or request themed packs: vehicles, uniforms, and gear delivered together.',
    icon: '🗺️',
    color: '#00FF88',
    colorLight: '#66FFB2',
    examples: ['Berlin city roleplay map', 'German Federal Police pack', 'UK Emergency Services map', 'Los Angeles roleplay world'],
    badge: 'PROJECT',
  },
} as const

export type SystemType = keyof typeof SYSTEMS

export function qualityColor(score: number): string {
  if (score >= 90) return 'text-green-400'
  if (score >= 75) return 'text-yellow-400'
  if (score >= 60) return 'text-orange-400'
  return 'text-red-400'
}

export function qualityLabel(score: number): string {
  if (score >= 90) return 'Prestige'
  if (score >= 75) return 'High'
  if (score >= 60) return 'Medium'
  return 'Low'
}

export const STYLES = ['Modern', 'Victorian', 'Industrial', 'Brutalist', 'Colonial', 'Derelict', 'Coastal', 'Scandi']

export const SIZES = ['Small', 'Medium', 'Large', 'Massive']
