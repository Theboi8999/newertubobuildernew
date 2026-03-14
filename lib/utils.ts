export const SYSTEMS = {
  builder: { id: 'builder', label: 'Builder System', tagline: 'Environments & Structures', icon: '🏗️', color: '#7C3AED', colorLight: '#A78BFA' },
  modeling: { id: 'modeling', label: 'Modeling & Asset System', tagline: 'Vehicles, Tools & Scripts', icon: '🚗', color: '#06B6D4', colorLight: '#67E8F9' },
  project: { id: 'project', label: 'Project System', tagline: 'Maps & Themed Packs', icon: '🗺️', color: '#10B981', colorLight: '#6EE7B7' },
} as const

export type SystemType = keyof typeof SYSTEMS

export const STYLES = ['Modern', 'Victorian', 'Brutalist', 'Industrial', 'Art Deco', 'Futuristic', 'Rural / Countryside', 'Derelict / Abandoned']
export const SIZES = [
  { label: 'Small', desc: 'Quick builds, fewer parts', multiplier: 1 },
  { label: 'Medium', desc: 'Balanced detail', multiplier: 1.5 },
  { label: 'Large', desc: 'High detail, more parts', multiplier: 2 },
  { label: 'Massive', desc: 'Maximum detail, complex builds', multiplier: 3 },
]

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function qualityColor(score: number) {
  if (score >= 80) return 'text-brand-green'
  if (score >= 60) return 'text-brand-orange'
  return 'text-brand-red'
}

export function qualityLabel(score: number) {
  if (score >= 90) return 'Prestige'
  if (score >= 80) return 'High Quality'
  if (score >= 65) return 'Good'
  if (score >= 50) return 'Average'
  return 'Low'
}
