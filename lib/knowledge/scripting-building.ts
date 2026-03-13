export const BUILDING_SCRIPTING_KNOWLEDGE = `
=== BUILDING SCRIPTING — DOORS, ELEVATORS, CAMERAS, ALARMS, WEATHER ===

## DOOR SYSTEM — LOCKED, KEYCARD, BREAKABLE
-- Script inside door Model:
local door = script.Parent
local doorPart = door:FindFirstChild("DoorPart")
local frame = door:FindFirstChild("Frame")
local SWING_ANGLE = 100
local isOpen = false
local isLocked = door:FindFirstChild("IsLocked") and door.IsLocked.Value or false
local requiredKeycard = door:FindFirstChild("RequiredKeycard") 
    and door.RequiredKeycard.Value or nil

local hinge = doorPart:FindFirstChildOfClass("HingeConstraint")
if hinge then
    hinge.ActuatorType = Enum.ActuatorType.Servo
    hinge.AngularSpeed = 200
    hinge.TargetAngle = 0
end

local clickDetector = Instance.new("ClickDetector")
clickDetector.MaxActivationDistance = 6
clickDetector.Parent = doorPart

-- Keycard reader light
local readerLight = door:FindFirstChild("ReaderLight")

clickDetector.MouseClick:Connect(function(player)
    if isLocked then
        -- Check if player has keycard in backpack
        if requiredKeycard then
            local hasCard = false
            for _, item in ipairs(player.Backpack:GetChildren()) do
                if item.Name == requiredKeycard then hasCard = true break end
            end
            if player.Character then
                for _, item in ipairs(player.Character:GetChildren()) do
                    if item.Name == requiredKeycard then hasCard = true break end
                end
            end
            if not hasCard then
                if readerLight then readerLight.Color = Color3.fromRGB(255, 0, 0) end
                task.delay(1, function()
                    if readerLight then readerLight.Color = Color3.fromRGB(255, 165, 0) end
                end)
                return
            end
        end
    end
    
    isOpen = not isOpen
    if hinge then hinge.TargetAngle = isOpen and SWING_ANGLE or 0 end
    if readerLight then 
        readerLight.Color = isOpen and Color3.fromRGB(0,255,0) or Color3.fromRGB(255,165,0) 
    end
    
    -- Auto close after 5 seconds
    if isOpen then
        task.delay(5, function()
            if isOpen then
                isOpen = false
                if hinge then hinge.TargetAngle = 0 end
            end
        end)
    end
end)

-- Breakable door (ram it):
doorPart:GetPropertyChangedSignal("AssemblyLinearVelocity"):Connect(function()
    local speed = doorPart.AssemblyLinearVelocity.Magnitude
    if speed > 30 and isLocked then
        isLocked = false
        -- Debris effect
        for i = 1, 5 do
            local debris = Instance.new("Part")
            debris.Size = Vector3.new(math.random(1,3)*0.1, math.random(1,3)*0.1, 0.1)
            debris.Color = doorPart.Color
            debris.Material = doorPart.Material
            debris.CFrame = doorPart.CFrame * CFrame.new(
                math.random(-2,2), math.random(0,2), 0)
            debris.Parent = workspace
            game:GetService("Debris"):AddItem(debris, 5)
        end
    end
end)

## ELEVATOR SYSTEM — MULTI-FLOOR
-- Place an "ElevatorShaft" Model with:
-- Platform (the floor that moves), Door_1, Door_2... (one per floor)
-- FloorButton_1, FloorButton_2... (ClickDetectors on wall panels)
-- FloorMarker_1, FloorMarker_2... (Parts at each floor level)

local elevator = script.Parent
local platform = elevator:FindFirstChild("Platform")
local currentFloor = 1
local moving = false
local MOVE_SPEED = 15  -- studs per second

local floors = {}
local buttons = {}
for i = 1, 20 do
    local marker = elevator:FindFirstChild("FloorMarker_" .. i)
    local button = elevator:FindFirstChild("FloorButton_" .. i)
    if marker then floors[i] = marker end
    if button then buttons[i] = button end
end

local indicator = elevator:FindFirstChild("FloorIndicator")

local function goToFloor(targetFloor)
    if moving or targetFloor == currentFloor then return end
    if not floors[targetFloor] then return end
    moving = true
    
    -- Close doors
    for _, door in ipairs(elevator:GetChildren()) do
        if door.Name:match("^Door_") then
            local hinge = door:FindFirstChildOfClass("HingeConstraint")
            if hinge then hinge.TargetAngle = 0 end
        end
    end
    task.wait(1)
    
    -- Move platform
    local targetY = floors[targetFloor].Position.Y
    local startY = platform.Position.Y
    local distance = math.abs(targetY - startY)
    local duration = distance / MOVE_SPEED
    
    game:GetService("TweenService"):Create(
        platform,
        TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
        { CFrame = CFrame.new(platform.Position.X, targetY, platform.Position.Z) }
    ):Play()
    
    -- Update indicator
    task.spawn(function()
        local elapsed = 0
        while elapsed < duration do
            elapsed = elapsed + task.wait(0.5)
            local progress = elapsed / duration
            local displayFloor = math.round(startY + (targetY - startY) * progress)
            if indicator then indicator.Text = tostring(currentFloor) end
        end
    end)
    
    task.wait(duration)
    currentFloor = targetFloor
    if indicator then indicator.Text = tostring(currentFloor) end
    
    -- Open doors at new floor
    local floorDoor = elevator:FindFirstChild("Door_" .. targetFloor)
    if floorDoor then
        local hinge = floorDoor:FindFirstChildOfClass("HingeConstraint")
        if hinge then hinge.TargetAngle = 90 end
    end
    task.wait(3)
    if floorDoor then
        local hinge = floorDoor:FindFirstChildOfClass("HingeConstraint")
        if hinge then hinge.TargetAngle = 0 end
    end
    moving = false
end

for i, button in pairs(buttons) do
    local cd = Instance.new("ClickDetector")
    cd.MaxActivationDistance = 4
    cd.Parent = button
    cd.MouseClick:Connect(function() goToFloor(i) end)
end

## GARAGE DOOR — AUTO OPEN ON VEHICLE APPROACH
local garageDoor = script.Parent
local doorPanel = garageDoor:FindFirstChild("DoorPanel")
local sensor = garageDoor:FindFirstChild("ProximitySensor")  -- invisible part in front
local isOpen = false
local OPEN_HEIGHT = 12  -- studs to move up

local function setOpen(state)
    if isOpen == state then return end
    isOpen = state
    local targetY = doorPanel.Position.Y + (state and OPEN_HEIGHT or -OPEN_HEIGHT)
    game:GetService("TweenService"):Create(
        doorPanel,
        TweenInfo.new(2, Enum.EasingStyle.Quad),
        { CFrame = CFrame.new(doorPanel.Position.X, targetY, doorPanel.Position.Z) }
    ):Play()
end

-- Detect vehicles via Touched
sensor.Touched:Connect(function(hit)
    local model = hit:FindFirstAncestorOfClass("Model")
    if model and model:FindFirstChildOfClass("VehicleSeat") then
        setOpen(true)
        task.delay(6, function()
            -- Check if vehicle still nearby
            local stillNear = false
            for _, p in ipairs(sensor:GetTouchingParts()) do
                if p:FindFirstAncestorOfClass("Model") and 
                   p:FindFirstAncestorOfClass("Model"):FindFirstChildOfClass("VehicleSeat") then
                    stillNear = true
                end
            end
            if not stillNear then setOpen(false) end
        end)
    end
end)

## SECURITY CAMERA — FEEDS TO MONITOR
-- Camera model has a "ViewPart" that defines its view direction
-- Monitor model has a "Screen" SurfaceGui showing the feed

-- LocalScript (for the player viewing the monitor):
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local cameraViewEvent = ReplicatedStorage:WaitForChild("SecurityCameraView")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local viewingCamera = nil
local originalCameraType = nil

cameraViewEvent.OnClientEvent:Connect(function(action, cameraModel)
    local camera = workspace.CurrentCamera
    if action == "view" and cameraModel then
        originalCameraType = camera.CameraType
        viewingCamera = cameraModel
        camera.CameraType = Enum.CameraType.Scriptable
    elseif action == "stop" then
        camera.CameraType = originalCameraType or Enum.CameraType.Custom
        viewingCamera = nil
    end
end)

game:GetService("RunService").RenderStepped:Connect(function()
    if not viewingCamera then return end
    local viewPart = viewingCamera:FindFirstChild("ViewPart")
    if viewPart then
        workspace.CurrentCamera.CFrame = viewPart.CFrame
    end
end)

-- Monitor click to view:
local monitor = script.Parent
local screen = monitor:FindFirstChild("Screen")
local cd = Instance.new("ClickDetector")
cd.MaxActivationDistance = 5
cd.Parent = screen

local linkedCamera = monitor:FindFirstChild("LinkedCamera")  -- ObjectValue
cd.MouseClick:Connect(function(player)
    if linkedCamera and linkedCamera.Value then
        cameraViewEvent:FireClient(player, "view", linkedCamera.Value)
    end
end)

## ALARM SYSTEM — TRIGGERED BY TRESPASS OR BREAK-IN
local alarm = script.Parent
local alarmSound = alarm:FindFirstChild("AlarmSound")  -- Sound instance
local alarmLight = alarm:FindFirstChild("AlarmLight")  -- Part with PointLight
local triggerZone = alarm:FindFirstChild("TriggerZone")  -- Invisible part
local isTriggered = false
local authorisedPlayers = {}  -- [userId] = true, set by keypad/login

local function triggerAlarm(triggeredBy)
    if isTriggered then return end
    isTriggered = true
    
    if alarmSound then alarmSound:Play() end
    
    -- Flash light
    task.spawn(function()
        local light = alarmLight:FindFirstChildOfClass("PointLight")
        while isTriggered do
            if light then light.Enabled = not light.Enabled end
            if alarmLight then
                alarmLight.Color = alarmLight.Color == Color3.fromRGB(255,0,0)
                    and Color3.fromRGB(100,0,0) or Color3.fromRGB(255,0,0)
            end
            task.wait(0.4)
        end
    end)
    
    -- Notify police (fire RemoteEvent to all officers)
    local alertEvent = game:GetService("ReplicatedStorage"):FindFirstChild("AlarmAlert")
    if alertEvent then
        alertEvent:FireAllClients(alarm.Parent.Name, triggeredBy)
    end
end

triggerZone.Touched:Connect(function(hit)
    local char = hit:FindFirstAncestorOfClass("Model")
    if not char then return end
    local player = game:GetService("Players"):GetPlayerFromCharacter(char)
    if player and not authorisedPlayers[player.UserId] then
        triggerAlarm(player.Name)
    end
end)

## WEATHER SYSTEM — RAIN, FOG, WIND, LIGHTNING
-- Script in ServerScriptService:
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local weatherEvent = Instance.new("RemoteEvent")
weatherEvent.Name = "WeatherChange"
weatherEvent.Parent = ReplicatedStorage

local WEATHER_TYPES = {"clear", "overcast", "rain", "storm", "fog"}
local currentWeather = "clear"

local function setWeather(weatherType)
    currentWeather = weatherType
    
    local settings = {
        clear =   {fog=0,    fogColor=Color3.fromRGB(192,212,230), ambient=Color3.fromRGB(100,100,100), brightness=2},
        overcast ={fog=0,    fogColor=Color3.fromRGB(150,150,160), ambient=Color3.fromRGB(80,80,90),   brightness=0.8},
        rain =    {fog=500,  fogColor=Color3.fromRGB(100,110,120), ambient=Color3.fromRGB(60,65,70),   brightness=0.5},
        storm =   {fog=200,  fogColor=Color3.fromRGB(60,60,70),    ambient=Color3.fromRGB(40,40,50),   brightness=0.3},
        fog =     {fog=80,   fogColor=Color3.fromRGB(180,185,190), ambient=Color3.fromRGB(90,90,90),   brightness=0.6},
    }
    
    local s = settings[weatherType] or settings.clear
    
    game:GetService("TweenService"):Create(Lighting, TweenInfo.new(5), {
        FogEnd = s.fog == 0 and 100000 or s.fog,
        FogColor = s.fogColor,
        Ambient = s.ambient,
        Brightness = s.brightness,
    }):Play()
    
    -- Tell clients to enable/disable rain particles
    weatherEvent:FireAllClients(weatherType)
end

-- Random weather changes
task.spawn(function()
    while true do
        task.wait(math.random(120, 600))  -- change every 2-10 mins
        local newWeather = WEATHER_TYPES[math.random(1, #WEATHER_TYPES)]
        setWeather(newWeather)
    end
end)

-- LocalScript — rain particles + wind effect on client:
local weatherEvent = game:GetService("ReplicatedStorage"):WaitForChild("WeatherChange")
local camera = workspace.CurrentCamera

-- Rain ParticleEmitter attached to camera
local rainPart = Instance.new("Part")
rainPart.Size = Vector3.new(1,1,1)
rainPart.Anchored = true
rainPart.CanCollide = false
rainPart.Transparency = 1
rainPart.Parent = workspace

local rainEmitter = Instance.new("ParticleEmitter")
rainEmitter.Texture = "rbxassetid://6101261905"
rainEmitter.Rate = 0
rainEmitter.Speed = NumberRange.new(40, 60)
rainEmitter.Lifetime = NumberRange.new(1, 2)
rainEmitter.Direction = Vector3.new(0.1, -1, 0)
rainEmitter.SpreadAngle = Vector2.new(5, 5)
rainEmitter.Size = NumberSequence.new(0.1)
rainEmitter.Color = ColorSequence.new(Color3.fromRGB(180, 200, 220))
rainEmitter.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.5),
    NumberSequenceKeypoint.new(1, 1),
})
rainEmitter.Parent = rainPart

game:GetService("RunService").RenderStepped:Connect(function()
    rainPart.CFrame = camera.CFrame * CFrame.new(0, 20, -10)
end)

weatherEvent.OnClientEvent:Connect(function(weatherType)
    local rainRates = {clear=0, overcast=0, rain=200, storm=500, fog=0}
    rainEmitter.Rate = rainRates[weatherType] or 0
    
    -- Screen blur for fog/storm
    local blur = camera:FindFirstChildOfClass("BlurEffect") or Instance.new("BlurEffect", camera)
    local blurSizes = {clear=0, overcast=0, rain=0, storm=2, fog=8}
    game:GetService("TweenService"):Create(blur, TweenInfo.new(3), {
        Size = blurSizes[weatherType] or 0
    }):Play()
end)

-- Lightning (storm only):
weatherEvent.OnClientEvent:Connect(function(weatherType)
    if weatherType ~= "storm" then return end
    task.spawn(function()
        while currentWeather == "storm" do
            task.wait(math.random(5, 20))
            -- Flash
            game:GetService("Lighting").Brightness = 5
            task.wait(0.1)
            game:GetService("Lighting").Brightness = 0.3
            -- Thunder sound
            local thunder = Instance.new("Sound")
            thunder.SoundId = "rbxassetid://1369158386"
            thunder.Volume = 0.8
            thunder.Parent = workspace
            thunder:Play()
            game:GetService("Debris"):AddItem(thunder, 5)
        end
    end)
end)

## DESTRUCTIBLE WALLS
local wall = script.Parent
local WALL_HEALTH = 100
local currentHealth = WALL_HEALTH
local isDestroyed = false

wall.Touched:Connect(function(hit)
    if isDestroyed then return end
    local velocity = hit.AssemblyLinearVelocity.Magnitude
    if velocity > 20 then
        currentHealth = currentHealth - (velocity * 0.5)
        -- Crack effect (change material)
        if currentHealth < 50 then wall.Material = Enum.Material.Concrete end
        if currentHealth <= 0 then
            isDestroyed = true
            -- Spawn debris
            for i = 1, 8 do
                local debris = Instance.new("Part")
                debris.Size = Vector3.new(math.random(1,3)*0.5, math.random(1,2)*0.5, 0.3)
                debris.Color = wall.Color
                debris.Material = wall.Material
                debris.CFrame = wall.CFrame * CFrame.new(
                    math.random(-3,3), math.random(-1,2), math.random(-1,1))
                debris.Velocity = Vector3.new(
                    math.random(-10,10), math.random(5,15), math.random(-10,10))
                debris.Parent = workspace
                game:GetService("Debris"):AddItem(debris, 8)
            end
            wall:Destroy()
        end
    end
end)
`
