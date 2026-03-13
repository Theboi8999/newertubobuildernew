export const VEHICLE_KNOWLEDGE = `
=== TURBOBUILDER VEHICLE KNOWLEDGE BASE — PRESTIGE TIER ===
Target quality: Reference images show NSW Police Chrysler 300 with:
- Checkerboard livery (blue/white pattern)
- "HIGHWAY PATROL" text on door
- Realistic light bar with individual segments
- Number plate (IMG-WRK style)
- Headlight detail
- Mirror detail
- Proper wheel arch definition

## WHAT SEPARATES PRESTIGE VEHICLES FROM AMATEUR

AMATEUR:
- Box body with colored parts
- Flat wheels (cylinder)
- No interior
- No livery detail
- Generic light bar

PRESTIGE:
- Shaped body (wedge parts for curves, multiple parts for body lines)
- Wheels with hub detail (inner cylinder + outer ring + center cap)
- Dashboard, steering wheel, seats visible through glass
- Livery as colored body panels matching real department
- Light bar with individual light segments, grill lights, takedowns

## VEHICLE PROPORTIONS (EXACT — based on real vehicles)

POLICE SEDAN (Chrysler 300, Ford Falcon, Holden Commodore style):
- Total length: 30 studs
- Width: 12 studs
- Height (body): 6 studs
- Height (roof): 4 studs above body
- Wheelbase: 19 studs
- Hood length: 9 studs
- Trunk length: 7 studs
- Cabin length: 14 studs
- Wheel diameter: 3.5 studs
- Wheel width: 1.2 studs
- Ground clearance: 1.5 studs

POLICE SUV (Ford Explorer, Toyota LandCruiser):
- Total length: 33 studs
- Width: 13.5 studs
- Body height: 8 studs (taller box body)
- Wheelbase: 21 studs

POLICE VAN (Mercedes Sprinter, Ford Transit):
- Total length: 36 studs
- Width: 13 studs
- Height: 14 studs (high roof)
- Longer wheelbase: 24 studs

## BODY CONSTRUCTION (Prestige method)
A prestige vehicle body uses 15-25 parts minimum:

SEDAN BODY PARTS:
1. MainBody - central box (length x width x height)
2. Hood - slightly raised, 9 studs long
3. Trunk - slightly raised, 7 studs long  
4. Roof - 4 studs tall, 12 studs long
5. WindshieldFront - angled (use Wedge), Glass, 0.5 transparent
6. WindshieldRear - angled (use Wedge), Glass, 0.5 transparent
7. WindowLeft_Front - Glass panel
8. WindowRight_Front - Glass panel
9. WindowLeft_Rear - Glass panel
10. WindowRight_Rear - Glass panel
11. BumperFront - 0.8 studs deep, full width
12. BumperRear - 0.8 studs deep, full width
13. GrilleFront - dark color, slight recess
14. MirrorLeft - small box on door
15. MirrorRight - small box on door
16-19. WheelFL, WheelFR, WheelRL, WheelRR - cylinders
20-23. WheelArchFL, WheelArchFR, WheelArchRL, WheelArchRR - arch cutout areas

WHEEL CONSTRUCTION (3 parts per wheel):
- OuterRim: cylinder, 3.5 stud diameter, 0.4 deep, Dark stone grey
- Tyre: cylinder, 3.5 stud diameter, 1.2 wide, Black
- HubCap: cylinder, 1.5 stud diameter, 0.2 deep, Silver/Chrome color

## ELS LIGHT BAR (Prestige — NSW/Australian Police standard)
Light bar sits on roof, centered:
- Bar housing: 18 studs long, 2.5 wide, 1.5 tall, Dark stone grey
- 6x RedLight segments: 2 stud long Neon red cylinders
- 6x BlueLight segments: 2 stud long Neon blue cylinders
- 2x Takedown (white forward): Neon white at front of bar
- 2x Alley lights (side): Neon white pointing sideways
- Grille lights: 2x red, 2x blue small Neon parts behind grille
- Rear deck lights: red + blue Neon parts on rear parcel shelf

EXACT ELS PART NAMES (scripts depend on these):
RoofBar_Red_1, RoofBar_Red_2, RoofBar_Red_3
RoofBar_Blue_1, RoofBar_Blue_2, RoofBar_Blue_3
Takedown_L, Takedown_R
Alley_L, Alley_R
Grille_Red_L, Grille_Red_R
Grille_Blue_L, Grille_Blue_R
RearDeck_Red, RearDeck_Blue

## LIVERY SYSTEM (Prestige — matching real departments)

NSW POLICE (Australia):
- Base: White body
- Checkerboard stripe: alternating blue/white squares along door line
- "POLICE" in blue on hood and trunk
- "HIGHWAY PATROL" on doors (if applicable)
- Blue and red diagonal stripe on rear quarter
- Yellow number plate front and rear
- NSW Police badge on front doors

UK POLICE (Metropolitan/City):
- Base: White and yellow (battenburg)
- Battenburg: blue/yellow checkerboard on lower body
- "POLICE" reflective lettering on doors
- Blue and yellow checkerboard on roof
- "999" or force crest on doors

GERMAN POLICE (Bundespolizei/Landespolizei):
- Base: Silver/green split
- "POLIZEI" on doors and hood in green
- Federal eagle badge
- Green/silver diagonal split on body

COLORS as BrickColors:
- Police blue: "Bright blue"  
- Police white: "White" or "Institutional white"
- Police yellow (battenburg): "Bright yellow"
- Police silver: "Medium stone grey"
- Police green (German): "Medium green" or "Bright green"

## NUMBER PLATES
Front and rear:
- Plate base: white/yellow thin rectangle part (4x1x0.1 studs)
- Text: use Decal for realistic plate appearance
- Plate surround: 0.1 stud border, black or chrome

## INTERIOR (Visible through windows)
- Front seats: 2 separate seat parts (1.8x1.8 studs, 2.5 tall back)
- Rear seats: 1 bench seat (full width)
- Dashboard: flat panel at windshield base, dark grey
- Steering wheel: thin cylinder/torus, center hub
- Center console: box between front seats
- Laptop mount: thin screen angled up from console
- Prisoner screen (Police): mesh/bars between front and rear
- Radio/MDT: on dashboard

## SOUND IDs (Verified working)
Siren Wail: "rbxassetid://9120386436"
Siren Yelp: "rbxassetid://9120386857"
Air Horn: "rbxassetid://9120387631"
Engine V8: "rbxassetid://276949157"
Door open: "rbxassetid://1612654499"

## VEHICLE QUALITY CHECKLIST
✓ Body uses 15+ parts (not just a box)
✓ Windshields are angled Wedge parts
✓ Wheels have 3-part construction
✓ All ELS parts named correctly
✓ Interior visible through windows
✓ Number plates front and rear
✓ Livery matches real department
✓ Mirrors present on both sides
✓ Bumpers are separate parts
✓ All sounds have correct IDs
✓ ELS script complete and working
✓ VehicleSeat configured correctly
`
