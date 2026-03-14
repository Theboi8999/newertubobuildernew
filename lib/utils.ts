import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export const SYSTEMS = {
  builder: {
    id: 'builder',
    label: 'Builder System',
    tagline: 'Environments & Structures',
    icon: '🏗️',
    color: '#7C3AED',
    colorLight: '#A78BFA',
  },
  modeling: {
    id: 'modeling',
    label: 'Modeling & Asset System',
    tagline: 'Vehicles, Tools & Scripts',
    icon: '🚗',
    color: '#06B6D4',
    colorLight: '#67E8F9',
  },
  project: {
    id: 'project',
    label: 'Project System',
    tagline: 'Maps & Themed Packs',
    icon: '🗺️',
    color: '#10B981',
    colorLight: '#6EE7B7',
  },
} as const
