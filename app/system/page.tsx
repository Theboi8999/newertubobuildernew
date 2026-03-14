'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

const TEMPLATES = {
  builder: [
    { label: '🏛️ Police Station', prompt: 'A fully furnished UK police station with reception desk, holding cells, briefing room, locker room, CID office, evidence storage, and a vehicle garage bay' },
    { label: '🚒 Fire Station', prompt: 'A UK fire station with two engine bays, crew quarters with beds and lockers, briefing room, watch room, pole, kitchen, and outdoor drill yard' },
    { label: '🏥 Hospital A&E', prompt: 'A hospital accident and emergency department with triage, waiting area, resus bays, treatment rooms, nurses station, and ambulance bay' },
    { label: '🏦 Bank', prompt: 'A high street bank with public counter area with bulletproof glass, vault room, manager office, staff room, and ATM lobby' },
    { label: '🏪 Corner Shop', prompt: 'A convenience store with shelving aisles, refrigerated section, checkout counter, stockroom, and staff toilet' },
    { label: '🏫 School', prompt: 'A secondary school with classrooms, science lab, headteacher office, reception, canteen, gym hall, and outdoor playground' },
    { label: '🏨 Hotel Lobby', prompt: 'A luxury hotel lobby with front desk, seating area, lifts, concierge desk, bar area, and grand staircase' },
    { label: '🚔 Custody Suite', prompt: 'A police custody suite with booking desk, fingerprinting area, 8 holding cells with toilets, interview rooms, charging desk, and solicitor room' },
  ],
  modeling: [
    { label: '🚗 Police BMW 5 Series', prompt: 'A German Polizei BMW 5 Series patrol car with silver/green livery, federal eagle badge, full ELS light bar, siren, interior with prisoner screen, working doors' },
    { label: '🚑 Ambulance', prompt: 'A UK NHS ambulance with yellow/green Battenburg livery, ELS lights, rear patient compartment with stretcher and equipment, paramedic cab' },
    { label: '🚒 Fire Engine', prompt: 'A UK fire engine with red livery, ELS, aerial ladder, hose reels, side compartments with equipment, crew cab seating 4' },
    { label: '🔫 M4A1 Rifle', prompt: 'An M4A1 assault rifle with EoTech holographic sight, 30-round magazine, RIS handguard, collapsible stock, muzzle flash, fireable with damage and recoil' },
    { label: '🚁 Police Helicopter', prompt: 'A police helicopter with blue/yellow livery, searchlight, belly camera, ELS strobes, working rotors, copilot seat with camera lock-on UI' },
    { label: '⛓️ Handcuffs', prompt: 'Handcuffs tool that detain players (freeze movement), allow searching their inventory, and release them, with server-side validation and visual cuff model' },
    { label: '🚤 Police RIB', prompt: 'A police rigid inflatable boat with chequered livery, ELS, twin outboard engines, 4 seats, working throttle and steering' },
    { label: '🔌 Taser', prompt: 'A police taser that fires probes at a target, temporarily stuns them with ragdoll animation, with reload and safety toggle' },
  ],
  project: [
    { label: '🌆 UK City RP Map', prompt: 'A full UK city roleplay map with police station, fire station, hospital, town hall, shops, residential streets, park, car park, and motorway junction' },
    { label: '🇩🇪 German Police Pack', prompt: 'A complete German Bundespolizei themed pack including BMW 5 Series patrol car, Audi A6 unmarked, police helicopter, officer uniform, handcuffs, and pistol' },
    { label: '🏖️ Coastal Town', prompt: 'A coastal roleplay town with harbour, beach, seafront shops, hotel, lifeboat station, fish and chip shop, arcades, and car park' },
    { label: '🏙️ City Block', prompt: 'A dense city block with 6 varied buildings including apartments, office, cafe, newsagent, and underground car park, with streets and alleyways' },
    { label: '🚨 Emergency Services Pack', prompt: 'A full emergency services pack with police station, fire station, ambulance station, and one vehicle each all matching theme' },
    { label: '🏫 School Campus', prompt: 'A full school campus map with main building, sports hall, playing fields, car park, and staff rooms ready for school roleplay' },
  ],
}

const WIZARD_STEPS = {
  builder: [
    { id: 'buildingType', label: 'Building Type', options: ['Police Station','Fire Station','Hospital','School','Bank','Shop / Store','Hotel','Office Building','Residential House','Government Building','Prison / Custody Suite','Military Base'], allowOther: true, multi: false },
    { id: 'country', label: 'Country / Style', options: ['UK','USA','Germany','Australia','France','Generic / Modern'], allowOther: true, multi: false },
    { id: 'size', label: 'Size', options: ['Small','Medium','Large','Massive'], allowOther: false, multi: false },
    { id: 'rooms', label: 'Must-Have Rooms', options: ['Reception','Cells / Custody','Briefing Room','Locker Room','Garage Bay','Evidence Storage','Kitchen','Toilets','Office Area'], allowOther: true, multi: true },
    { id: 'extras', label: 'Extras', options: ['Fully furnished interior','Working doors','Exterior surroundings','Night lighting','Security cameras','Signage'], allowOther: true, multi: true },
  ],
  modeling: [
    { id: 'assetType', label: 'Asset Type', options: ['Police Car','Fire Engine','Ambulance','Helicopter','Motorbike','Van / Truck','Boat','Firearm','Melee Weapon','Tool / Equipment','Uniform / Clothing'], allowOther: true, multi: false },
    { id: 'country', label: 'Country / Service', options: ['UK','USA','Germany','Australia','France','Generic'], allowOther: true, multi: false },
    { id: 'features', label: 'Features', options: ['ELS Lights','Siren','Working Doors','Interior','Prisoner Screen','Script / Functional','Damage System','Animations'], allowOther: true, multi: true },
    { id: 'extras', label: 'Extras', options: ['Realistic livery','Number plates','Window tint','Custom sound IDs','Multiple livery variants'], allowOther: true, multi: true },
  ],
  project: [
    { id: 'projectType', label: 'Project Type', options: ['Full City / Town Map','Themed Pack','Single District','Campus / Complex','Island Map','Industrial Area'], allowOther: true, multi: false },
    { id: 'theme', label: 'Theme / Setting', options: ['UK Emergency Services','German Police','US Law Enforcement','Australian Services','Military','Civilian Roleplay'], allowOther: true, multi: false },
    { id: 'includes', label: 'What to Include', options: ['Police Station','Fire Station','Hospital','Vehicles','Weapons & Tools','Uniforms','Roads & Streets','Shops & Businesses','Residential Area'], allowOther: true, multi: true },
    { id: 'scale', label: 'Scale', options: ['Small','Medium','Large','Massive'], allowOther: false, multi: false },
  ],
}

function WizardStep({ step, value, onChange }: {
  step: { id: string; label: string; options: string[]; allowOther: boolean; multi: boolean }
  value: string | string[]
  onChange: (val: string | string[]) => void
}) {
  const [otherText, setOtherText] = useState('')
  const [showOther, setShowOther] = useState(false)
  const isMulti = step.multi

  function toggle(opt: string) {
    if (isMulti) {
      const arr = value as string[]
      onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt])
    } else {
      onChange(opt === value ? '' : opt)
    }
  }

  function commitOther() {
    if (!otherText.trim()) return
    if (isMulti) {
      const arr = value as string[]
      if (!arr.includes(otherText.trim())) onChange([...arr, otherText.trim()])
    } else {
      onChange(otherText.trim())
    }
    setOtherText('')
    setShowOther(false)
  }

  const isSelected = (opt: string) => isMulti ? (value as string[]).includes(opt) : value === opt

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-brand-text-muted uppercase tracking-wider mb-3">{step.label}</p>
      <div className="flex flex-wrap gap-2">
        {step.options.map(opt => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg t
