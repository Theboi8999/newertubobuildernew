// Veteran-level Luau scripting knowledge base
export const SCRIPTING_KNOWLEDGE = `
=== TURBOBUILDER LUAU SCRIPTING KNOWLEDGE BASE ===
Source: Roblox DevForum, veteran scripter patterns, community standards

## GOLDEN RULES OF PROFESSIONAL LUAU SCRIPTING

### Script Architecture
- NEVER put game logic in LocalScripts that should be server-authoritative
- Use RemoteEvents for client→server communication
- Use RemoteFunction only when you need a return value
- Always use ModuleScripts for shared code
- Server Scripts go in ServerScriptService or inside parts (as Script)
- LocalScripts go in StarterPlayerScripts, StarterCharacterScripts, or LocalPlayer
- Never use wait() — always use task.wait() (it's more accurate)
- Never use spawn() — always use task.spawn()
- Never use delay() — always use task.delay()

### Performance Best Practices
- Disconnect events when no longer needed: local conn = event:Connect(fn); conn:Disconnect()
- Use RunService.Heartbeat for physics-related loops
- Use RunService.RenderStepped only for visual updates (LocalScript only)
- Cache frequently accessed instances: local part = workspace.Part
- Avoid FindFirstChild in tight loops — cache references
- Use CollectionService for tagging and finding groups of objects
- Debounce all player interactions to prevent spam

### ELS (Emergency Lighting System) — VETERAN STANDARD
\`\`\`lua
-- Professional ELS Script (goes in vehicle Model as Script)
local vehicle = script.Parent
local lightParts = {}
local sirenSounds = {}
local elsActive = false
local sirenMode = 0 -- 0=off, 1=wail, 2=yelp, 3=priority

-- Cache all light parts
for _, part in pairs(vehicle:GetDescendants()) do
    if part:IsA("BasePart") and part.Name:find("Light") then
        table.insert(lightParts, part)
    end
    if part:IsA("Sound") then
        sirenSounds[part.Name] = part
    end
end

-- Flash pattern for emergency lights
local flashPatterns = {
    primary = {0.1, 0.1, 0.1, 0.3},   -- red
    secondary = {0.1, 0.1, 0.1, 0.3},  -- blue
    alternating = true
}

local function flashLights()
    local tick = 0
    while elsActive do
        tick = tick + 1
        for i, part in pairs(lightParts) do
            if part.Name:find("Red") then
                part.Material = (tick % 2 == 0) and Enum.Material.Neon or Enum.Material.SmoothPlastic
            elseif part.Name:find("Blue") then
                part.Material = (tick % 2 == 1) and Enum.Material.Neon or Enum.Material.SmoothPlastic
            end
        end
        task.wait(0.15)
    end
    -- Turn off all lights
    for _, part in pairs(lightParts) do
        part.Material = Enum.Material.SmoothPlastic
    end
end

-- Siren patterns
local sirenPatterns = {
    wail = function()
        if sirenSounds.Wail then sirenSounds.Wail:Play() end
    end,
    yelp = function()
        if sirenSounds.Yelp then sirenSounds.Yelp:Play() end
    end,
}

-- Remote event handler
local remotes = vehicle:FindFirstChild("Remotes")
if not remotes then
    remotes = Instance.new("Folder")
    remotes.Name = "Remotes"
    remotes.Parent = vehicle
end

local toggleELS = Instance.new("RemoteEvent")
toggleELS.Name = "ToggleELS"
toggleELS.Parent = remotes

local cycleSiren = Instance.new("RemoteEvent")
cycleSiren.Name = "CycleSiren"
cycleSiren.Parent = remotes

toggleELS.OnServerEvent:Connect(function(player)
    -- Only driver can control ELS
    local seat = vehicle:FindFirstChildWhichIsA("VehicleSeat")
    if seat and seat.Occupant and seat.Occupant.Parent == player.Character then
        elsActive = not elsActive
        if elsActive then
            task.spawn(flashLights)
        end
    end
end)

cycleSiren.OnServerEvent:Connect(function(player)
    local seat = vehicle:FindFirstChildWhichIsA("VehicleSeat")
    if seat and seat.Occupant and seat.Occupant.Parent == player.Character then
        sirenMode = (sirenMode % 3) + 1
        for _, sound in pairs(sirenSounds) do sound:Stop() end
        if sirenMode == 1 and sirenSounds.Wail then sirenSounds.Wail:Play()
        elseif sirenMode == 2 and sirenSounds.Yelp then sirenSounds.Yelp:Play()
        elseif sirenMode == 3 and sirenSounds.Priority then sirenSounds.Priority:Play()
        end
    end
end)
\`\`\`

### Vehicle Seat Script (LocalScript in StarterCharacterScripts)
\`\`\`lua
-- Keybind handler for ELS/Siren
local UIS = game:GetService("UserInputService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local function getVehicle()
    local char = player.Character
    if not char then return nil end
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if not hrp then return nil end
    -- Find nearest vehicle seat
    for _, seat in pairs(workspace:GetDescendants()) do
        if seat:IsA("VehicleSeat") and seat.Occupant and seat.Occupant.Parent == char then
            return seat.Parent
        end
    end
    return nil
end

UIS.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    local vehicle = getVehicle()
    if not vehicle then return end
    local remotes = vehicle:FindFirstChild("Remotes")
    if not remotes then return end
    
    if input.KeyCode == Enum.KeyCode.Q then
        remotes.ToggleELS:FireServer()
    elseif input.KeyCode == Enum.KeyCode.E then
        remotes.CycleSiren:FireServer()
    end
end)
\`\`\`

### Tool Script Template (Professional)
\`\`\`lua
-- Professional Tool Script template
local tool = script.Parent
local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local debounce = false
local COOLDOWN = 1.5

tool.Activated:Connect(function()
    if debounce then return end
    debounce = true
    
    -- Tool action here
    local animation = Instance.new("Animation")
    animation.AnimationId = "rbxassetid://YOUR_ANIMATION_ID"
    local track = humanoid:LoadAnimation(animation)
    track:Play()
    
    -- Fire server for authoritative action
    tool.RemoteEvent:FireServer()
    
    task.wait(COOLDOWN)
    debounce = false
end)

tool.Equipped:Connect(function()
    -- Setup when equipped
end)

tool.Unequipped:Connect(function()
    -- Cleanup when unequipped
    debounce = false
end)
\`\`\`

### Handcuff Tool Script
\`\`\`lua
-- Handcuff tool - professional implementation
local tool = script.Parent
local RANGE = 8
local debounce = false

local function getNearestPlayer(origin)
    local nearest, dist = nil, RANGE
    for _, player in pairs(game.Players:GetPlayers()) do
        if player.Character then
            local hrp = player.Character:FindFirstChild("HumanoidRootPart")
            if hrp then
                local d = (hrp.Position - origin).Magnitude
                if d < dist then
                    nearest = player
                    dist = d
                end
            end
        end
    end
    return nearest
end

tool.Activated:Connect(function()
    if debounce then return end
    debounce = true
    local char = tool.Parent
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if hrp then
        local target = getNearestPlayer(hrp.Position)
        if target then
            tool.CuffRemote:FireServer(target)
        end
    end
    task.wait(2)
    debounce = false
end)
\`\`\`

## PROFESSIONAL NAMING CONVENTIONS
- Models: PascalCase (PoliceStation, FireEngine, PatrolCar)
- Parts: descriptive names (FrontBumper, LeftDoor, RoofLight_Red)
- Scripts: descriptive (ELSController, SirenHandler, DoorScript)
- RemoteEvents: verb+noun (ToggleELS, CuffPlayer, OpenDoor)
- Variables: camelCase (local playerName, local vehicleSeat)
- Constants: UPPER_SNAKE_CASE (local MAX_SPEED = 150)
`

// ── ADVANCED WEAPON & CAMERA SYSTEMS ──────────────────────────────────────

export const ADVANCED_SCRIPTING_KNOWLEDGE = `
=== ADVANCED SCRIPTING — MISSILE SYSTEMS, CAMERA, TARGETING ===

## BIRDS-EYE CAMERA SYSTEM (Complete pattern)

-- LocalScript inside tool:
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera
local mouse = player:GetMouse()

local CAMERA_HEIGHT = 150      -- studs above ground
local CAMERA_SPEED = 0.5       -- how fast crosshair moves
local MISSILE_COOLDOWN = 8     -- seconds between launches
local BLAST_RADIUS = 20        -- explosion damage radius
local BLAST_DAMAGE = 100       -- damage at epicentre

local isActive = false
local targetPosition = Vector3.new(0, 0, 0)
local lastFire = 0

local fireEvent = ReplicatedStorage:WaitForChild("FireMissile")

-- Crosshair GUI
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "MissileTargetingHUD"
screenGui.ResetOnSpawn = false
screenGui.Parent = player.PlayerGui

local frame = Instance.new("Frame")
frame.Size = UDim2.new(1, 0, 1, 0)
frame.BackgroundTransparency = 1
frame.Visible = false
frame.Parent = screenGui

-- Crosshair
local crosshair = Instance.new("ImageLabel")
crosshair.Size = UDim2.new(0, 60, 0, 60)
crosshair.AnchorPoint = Vector2.new(0.5, 0.5)
crosshair.Position = UDim2.new(0.5, 0, 0.5, 0)
crosshair.BackgroundTransparency = 1
crosshair.Image = "rbxassetid://6031094678"  -- crosshair image
crosshair.ImageColor3 = Color3.fromRGB(255, 50, 50)
crosshair.Parent = frame

-- Targeting box (shows area of effect)
local blastCircle = Instance.new("Frame")
blastCircle.Size = UDim2.new(0, 120, 0, 120)
blastCircle.AnchorPoint = Vector2.new(0.5, 0.5)
blastCircle.Position = UDim2.new(0.5, 0, 0.5, 0)
blastCircle.BackgroundTransparency = 1
blastCircle.BorderSizePixel = 2
blastCircle.BorderColor3 = Color3.fromRGB(255, 100, 0)
local uiCorner = Instance.new("UICorner")
uiCorner.CornerRadius = UDim.new(1, 0)
uiCorner.Parent = blastCircle
blastCircle.Parent = frame

-- Cooldown label
local cooldownLabel = Instance.new("TextLabel")
cooldownLabel.Size = UDim2.new(0, 200, 0, 30)
cooldownLabel.AnchorPoint = Vector2.new(0.5, 1)
cooldownLabel.Position = UDim2.new(0.5, 0, 0.9, 0)
cooldownLabel.BackgroundTransparency = 1
cooldownLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
cooldownLabel.Font = Enum.Font.GothamBold
cooldownLabel.TextSize = 16
cooldownLabel.Text = "READY TO FIRE"
cooldownLabel.Parent = frame

-- Vignette overlay for birds-eye mode
local vignette = Instance.new("Frame")
vignette.Size = UDim2.new(1, 0, 1, 0)
vignette.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
vignette.BackgroundTransparency = 0.6
vignette.BorderSizePixel = 0
vignette.Parent = frame

local vignetteGradient = Instance.new("UIGradient")
vignetteGradient.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 1),
    NumberSequenceKeypoint.new(0.4, 0),
    NumberSequenceKeypoint.new(0.6, 0),
    NumberSequenceKeypoint.new(1, 0.8),
})
vignetteGradient.Parent = vignette

local crosshairPos = Vector2.new(0.5, 0.5)  -- normalised 0-1

function activateBirdsEye()
    isActive = true
    frame.Visible = true
    camera.CameraType = Enum.CameraType.Scriptable
    
    local char = player.Character
    if char and char:FindFirstChild("HumanoidRootPart") then
        local rootPos = char.HumanoidRootPart.Position
        camera.CFrame = CFrame.new(
            Vector3.new(rootPos.X, rootPos.Y + CAMERA_HEIGHT, rootPos.Z),
            Vector3.new(rootPos.X, rootPos.Y, rootPos.Z)
        )
        targetPosition = rootPos
    end
end

function deactivateBirdsEye()
    isActive = false
    frame.Visible = false
    camera.CameraType = Enum.CameraType.Custom
    crosshairPos = Vector2.new(0.5, 0.5)
    crosshair.Position = UDim2.new(0.5, 0, 0.5, 0)
    blastCircle.Position = UDim2.new(0.5, 0, 0.5, 0)
end

-- Move crosshair with mouse while in birds-eye
RunService.RenderStepped:Connect(function(dt)
    if not isActive then return end
    
    -- Pan camera with mouse at edges
    local mousePos = UserInputService:GetMouseLocation()
    local viewportSize = camera.ViewportSize
    local edgeBuffer = 80
    
    local panX, panZ = 0, 0
    if mousePos.X < edgeBuffer then panX = -CAMERA_SPEED end
    if mousePos.X > viewportSize.X - edgeBuffer then panX = CAMERA_SPEED end
    if mousePos.Y < edgeBuffer then panZ = -CAMERA_SPEED end
    if mousePos.Y > viewportSize.Y - edgeBuffer then panZ = CAMERA_SPEED end
    
    if panX ~= 0 or panZ ~= 0 then
        camera.CFrame = camera.CFrame * CFrame.new(panX, 0, panZ)
    end
    
    -- Move crosshair to mouse position
    crosshair.Position = UDim2.new(0, mousePos.X, 0, mousePos.Y)
    blastCircle.Position = UDim2.new(0, mousePos.X, 0, mousePos.Y)
    
    -- Update cooldown display
    local remaining = MISSILE_COOLDOWN - (tick() - lastFire)
    if remaining > 0 then
        cooldownLabel.Text = string.format("RELOAD: %.1fs", remaining)
        cooldownLabel.TextColor3 = Color3.fromRGB(255, 100, 0)
    else
        cooldownLabel.Text = "🎯 READY TO FIRE — CLICK"
        cooldownLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    end
end)

-- Fire on click
mouse.Button1Down:Connect(function()
    if not isActive then return end
    if tick() - lastFire < MISSILE_COOLDOWN then return end
    lastFire = tick()
    
    -- Raycast from camera through crosshair to world
    local mousePos = UserInputService:GetMouseLocation()
    local ray = camera:ViewportPointToRay(mousePos.X, mousePos.Y)
    local raycastResult = workspace:Raycast(
        ray.Origin, 
        ray.Direction * 500,
        RaycastParams.new()
    )
    
    if raycastResult then
        targetPosition = raycastResult.Position
        fireEvent:FireServer(targetPosition)
        
        -- Visual feedback
        crosshair.ImageColor3 = Color3.fromRGB(255, 0, 0)
        task.delay(0.3, function()
            crosshair.ImageColor3 = Color3.fromRGB(255, 50, 50)
        end)
    end
end)

-- Toggle with Q or tool activation
UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.Q then
        if isActive then deactivateBirdsEye() else activateBirdsEye() end
    end
    if input.KeyCode == Enum.KeyCode.Escape and isActive then
        deactivateBirdsEye()
    end
end)

-- Tool equipped/unequipped
script.Parent.Equipped:Connect(activateBirdsEye)
script.Parent.Unequipped:Connect(deactivateBirdsEye)


## SERVER SCRIPT — MISSILE FLIGHT & EXPLOSION

-- Script in ServerScriptService:
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

local fireEvent = Instance.new("RemoteEvent")
fireEvent.Name = "FireMissile"
fireEvent.Parent = ReplicatedStorage

local MISSILE_SPEED = 3         -- seconds to reach target
local BLAST_RADIUS = 20
local BLAST_DAMAGE = 100
local MIN_DAMAGE = 10           -- damage at edge of blast

fireEvent.OnServerEvent:Connect(function(player, targetPosition)
    -- Validate target is reasonable distance
    local char = player.Character
    if not char then return end
    
    local launchPos = char.HumanoidRootPart.Position + Vector3.new(0, 5, 0)
    
    -- Create missile part
    local missile = Instance.new("Part")
    missile.Name = "Missile"
    missile.Size = Vector3.new(0.5, 0.5, 3)
    missile.Color = Color3.fromRGB(80, 80, 80)
    missile.Material = Enum.Material.Metal
    missile.CastShadow = false
    missile.CanCollide = false
    missile.Anchored = false
    missile.CFrame = CFrame.new(launchPos, targetPosition)
    missile.Parent = workspace
    
    -- Smoke trail
    local smoke = Instance.new("Smoke")
    smoke.Color = Color3.fromRGB(200, 200, 200)
    smoke.Opacity = 0.5
    smoke.RiseVelocity = 2
    smoke.Size = 1
    smoke.Parent = missile
    
    -- Fire trail
    local fire = Instance.new("Fire")
    fire.Color = Color3.fromRGB(255, 100, 0)
    fire.SecondaryColor = Color3.fromRGB(255, 200, 0)
    fire.Size = 2
    fire.Heat = 9
    fire.Parent = missile
    
    -- BodyVelocity to fly toward target
    local bv = Instance.new("BodyVelocity")
    local direction = (targetPosition - launchPos).Unit
    bv.Velocity = direction * (targetPosition - launchPos).Magnitude / MISSILE_SPEED
    bv.MaxForce = Vector3.new(1e6, 1e6, 1e6)
    bv.Parent = missile
    
    -- Orient missile toward target
    missile.CFrame = CFrame.new(launchPos, targetPosition)
    
    -- Explode after MISSILE_SPEED seconds
    task.delay(MISSILE_SPEED, function()
        if not missile or not missile.Parent then return end
        
        -- Explosion effect
        local explosion = Instance.new("Explosion")
        explosion.Position = targetPosition
        explosion.BlastRadius = BLAST_RADIUS
        explosion.BlastPressure = 500000
        explosion.DestroyJointRadiusPercent = 0
        explosion.ExplosionType = Enum.ExplosionType.NoCraters
        explosion.Parent = workspace
        
        -- Custom damage (more control than default explosion)
        for _, obj in ipairs(workspace:GetDescendants()) do
            if obj:IsA("Humanoid") and obj.Health > 0 then
                local rootPart = obj.Parent:FindFirstChild("HumanoidRootPart")
                if rootPart then
                    local dist = (rootPart.Position - targetPosition).Magnitude
                    if dist <= BLAST_RADIUS then
                        -- Falloff: full damage at centre, min at edge
                        local falloff = 1 - (dist / BLAST_RADIUS)
                        local damage = MIN_DAMAGE + ((BLAST_DAMAGE - MIN_DAMAGE) * falloff)
                        
                        -- Don't damage the player who fired (optional)
                        local hitPlayer = game:GetService("Players"):GetPlayerFromCharacter(obj.Parent)
                        if hitPlayer ~= player then
                            obj:TakeDamage(damage)
                        end
                    end
                end
            end
        end
        
        -- Clean up missile
        missile:Destroy()
    end)
    
    Debris:AddItem(missile, MISSILE_SPEED + 1)
end)


## KEY RULES FOR MISSILE/CAMERA SYSTEMS
- ALWAYS put camera control in LocalScript (client-side only)
- ALWAYS put damage/explosion on server Script (anti-exploit)
- Use RemoteEvent to bridge client → server
- Validate on server: check player exists, char exists, distance reasonable
- BodyVelocity for missile movement (not Tween — needs physics)
- Explosion part: use ExplosionType.NoCraters to avoid map damage
- DestroyJointRadiusPercent = 0 prevents ragdoll/part destruction
- Use task.delay not wait() for all timing
- Debris:AddItem for cleanup — never leave missile parts in workspace
- Birds-eye camera: always restore CameraType.Custom on deactivate
- Always check tick() cooldown on both client AND server
`

export const WEAPON_SCRIPTING_KNOWLEDGE = `
=== WEAPON SCRIPTING — RIFLES, DAMAGE, ANIMATIONS ===

## M4A1 / ASSAULT RIFLE — COMPLETE PATTERN

-- Tool structure in Explorer:
-- Tool
--   Handle (the grip part, where player holds)
--   Barrel
--   Stock  
--   Magazine
--   EotechSight
--   FireSound
--   ReloadSound
--   GunScript (LocalScript)
--   DamageScript (Script — server)
--   RemoteEvents folder

-- LocalScript (GunScript):
local tool = script.Parent
local player = game:GetService("Players").LocalPlayer
local camera = workspace.CurrentCamera
local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Config
local DAMAGE = 35
local FIRE_RATE = 0.1          -- seconds between shots (600rpm)
local RANGE = 500              -- max stud range
local SPREAD = 0.02            -- bullet spread (0 = perfect accuracy)
local MAGAZINE_SIZE = 30
local RELOAD_TIME = 2.5
local HEADSHOT_MULTIPLIER = 2.5

local ammo = MAGAZINE_SIZE
local reloading = false
local firing = false
local lastShot = 0

local mouse = player:GetMouse()
local fireEvent = ReplicatedStorage:WaitForChild("BulletFired")
local reloadEvent = ReplicatedStorage:WaitForChild("ReloadGun")

-- Muzzle flash
local function createMuzzleFlash()
    local flash = Instance.new("Part")
    flash.Size = Vector3.new(0.8, 0.8, 0.8)
    flash.Shape = Enum.PartType.Ball
    flash.Material = Enum.Material.Neon
    flash.Color = Color3.fromRGB(255, 200, 50)
    flash.CanCollide = false
    flash.Anchored = true
    flash.CFrame = tool.Barrel.CFrame * CFrame.new(0, 0, -tool.Barrel.Size.Z/2)
    flash.Parent = workspace
    game:GetService("Debris"):AddItem(flash, 0.05)
end

-- Shoot function
local function shoot()
    if ammo <= 0 then
        -- Click sound (empty)
        tool.FireSound:Play()
        return
    end
    if reloading then return end
    if tick() - lastShot < FIRE_RATE then return end
    lastShot = tick()
    
    ammo -= 1
    
    -- Play fire sound
    tool.FireSound:Play()
    createMuzzleFlash()
    
    -- Calculate ray with spread
    local spreadX = (math.random() - 0.5) * SPREAD
    local spreadY = (math.random() - 0.5) * SPREAD
    local direction = (mouse.Hit.Position - tool.Handle.Position).Unit
    direction = (direction + Vector3.new(spreadX, spreadY, 0)).Unit
    
    -- Raycast
    local raycastParams = RaycastParams.new()
    raycastParams.FilterDescendantsInstances = {player.Character}
    raycastParams.FilterType = Enum.RaycastFilterType.Exclude
    
    local result = workspace:Raycast(tool.Handle.Position, direction * RANGE, raycastParams)
    
    if result then
        -- Visual bullet trail
        local trail = Instance.new("Part")
        trail.Size = Vector3.new(0.05, 0.05, (result.Position - tool.Handle.Position).Magnitude)
        trail.CFrame = CFrame.new(tool.Handle.Position, result.Position) * CFrame.new(0, 0, -trail.Size.Z/2)
        trail.Material = Enum.Material.Neon
        trail.Color = Color3.fromRGB(255, 220, 100)
        trail.CanCollide = false
        trail.Anchored = true
        trail.Parent = workspace
        game:GetService("Debris"):AddItem(trail, 0.05)
        
        -- Send hit to server
        local isHeadshot = result.Instance.Name == "Head"
        fireEvent:FireServer(result.Instance, direction * RANGE, isHeadshot)
    end
    
    -- Recoil (camera kick)
    local recoilTween = TweenService:Create(camera, TweenInfo.new(0.05), {
        CFrame = camera.CFrame * CFrame.Angles(math.rad(-1.5), math.rad((math.random()-0.5)*0.5), 0)
    })
    recoilTween:Play()
end

-- Reload
local function reload()
    if reloading or ammo == MAGAZINE_SIZE then return end
    reloading = true
    tool.ReloadSound:Play()
    task.wait(RELOAD_TIME)
    ammo = MAGAZINE_SIZE
    reloading = false
end

-- Input handling
tool.Equipped:Connect(function()
    mouse.Button1Down:Connect(function()
        firing = true
    end)
    mouse.Button1Up:Connect(function()
        firing = false
    end)
end)

-- Auto fire loop
RunService.Heartbeat:Connect(function()
    if firing and tool.Parent == player.Character then
        shoot()
    end
end)

UIS.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.R then reload() end
end)


## IRON SIGHT / ADS (Aim Down Sights)
-- Tween camera FOV when right-clicking
local ADS_FOV = 45
local HIP_FOV = 70
local isADS = false

mouse.Button2Down:Connect(function()
    if not tool.Parent == player.Character then return end
    isADS = true
    TweenService:Create(camera, TweenInfo.new(0.15), { FieldOfView = ADS_FOV }):Play()
end)

mouse.Button2Up:Connect(function()
    isADS = false
    TweenService:Create(camera, TweenInfo.new(0.15), { FieldOfView = HIP_FOV }):Play()
end)


## SERVER DAMAGE SCRIPT
-- Script (server-side):
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local events = Instance.new("Folder")
events.Name = "GunEvents"
events.Parent = ReplicatedStorage

local fireEvent = Instance.new("RemoteEvent")
fireEvent.Name = "BulletFired"
fireEvent.Parent = ReplicatedStorage

local DAMAGE = 35
local HEADSHOT_MULTIPLIER = 2.5

fireEvent.OnServerEvent:Connect(function(player, hitInstance, direction, isHeadshot)
    if not hitInstance then return end
    
    -- Find humanoid
    local humanoid = hitInstance.Parent:FindFirstChild("Humanoid")
        or hitInstance.Parent.Parent:FindFirstChild("Humanoid")
    
    if humanoid and humanoid.Health > 0 then
        -- Don't shoot yourself
        if hitInstance:IsDescendantOf(player.Character) then return end
        
        local damage = isHeadshot and (DAMAGE * HEADSHOT_MULTIPLIER) or DAMAGE
        humanoid:TakeDamage(damage)
        
        -- Hit marker feedback to shooter
        local hitEvent = ReplicatedStorage:FindFirstChild("HitConfirm")
        if hitEvent then
            hitEvent:FireClient(player, isHeadshot)
        end
    end
end)


## HANDCUFF TOOL — DETAIN / SEARCH / RELEASE
-- LocalScript:
local tool = script.Parent
local player = game:GetService("Players").LocalPlayer
local UIS = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local detainEvent = ReplicatedStorage:WaitForChild("HandcuffDetain")
local searchEvent = ReplicatedStorage:WaitForChild("HandcuffSearch")
local releaseEvent = ReplicatedStorage:WaitForChild("HandcuffRelease")

local CUFF_RANGE = 8
local detainedPlayers = {}

local mouse = player:GetMouse()

-- Get closest player in range
local function getTargetPlayer()
    local char = player.Character
    if not char then return nil end
    local rootPart = char:FindFirstChild("HumanoidRootPart")
    if not rootPart then return nil end
    
    local closest, closestDist = nil, CUFF_RANGE
    
    for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
        if p ~= player and p.Character then
            local targetRoot = p.Character:FindFirstChild("HumanoidRootPart")
            if targetRoot then
                local dist = (targetRoot.Position - rootPart.Position).Magnitude
                if dist < closestDist then
                    closest = p
                    closestDist = dist
                end
            end
        end
    end
    return closest
end

tool.Activated:Connect(function()
    local target = getTargetPlayer()
    if not target then return end
    detainEvent:FireServer(target)
end)

UIS.InputBegan:Connect(function(input, processed)
    if processed then return end
    local target = getTargetPlayer()
    if not target then return end
    
    if input.KeyCode == Enum.KeyCode.F then  -- F = search
        searchEvent:FireServer(target)
    end
    if input.KeyCode == Enum.KeyCode.G then  -- G = release
        releaseEvent:FireServer(target)
    end
end)

-- Server Script:
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local detainEvent = Instance.new("RemoteEvent")
detainEvent.Name = "HandcuffDetain"
detainEvent.Parent = ReplicatedStorage

local searchEvent = Instance.new("RemoteEvent")
searchEvent.Name = "HandcuffSearch"
searchEvent.Parent = ReplicatedStorage

local releaseEvent = Instance.new("RemoteEvent")
releaseEvent.Name = "HandcuffRelease"
releaseEvent.Parent = ReplicatedStorage

local detained = {}  -- [targetUserId] = true

detainEvent.OnServerEvent:Connect(function(officer, targetPlayer)
    local targetChar = targetPlayer.Character
    if not targetChar then return end
    local humanoid = targetChar:FindFirstChild("Humanoid")
    if not humanoid then return end
    
    -- Freeze target
    humanoid.WalkSpeed = 0
    humanoid.JumpPower = 0
    detained[targetPlayer.UserId] = officer.Name
    
    -- Handcuff visual: attach a part to wrists
    local rootPart = targetChar:FindFirstChild("HumanoidRootPart")
    if rootPart then
        local cuffPart = Instance.new("Part")
        cuffPart.Name = "HandcuffVisual"
        cuffPart.Size = Vector3.new(1.5, 0.3, 0.3)
        cuffPart.Color = Color3.fromRGB(180, 180, 180)
        cuffPart.Material = Enum.Material.Metal
        cuffPart.CanCollide = false
        local weld = Instance.new("WeldConstraint")
        weld.Part0 = cuffPart
        weld.Part1 = rootPart
        weld.Parent = cuffPart
        cuffPart.CFrame = rootPart.CFrame * CFrame.new(0, -1, 0.5)
        cuffPart.Parent = targetChar
    end
end)

searchEvent.OnServerEvent:Connect(function(officer, targetPlayer)
    if not detained[targetPlayer.UserId] then return end
    -- Fire search UI to the officer's client
    local searchUIEvent = ReplicatedStorage:FindFirstChild("OpenSearchUI")
    if searchUIEvent then
        searchUIEvent:FireClient(officer, targetPlayer)
    end
end)

releaseEvent.OnServerEvent:Connect(function(officer, targetPlayer)
    if not detained[targetPlayer.UserId] then return end
    
    local targetChar = targetPlayer.Character
    if targetChar then
        local humanoid = targetChar:FindFirstChild("Humanoid")
        if humanoid then
            humanoid.WalkSpeed = 16
            humanoid.JumpPower = 50
        end
        -- Remove cuff visual
        local cuffVisual = targetChar:FindFirstChild("HandcuffVisual")
        if cuffVisual then cuffVisual:Destroy() end
    end
    detained[targetPlayer.UserId] = nil
end)
`

export const HELICOPTER_COPILOT_KNOWLEDGE = `
=== HELICOPTER COPILOT SYSTEM — CAMERA LOCK & SPOTLIGHT ===

## HELICOPTER STRUCTURE (Explorer layout)
Model
  Body (main fuselage)
  MainRotor (spins on Y axis)
  TailRotor (spins on Z axis)
  Skid_L, Skid_R
  PilotSeat (VehicleSeat — front left)
  CopilotSeat (VehicleSeat — front right, Disabled=true so it doesnt control flight)
  Spotlight (SpotLight instance inside a Part on belly)
  SpotlightPart (rotatable part on belly)
  Camera_Gimbal (Part on belly, holds camera CFrame)
  Scripts folder
    HelicopterFlight (Script — server)
    RotorSpin (LocalScript)
    CopilotSystem (LocalScript)
    SpotlightControl (Script — server)

## ROTOR SPIN (LocalScript)
local RunService = game:GetService("RunService")
local model = script.Parent.Parent
local mainRotor = model:WaitForChild("MainRotor")
local tailRotor = model:WaitForChild("TailRotor")
local rotorSpeed = 0
local maxSpeed = 15

RunService.RenderStepped:Connect(function(dt)
    local pilot = model:FindFirstChild("PilotSeat")
    if pilot and pilot.Occupant then
        rotorSpeed = math.min(rotorSpeed + dt * 3, maxSpeed)
    else
        rotorSpeed = math.max(rotorSpeed - dt * 2, 0)
    end
    mainRotor.CFrame = mainRotor.CFrame * CFrame.Angles(0, math.rad(rotorSpeed), 0)
    tailRotor.CFrame = tailRotor.CFrame * CFrame.Angles(math.rad(rotorSpeed * 2), 0, 0)
end)

## COPILOT SYSTEM (LocalScript) — Camera Lock + Spotlight Toggle
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UIS = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera
local model = script.Parent.Parent

local spotlightEvent = ReplicatedStorage:WaitForChild("ToggleSpotlight")
local lockOnEvent = ReplicatedStorage:WaitForChild("SetLockOnTarget")

local isActive = false      -- copilot is seated
local cameraMode = "free"   -- "free" | "lockon" | "spotlight"
local lockedTarget = nil    -- BasePart to track
local spotlightOn = false

-- HUD ScreenGui
local gui = Instance.new("ScreenGui")
gui.Name = "CopilotHUD"
gui.ResetOnSpawn = false
gui.Enabled = false
gui.Parent = player.PlayerGui

-- Main HUD frame (bottom bar)
local hudFrame = Instance.new("Frame")
hudFrame.Size = UDim2.new(0, 500, 0, 80)
hudFrame.AnchorPoint = Vector2.new(0.5, 1)
hudFrame.Position = UDim2.new(0.5, 0, 0.95, 0)
hudFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 20)
hudFrame.BackgroundTransparency = 0.3
hudFrame.BorderSizePixel = 0
hudFrame.Parent = gui
Instance.new("UICorner", hudFrame).CornerRadius = UDim.new(0, 12)

-- Camera feed overlay (when locked on)
local cameraFeed = Instance.new("Frame")
cameraFeed.Size = UDim2.new(0, 320, 0, 220)
cameraFeed.AnchorPoint = Vector2.new(1, 0)
cameraFeed.Position = UDim2.new(0.98, 0, 0.02, 0)
cameraFeed.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
cameraFeed.BackgroundTransparency = 0.1
cameraFeed.Visible = false
cameraFeed.Parent = gui
Instance.new("UICorner", cameraFeed).CornerRadius = UDim.new(0, 8)

local feedLabel = Instance.new("TextLabel")
feedLabel.Size = UDim2.new(1, 0, 0, 24)
feedLabel.BackgroundTransparency = 1
feedLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
feedLabel.Font = Enum.Font.GothamBold
feedLabel.TextSize = 13
feedLabel.Text = "📷 TRACKING TARGET"
feedLabel.Parent = cameraFeed

-- Crosshair on camera feed
local feedCrosshair = Instance.new("Frame")
feedCrosshair.Size = UDim2.new(0, 40, 0, 40)
feedCrosshair.AnchorPoint = Vector2.new(0.5, 0.5)
feedCrosshair.Position = UDim2.new(0.5, 0, 0.5, 0)
feedCrosshair.BackgroundTransparency = 1
feedCrosshair.BorderSizePixel = 2
feedCrosshair.BorderColor3 = Color3.fromRGB(100, 255, 100)
feedCrosshair.Parent = cameraFeed

-- Buttons
local function makeButton(text, pos, color)
    local btn = Instance.new("TextButton")
    btn.Size = UDim2.new(0, 140, 0, 44)
    btn.Position = pos
    btn.BackgroundColor3 = color
    btn.BackgroundTransparency = 0.4
    btn.BorderSizePixel = 0
    btn.TextColor3 = Color3.fromRGB(255,255,255)
    btn.Font = Enum.Font.GothamBold
    btn.TextSize = 13
    btn.Text = text
    btn.Parent = hudFrame
    Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 8)
    return btn
end

local lockBtn = makeButton("🎯 Lock On  [L]", UDim2.new(0, 10, 0.5, -22), Color3.fromRGB(0,120,255))
local spotBtn = makeButton("💡 Spotlight [F]", UDim2.new(0, 160, 0.5, -22), Color3.fromRGB(200,150,0))
local freeBtn = makeButton("📷 Free Cam [C]", UDim2.new(0, 310, 0.5, -22), Color3.fromRGB(60,60,60))

-- Get all vehicles (Models with VehicleSeats) in workspace
local function getNearbyVehicles()
    local vehicles = {}
    for _, obj in ipairs(workspace:GetDescendants()) do
        if obj:IsA("VehicleSeat") and obj.Parent ~= model then
            local root = obj.Parent:FindFirstChild("HumanoidRootPart") or obj
            table.insert(vehicles, {part = root, name = obj.Parent.Name})
        end
    end
    return vehicles
end

-- Lock on to nearest vehicle
local function lockOnNearest()
    local gimbal = model:FindFirstChild("Camera_Gimbal")
    if not gimbal then return end
    local vehicles = getNearbyVehicles()
    if #vehicles == 0 then
        feedLabel.Text = "⚠️ NO TARGETS IN RANGE"
        return
    end
    -- Find closest
    local closest, closestDist = nil, math.huge
    for _, v in ipairs(vehicles) do
        local dist = (v.part.Position - gimbal.Position).Magnitude
        if dist < closestDist then
            closest = v
            closestDist = dist
        end
    end
    if closest then
        lockedTarget = closest.part
        cameraMode = "lockon"
        cameraFeed.Visible = true
        feedLabel.Text = "📷 LOCKED: " .. closest.name
        lockOnEvent:FireServer(closest.part)
    end
end

-- Spotlight toggle
local function toggleSpotlight()
    spotlightOn = not spotlightOn
    spotlightEvent:FireServer(spotlightOn)
    spotBtn.BackgroundColor3 = spotlightOn 
        and Color3.fromRGB(255, 220, 50) 
        or Color3.fromRGB(200, 150, 0)
    spotBtn.Text = spotlightOn and "💡 Spotlight ON [F]" or "💡 Spotlight OFF [F]"
end

-- Button connections
lockBtn.MouseButton1Click:Connect(lockOnNearest)
spotBtn.MouseButton1Click:Connect(toggleSpotlight)
freeBtn.MouseButton1Click:Connect(function()
    cameraMode = "free"
    lockedTarget = nil
    cameraFeed.Visible = false
    camera.CameraType = Enum.CameraType.Custom
end)

-- Input shortcuts
UIS.InputBegan:Connect(function(input, processed)
    if not isActive or processed then return end
    if input.KeyCode == Enum.KeyCode.L then lockOnNearest() end
    if input.KeyCode == Enum.KeyCode.F then toggleSpotlight() end
    if input.KeyCode == Enum.KeyCode.C then
        cameraMode = "free"
        lockedTarget = nil
        cameraFeed.Visible = false
        camera.CameraType = Enum.CameraType.Custom
    end
end)

-- RenderStepped: update camera to track locked target
RunService.RenderStepped:Connect(function()
    if not isActive then return end
    if cameraMode == "lockon" and lockedTarget and lockedTarget.Parent then
        local gimbal = model:FindFirstChild("Camera_Gimbal")
        if gimbal then
            -- Point camera at locked target from gimbal position
            camera.CameraType = Enum.CameraType.Scriptable
            camera.CFrame = CFrame.new(gimbal.Position, lockedTarget.Position)
        end
    end
end)

-- Detect when player sits in copilot seat
local copilotSeat = model:WaitForChild("CopilotSeat")
copilotSeat:GetPropertyChangedSignal("Occupant"):Connect(function()
    if copilotSeat.Occupant then
        local seatPlayer = Players:GetPlayerFromCharacter(copilotSeat.Occupant.Parent)
        if seatPlayer == player then
            isActive = true
            gui.Enabled = true
        end
    else
        isActive = false
        gui.Enabled = false
        cameraMode = "free"
        lockedTarget = nil
        cameraFeed.Visible = false
        camera.CameraType = Enum.CameraType.Custom
    end
end)

## SERVER — SPOTLIGHT CONTROL
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local spotlightEvent = Instance.new("RemoteEvent")
spotlightEvent.Name = "ToggleSpotlight"
spotlightEvent.Parent = ReplicatedStorage

local lockOnEvent = Instance.new("RemoteEvent")
lockOnEvent.Name = "SetLockOnTarget"
lockOnEvent.Parent = ReplicatedStorage

local activeTargets = {}  -- [player] = BasePart

spotlightEvent.OnServerEvent:Connect(function(player, state)
    local char = player.Character
    if not char then return end
    -- Find helicopter model the player is in
    local seat = char:FindFirstAncestorOfClass("Model")
    if not seat then return end
    local spotlight = seat:FindFirstChild("Spotlight", true)
    local spotPart = seat:FindFirstChild("SpotlightPart", true)
    if spotlight then
        spotlight.Enabled = state
        if spotPart then
            spotPart.Material = state and Enum.Material.Neon or Enum.Material.SmoothPlastic
            spotPart.Color = state and Color3.fromRGB(255,255,220) or Color3.fromRGB(80,80,80)
        end
    end
end)

lockOnEvent.OnServerEvent:Connect(function(player, targetPart)
    activeTargets[player] = targetPart
end)

-- Server-side: rotate spotlight part toward locked target
RunService.Heartbeat:Connect(function()
    for player, targetPart in pairs(activeTargets) do
        if not player.Character then continue end
        local heli = player.Character:FindFirstAncestorOfClass("Model")
        if not heli then continue end
        local spotPart = heli:FindFirstChild("SpotlightPart", true)
        if spotPart and targetPart and targetPart.Parent then
            spotPart.CFrame = CFrame.new(spotPart.Position, targetPart.Position)
        end
    end
end)
`

export const NAVY_SHIP_KNOWLEDGE = `
=== NAVY SHIP — MOVEMENT, TURRETS, GUNS ===

## SHIP STRUCTURE
Model
  Hull (large wedge+box composite)
  Deck (flat top surface)
  Superstructure (bridge tower)
  Bridge (top of superstructure, pilot seat)
  Turret_Front (rotates independently)
    TurretBase
    TurretBarrel_L
    TurretBarrel_R
  Turret_Rear
    TurretBase
    TurretBarrel_L
    TurretBarrel_R
  AntiAir_L, AntiAir_R (smaller rapid-fire mounts)
  Anchor_Chain (decorative)
  Radar (spinning part on mast)
  ShipEngine (Script)
  PilotSeat (VehicleSeat inside Bridge)

## SHIP MOVEMENT (BodyVelocity + BodyGyro — handles large mass)
-- Script (server):
local RunService = game:GetService("RunService")
local model = script.Parent
local root = model:FindFirstChild("Hull")
local seat = model:FindFirstChild("PilotSeat", true)

local MAX_SPEED = 30
local TURN_SPEED = 0.8
local ACCELERATION = 0.3

local bv = Instance.new("BodyVelocity")
bv.MaxForce = Vector3.new(1e7, 0, 1e7)  -- no Y force (stays on water)
bv.Velocity = Vector3.new(0,0,0)
bv.Parent = root

local bg = Instance.new("BodyGyro")
bg.MaxTorque = Vector3.new(0, 1e7, 0)   -- only Y rotation
bg.D = 200
bg.P = 3000
bg.CFrame = root.CFrame
bg.Parent = root

local currentSpeed = 0
local targetAngle = 0

RunService.Heartbeat:Connect(function(dt)
    if not seat.Occupant then
        -- Slow to stop
        currentSpeed = currentSpeed * 0.95
        bv.Velocity = root.CFrame.LookVector * currentSpeed
        return
    end
    
    local steer = seat.SteerFloat    -- -1 left, 1 right
    local throttle = seat.ThrottleFloat  -- -1 back, 1 forward
    
    currentSpeed = currentSpeed + (throttle * ACCELERATION)
    currentSpeed = math.clamp(currentSpeed, -MAX_SPEED * 0.3, MAX_SPEED)
    
    -- Turn
    targetAngle = targetAngle + (steer * TURN_SPEED * dt * 60)
    bg.CFrame = CFrame.Angles(0, math.rad(targetAngle), 0)
    
    -- Move forward
    bv.Velocity = root.CFrame.LookVector * currentSpeed
end)

## TURRET SYSTEM (each turret rotates to face mouse)
-- LocalScript inside Turret:
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local turret = script.Parent
local base = turret:FindFirstChild("TurretBase")
local barrelL = turret:FindFirstChild("TurretBarrel_L")
local barrelR = turret:FindFirstChild("TurretBarrel_R")
local fireTurretEvent = ReplicatedStorage:WaitForChild("FireTurret")

local player = Players.LocalPlayer
local mouse = player:GetMouse()
local FIRE_RATE = 1.5
local lastFire = 0
local isOccupied = false

-- Check if player is in this ship's gunner seat
local gunnerSeat = turret.Parent:FindFirstChild("GunnerSeat_" .. turret.Name)

RunService.RenderStepped:Connect(function()
    if not isOccupied then return end
    -- Rotate turret base to face mouse on Y axis
    local targetPos = mouse.Hit.Position
    local lookAt = Vector3.new(targetPos.X, base.Position.Y, targetPos.Z)
    base.CFrame = CFrame.new(base.Position, lookAt)
end)

mouse.Button1Down:Connect(function()
    if not isOccupied then return end
    if tick() - lastFire < FIRE_RATE then return end
    lastFire = tick()
    fireTurretEvent:FireServer(turret.Name, mouse.Hit.Position)
end)

-- Server turret fire:
local fireTurretEvent = Instance.new("RemoteEvent")
fireTurretEvent.Name = "FireTurret"
fireTurretEvent.Parent = ReplicatedStorage

local SHELL_SPEED = 4
local BLAST_RADIUS = 25
local BLAST_DAMAGE = 150

fireTurretEvent.OnServerEvent:Connect(function(player, turretName, targetPos)
    local char = player.Character
    if not char then return end
    local ship = char:FindFirstAncestorOfClass("Model")
    if not ship then return end
    local turret = ship:FindFirstChild(turretName)
    if not turret then return end
    
    local barrelL = turret:FindFirstChild("TurretBarrel_L")
    if not barrelL then return end
    
    -- Create shell projectile
    local shell = Instance.new("Part")
    shell.Name = "NavyShell"
    shell.Size = Vector3.new(0.5, 0.5, 2)
    shell.Color = Color3.fromRGB(180, 140, 60)
    shell.Material = Enum.Material.Metal
    shell.CanCollide = false
    shell.CFrame = barrelL.CFrame
    shell.Parent = workspace
    
    local fire = Instance.new("Fire")
    fire.Size = 1; fire.Heat = 5
    fire.Parent = shell
    
    local bv = Instance.new("BodyVelocity")
    bv.Velocity = (targetPos - barrelL.Position).Unit * 200
    bv.MaxForce = Vector3.new(1e6,1e6,1e6)
    bv.Parent = shell
    
    game:GetService("Debris"):AddItem(shell, SHELL_SPEED + 0.5)
    
    task.delay(SHELL_SPEED, function()
        if not shell.Parent then return end
        local explosion = Instance.new("Explosion")
        explosion.Position = shell.Position
        explosion.BlastRadius = BLAST_RADIUS
        explosion.BlastPressure = 800000
        explosion.DestroyJointRadiusPercent = 0
        explosion.Parent = workspace
        
        for _, obj in ipairs(workspace:GetDescendants()) do
            if obj:IsA("Humanoid") and obj.Health > 0 then
                local root = obj.Parent:FindFirstChild("HumanoidRootPart")
                if root then
                    local dist = (root.Position - shell.Position).Magnitude
                    if dist <= BLAST_RADIUS then
                        local dmg = BLAST_DAMAGE * (1 - dist/BLAST_RADIUS)
                        obj:TakeDamage(dmg)
                    end
                end
            end
        end
        shell:Destroy()
    end)
end)

## SHIP WATER WAKE EFFECT
-- Particle emitter attached to bow of ship
-- WakeEmitter (ParticleEmitter):
--   Texture: rbxassetid://6101261905 (foam/splash)
--   Speed: 8-15
--   Rotation: 0-360
--   Color: white to transparent
--   EmissionDirection: Front
--   Rate: 40 (increases with speed)
`

export const FIRE_TRUCK_KNOWLEDGE = `
=== FIRE TRUCK — AERIAL LADDER, WATER HOSE, COMPARTMENTS ===

## LADDER TRUCK STRUCTURE
Model
  Body (chassis + cab)
  Cab_Front
  TurntableBase (rotates on deck)
  LadderSection_1 (main — extends)
  LadderSection_2 (mid — extends)  
  LadderSection_3 (tip — platform)
  HoseNozzle (at tip of ladder)
  WaterStream (ParticleEmitter at nozzle — off by default)
  Compartment_L1, Compartment_L2, Compartment_L3 (left side storage)
  Compartment_R1, Compartment_R2, Compartment_R3 (right side storage)
  Wheels (6 wheels — front steer, rear dual axle)
  PilotSeat (VehicleSeat in cab)
  LadderSeat (Seat at base of turntable)
  NozzleSeat (Seat at ladder tip)

## COMPARTMENT DOORS (open/close with proximity or click)
-- Each compartment is a part with a hinge:
-- Compartment_L1
--   Door (the opening flap — HingeConstraint)
--   Contents (tools stored inside — invisible until open)
--     PortableHose_1 (Tool)
--     PortableHose_2 (Tool)
--     FireExtinguisher (Tool)

-- Script inside each compartment:
local compartment = script.Parent
local door = compartment:FindFirstChild("Door")
local contents = compartment:FindFirstChild("Contents")
local isOpen = false
local OPEN_ANGLE = 90

local hinge = door:FindFirstChildOfClass("HingeConstraint")
if hinge then
    hinge.ActuatorType = Enum.ActuatorType.Servo
    hinge.TargetAngle = 0
    hinge.AngularSpeed = 100
end

local clickDetector = Instance.new("ClickDetector")
clickDetector.MaxActivationDistance = 8
clickDetector.Parent = door

clickDetector.MouseClick:Connect(function(player)
    isOpen = not isOpen
    if hinge then
        hinge.TargetAngle = isOpen and OPEN_ANGLE or 0
    end
    -- Show/hide contents
    if contents then
        for _, item in ipairs(contents:GetChildren()) do
            if item:IsA("Tool") then
                item.Parent = isOpen and workspace or contents
                if isOpen then
                    item:SetPrimaryPartCFrame(
                        compartment.Door.CFrame * CFrame.new(0, 1, 0)
                    )
                end
            end
        end
    end
end)

## AERIAL LADDER EXTENSION + ROTATION
-- LocalScript for ladder operator (seated at LadderSeat):
local Players = game:GetService("Players")
local UIS = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local truck = script.Parent.Parent
local turntable = truck:FindFirstChild("TurntableBase")
local section1 = truck:FindFirstChild("LadderSection_1")
local section2 = truck:FindFirstChild("LadderSection_2")
local section3 = truck:FindFirstChild("LadderSection_3")
local nozzle = truck:FindFirstChild("HoseNozzle")

local ladderEvent = ReplicatedStorage:WaitForChild("LadderControl")

local ROTATE_SPEED = 1.5    -- degrees per frame
local EXTEND_SPEED = 0.5    -- studs per frame
local MAX_EXTENSION = 40    -- max studs extended
local MAX_ANGLE = 75        -- max elevation degrees

local extended = 0
local elevation = 0
local rotation = 0

-- Controls: A/D rotate, W/S elevate, Q/E extend/retract
UIS.InputBegan:Connect(function(input, processed)
    if processed then return end
end)

local seat = truck:FindFirstChild("LadderSeat")
local isSeated = false
seat:GetPropertyChangedSignal("Occupant"):Connect(function()
    isSeated = seat.Occupant ~= nil and 
        Players:GetPlayerFromCharacter(seat.Occupant.Parent) == player
end)

game:GetService("RunService").RenderStepped:Connect(function(dt)
    if not isSeated then return end
    
    local rotating = 0
    local elevating = 0
    local extending = 0
    
    if UIS:IsKeyDown(Enum.KeyCode.A) then rotating = -ROTATE_SPEED end
    if UIS:IsKeyDown(Enum.KeyCode.D) then rotating = ROTATE_SPEED end
    if UIS:IsKeyDown(Enum.KeyCode.W) then elevating = ROTATE_SPEED end
    if UIS:IsKeyDown(Enum.KeyCode.S) then elevating = -ROTATE_SPEED end
    if UIS:IsKeyDown(Enum.KeyCode.Q) then extending = EXTEND_SPEED end
    if UIS:IsKeyDown(Enum.KeyCode.E) then extending = -EXTEND_SPEED end
    
    if rotating ~= 0 or elevating ~= 0 or extending ~= 0 then
        ladderEvent:FireServer(rotating, elevating, extending)
    end
end)

-- Server ladder control:
local ladderEvent = Instance.new("RemoteEvent")
ladderEvent.Name = "LadderControl"
ladderEvent.Parent = ReplicatedStorage

local state = {rotation=0, elevation=0, extended=0}

ladderEvent.OnServerEvent:Connect(function(player, rotating, elevating, extending)
    local truck = player.Character and player.Character:FindFirstAncestorOfClass("Model")
    if not truck then return end
    
    local turntable = truck:FindFirstChild("TurntableBase")
    local section1 = truck:FindFirstChild("LadderSection_1")
    local nozzle = truck:FindFirstChild("HoseNozzle")
    
    state.rotation = state.rotation + rotating
    state.elevation = math.clamp(state.elevation + elevating, 0, 75)
    state.extended = math.clamp(state.extended + extending, 0, 40)
    
    if turntable then
        turntable.CFrame = turntable.CFrame.Position 
            and CFrame.new(turntable.CFrame.Position) 
            * CFrame.Angles(0, math.rad(state.rotation), 0)
    end
    if section1 then
        section1.CFrame = section1.CFrame.Position
            and CFrame.new(section1.CFrame.Position)
            * CFrame.Angles(math.rad(-state.elevation), 0, 0)
    end
    -- Extend by moving section positions
    local section2 = truck:FindFirstChild("LadderSection_2")
    if section2 then
        section2.Position = section1 and 
            section1.Position + section1.CFrame.LookVector * (state.extended * 0.5)
            or section2.Position
    end
end)

## WATER HOSE SYSTEM (on ladder nozzle + portable hoses)
-- Tool script for water hose:
local tool = script.Parent
local player = game:GetService("Players").LocalPlayer
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local waterEvent = ReplicatedStorage:WaitForChild("WaterSpray")
local mouse = player:GetMouse()
local spraying = false

-- Particle emitter in handle
local emitter = tool.Handle:FindFirstChildOfClass("ParticleEmitter")

tool.Activated:Connect(function()
    spraying = true
    if emitter then emitter.Enabled = true end
    waterEvent:FireServer(true, mouse.Hit.Position)
end)

tool.Deactivated:Connect(function()
    spraying = false
    if emitter then emitter.Enabled = false end
    waterEvent:FireServer(false, Vector3.new(0,0,0))
end)

-- Server water spray + extinguish fires:
local waterEvent = Instance.new("RemoteEvent")
waterEvent.Name = "WaterSpray"
waterEvent.Parent = ReplicatedStorage

local WATER_RANGE = 30
local EXTINGUISH_RADIUS = 8

waterEvent.OnServerEvent:Connect(function(player, active, targetPos)
    if not active then return end
    
    -- Find all Fire instances within range of spray point
    for _, obj in ipairs(workspace:GetDescendants()) do
        if obj:IsA("Fire") or obj:IsA("Smoke") then
            local part = obj.Parent
            if part:IsA("BasePart") then
                local dist = (part.Position - targetPos).Magnitude
                if dist <= EXTINGUISH_RADIUS then
                    obj:Destroy()
                    -- Also remove any "OnFire" tags
                    local tag = part:FindFirstChild("OnFire")
                    if tag then tag:Destroy() end
                end
            end
        end
    end
end)
`

export const FIRE_SYSTEM_KNOWLEDGE = `
=== FIRE SYSTEM — RANDOM BUILDING FIRES, SPREAD, EXTINGUISH ===

## HOW IT WORKS
1. Buildings tagged "Flammable" in CollectionService are eligible
2. A server Script randomly selects one every X minutes
3. Fire + Smoke spawns on random parts of that building
4. Fire spreads to adjacent parts over time
5. Water hose extinguishes by removing Fire/Smoke instances
6. Buildings have a "health" — fully burned = charred appearance

## COMPLETE FIRE SYSTEM SCRIPT
-- Script in ServerScriptService named "FireSystem":
local CollectionService = game:GetService("CollectionService")
local RunService = game:GetService("RunService")

-- CONFIG
local FIRE_INTERVAL_MIN = 120   -- minimum seconds between fires (2 min)
local FIRE_INTERVAL_MAX = 300   -- maximum seconds between fires (5 min)
local SPREAD_INTERVAL = 8       -- seconds between spread ticks
local SPREAD_RADIUS = 12        -- studs — fire jumps to parts within this range
local MAX_FIRES_PER_BUILDING = 20  -- cap to prevent performance issues
local CHAR_COLOR = Color3.fromRGB(30, 20, 10)  -- charred color

local activeFireBuildings = {}   -- [model] = {parts with fire}
local lastFireTime = tick()
local nextFireDelay = math.random(FIRE_INTERVAL_MIN, FIRE_INTERVAL_MAX)

-- Tag a building as flammable in Studio with CollectionService tag "Flammable"
-- OR script can auto-tag all Models with more than 20 parts:
local function autoTagBuildings()
    for _, obj in ipairs(workspace:GetDescendants()) do
        if obj:IsA("Model") and #obj:GetDescendants() > 20 then
            local hasFlammable = false
            for _, part in ipairs(obj:GetDescendants()) do
                if part:IsA("BasePart") and 
                   (part.Material == Enum.Material.Wood or
                    part.Material == Enum.Material.Brick or
                    part.Material == Enum.Material.SmoothPlastic) then
                    hasFlammable = true
                    break
                end
            end
            if hasFlammable then
                CollectionService:AddTag(obj, "Flammable")
            end
        end
    end
end

autoTagBuildings()

-- Start fire on a specific building
local function startFire(building)
    if activeFireBuildings[building] then return end
    
    -- Get all flammable parts in building
    local flammableParts = {}
    for _, part in ipairs(building:GetDescendants()) do
        if part:IsA("BasePart") and not part:FindFirstChildOfClass("Fire") then
            local mat = part.Material
            if mat == Enum.Material.Wood or mat == Enum.Material.Brick 
               or mat == Enum.Material.SmoothPlastic or mat == Enum.Material.Fabric then
                table.insert(flammableParts, part)
            end
        end
    end
    
    if #flammableParts == 0 then return end
    
    -- Start fire on 1-3 random parts
    local startCount = math.random(1, 3)
    local burningParts = {}
    
    for i = 1, math.min(startCount, #flammableParts) do
        local idx = math.random(1, #flammableParts)
        local part = flammableParts[idx]
        table.remove(flammableParts, idx)
        
        local fire = Instance.new("Fire")
        fire.Color = Color3.fromRGB(255, 80, 0)
        fire.SecondaryColor = Color3.fromRGB(255, 200, 0)
        fire.Size = math.random(3, 6)
        fire.Heat = 9
        fire.Parent = part
        
        local smoke = Instance.new("Smoke")
        smoke.Color = Color3.fromRGB(60, 50, 50)
        smoke.Opacity = 0.7
        smoke.RiseVelocity = 8
        smoke.Size = math.random(3, 5)
        smoke.Parent = part
        
        -- Add OnFire tag
        local tag = Instance.new("BoolValue")
        tag.Name = "OnFire"
        tag.Parent = part
        
        table.insert(burningParts, part)
    end
    
    activeFireBuildings[building] = burningParts
    print("🔥 Fire started at: " .. building.Name)
end

-- Spread fire to adjacent parts
local function spreadFire(building)
    local burningParts = activeFireBuildings[building]
    if not burningParts or #burningParts == 0 then return end
    if #burningParts >= MAX_FIRES_PER_BUILDING then return end
    
    -- Pick a random burning part to spread from
    local sourcePart = burningParts[math.random(1, #burningParts)]
    if not sourcePart or not sourcePart.Parent then
        -- Clean up invalid entry
        activeFireBuildings[building] = nil
        return
    end
    
    -- Find nearby parts not yet on fire
    for _, part in ipairs(building:GetDescendants()) do
        if part:IsA("BasePart") and not part:FindFirstChild("OnFire") then
            local dist = (part.Position - sourcePart.Position).Magnitude
            if dist <= SPREAD_RADIUS then
                -- 40% chance to spread each tick
                if math.random() < 0.4 then
                    local fire = Instance.new("Fire")
                    fire.Color = Color3.fromRGB(255, 60, 0)
                    fire.SecondaryColor = Color3.fromRGB(255, 180, 0)
                    fire.Size = math.random(2, 5)
                    fire.Heat = 8
                    fire.Parent = part
                    
                    local smoke = Instance.new("Smoke")
                    smoke.Color = Color3.fromRGB(50, 40, 40)
                    smoke.Opacity = 0.6
                    smoke.RiseVelocity = 6
                    smoke.Parent = part
                    
                    -- Char the part
                    part.Color = Color3.new(
                        math.max(0, part.Color.R - 0.1),
                        math.max(0, part.Color.G - 0.1),
                        math.max(0, part.Color.B - 0.1)
                    )
                    
                    local tag = Instance.new("BoolValue")
                    tag.Name = "OnFire"
                    tag.Parent = part
                    
                    table.insert(burningParts, part)
                    break  -- only spread to one new part per tick
                end
            end
        end
    end
end

-- Main loop
local lastSpread = tick()

RunService.Heartbeat:Connect(function()
    local now = tick()
    
    -- Check if it's time to start a new random fire
    if now - lastFireTime >= nextFireDelay then
        lastFireTime = now
        nextFireDelay = math.random(FIRE_INTERVAL_MIN, FIRE_INTERVAL_MAX)
        
        local flammableBuildings = CollectionService:GetTagged("Flammable")
        if #flammableBuildings > 0 then
            local target = flammableBuildings[math.random(1, #flammableBuildings)]
            if not activeFireBuildings[target] then
                startFire(target)
            end
        end
    end
    
    -- Spread existing fires
    if now - lastSpread >= SPREAD_INTERVAL then
        lastSpread = now
        for building, _ in pairs(activeFireBuildings) do
            if building.Parent then
                spreadFire(building)
            else
                activeFireBuildings[building] = nil
            end
        end
    end
end)

-- Public function: manually trigger fire on specific building
-- Call from other scripts: require(FireSystem).startFire(buildingModel)
return {
    startFire = startFire,
    getActiveFires = function() return activeFireBuildings end,
}

## MANUAL TRIGGER (for admin or game events)
-- From any Script:
local FireSystem = require(game.ServerScriptService.FireSystem)
local targetBuilding = workspace:FindFirstChild("ApartmentBlock_1")
if targetBuilding then
    FireSystem.startFire(targetBuilding)
end

## PERFORMANCE NOTES
- Cap fires per building (MAX_FIRES_PER_BUILDING = 20) 
- Use Heartbeat not a while loop
- Clean up invalid references each spread tick
- Consider disabling spread if server has 60+ active fire parts total
`
