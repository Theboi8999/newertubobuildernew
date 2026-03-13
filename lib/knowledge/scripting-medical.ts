export const MEDICAL_SCRIPTING_KNOWLEDGE = `
=== MEDICAL SCRIPTING — INJURY, STRETCHER, DEFIB, DRUGS, HUNGER ===

## INJURY SYSTEM — BLEEDING, BROKEN LIMBS, UNCONSCIOUS
-- ModuleScript "InjurySystem" in ReplicatedStorage:
local InjurySystem = {}
local injuries = {}  -- [userId] = {bleeding=bool, brokenLimb=string, unconscious=bool}

function InjurySystem.applyInjury(player, injuryType)
    local userId = player.UserId
    if not injuries[userId] then injuries[userId] = {} end
    injuries[userId][injuryType] = true
    
    local char = player.Character
    if not char then return end
    local humanoid = char:FindFirstChild("Humanoid")
    if not humanoid then return end
    
    if injuryType == "bleeding" then
        -- Gradually drain health
        task.spawn(function()
            while injuries[userId] and injuries[userId].bleeding do
                if humanoid.Health <= 0 then break end
                humanoid:TakeDamage(1)
                task.wait(2)
            end
        end)
        -- Blood particle effect
        local bloodEmitter = Instance.new("ParticleEmitter")
        bloodEmitter.Color = ColorSequence.new(Color3.fromRGB(180, 0, 0))
        bloodEmitter.Size = NumberSequence.new(0.2)
        bloodEmitter.Rate = 10
        bloodEmitter.Lifetime = NumberRange.new(0.5, 1)
        bloodEmitter.Parent = char:FindFirstChild("HumanoidRootPart")
        
    elseif injuryType == "brokenArm" then
        humanoid.WalkSpeed = humanoid.WalkSpeed * 0.7
        -- Disable arm tool usage handled via LocalScript check
        
    elseif injuryType == "brokenLeg" then
        humanoid.WalkSpeed = 4
        humanoid.JumpPower = 0
        
    elseif injuryType == "unconscious" then
        humanoid.WalkSpeed = 0
        humanoid.JumpPower = 0
        -- Ragdoll
        for _, joint in ipairs(char:GetDescendants()) do
            if joint:IsA("Motor6D") then
                local socket = Instance.new("BallSocketConstraint")
                local a0 = Instance.new("Attachment")
                local a1 = Instance.new("Attachment")
                a0.Parent = joint.Part0
                a1.Parent = joint.Part1
                socket.Attachment0 = a0
                socket.Attachment1 = a1
                socket.Parent = joint.Part0
                joint.Enabled = false
            end
        end
    end
end

function InjurySystem.clearInjury(player, injuryType)
    local userId = player.UserId
    if injuries[userId] then
        injuries[userId][injuryType] = false
    end
    local char = player.Character
    if not char then return end
    local humanoid = char:FindFirstChild("Humanoid")
    if humanoid then
        humanoid.WalkSpeed = 16
        humanoid.JumpPower = 50
    end
    -- Remove blood emitter
    local root = char:FindFirstChild("HumanoidRootPart")
    if root then
        for _, e in ipairs(root:GetChildren()) do
            if e:IsA("ParticleEmitter") then e:Destroy() end
        end
    end
end

function InjurySystem.getInjuries(player)
    return injuries[player.UserId] or {}
end

return InjurySystem

## STRETCHER TOOL
-- Tool: Stretcher
-- LocalScript:
local tool = script.Parent
local player = game:GetService("Players").LocalPlayer
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local stretcherEvent = ReplicatedStorage:WaitForChild("StretcherAction")
local mouse = player:GetMouse()
local carrying = false
local target = nil

tool.Activated:Connect(function()
    if carrying then
        -- Drop patient
        stretcherEvent:FireServer("drop", target)
        carrying = false
        target = nil
    else
        -- Pick up nearest unconscious player
        stretcherEvent:FireServer("pickup", nil)
    end
end)

-- Server:
local stretcherEvent = Instance.new("RemoteEvent")
stretcherEvent.Name = "StretcherAction"
stretcherEvent.Parent = ReplicatedStorage

local carrying = {}  -- [medicUserId] = patientPlayer

stretcherEvent.OnServerEvent:Connect(function(medic, action, patientPlayer)
    if action == "pickup" then
        -- Find nearest unconscious player to medic
        local medicChar = medic.Character
        if not medicChar then return end
        local medicRoot = medicChar:FindFirstChild("HumanoidRootPart")
        
        local closest, closestDist = nil, 10  -- max pickup range
        for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
            if p ~= medic and p.Character then
                local h = p.Character:FindFirstChild("Humanoid")
                local r = p.Character:FindFirstChild("HumanoidRootPart")
                if h and r and h.WalkSpeed == 0 then
                    local dist = (r.Position - medicRoot.Position).Magnitude
                    if dist < closestDist then
                        closest = p
                        closestDist = dist
                    end
                end
            end
        end
        
        if closest then
            carrying[medic.UserId] = closest
            -- Weld patient to medic
            local patientRoot = closest.Character:FindFirstChild("HumanoidRootPart")
            local medicRoot2 = medicChar:FindFirstChild("HumanoidRootPart")
            if patientRoot and medicRoot2 then
                local weld = Instance.new("WeldConstraint")
                weld.Name = "StretcherWeld"
                weld.Part0 = medicRoot2
                weld.Part1 = patientRoot
                weld.Parent = medicRoot2
                patientRoot.CFrame = medicRoot2.CFrame * CFrame.new(0, 0, -3)
            end
        end
        
    elseif action == "drop" then
        local patient = carrying[medic.UserId]
        if patient and patient.Character then
            local weld = medic.Character:FindFirstChild("HumanoidRootPart")
                :FindFirstChild("StretcherWeld")
            if weld then weld:Destroy() end
        end
        carrying[medic.UserId] = nil
    end
end)

## DEFIBRILLATOR — REVIVE WITH MINIGAME
-- LocalScript:
local tool = script.Parent
local player = game:GetService("Players").LocalPlayer
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local defibEvent = ReplicatedStorage:WaitForChild("DefibAction")
local TweenService = game:GetService("TweenService")

-- Minigame GUI
local gui = Instance.new("ScreenGui")
gui.Name = "DefibMinigame"
gui.Enabled = false
gui.Parent = player.PlayerGui

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 400, 0, 120)
frame.AnchorPoint = Vector2.new(0.5, 0.5)
frame.Position = UDim2.new(0.5, 0, 0.5, 0)
frame.BackgroundColor3 = Color3.fromRGB(10, 10, 30)
frame.Parent = gui
Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 12)

local bar = Instance.new("Frame")
bar.Size = UDim2.new(0.8, 0, 0, 20)
bar.Position = UDim2.new(0.1, 0, 0.5, 0)
bar.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
bar.Parent = frame
Instance.new("UICorner", bar)

local indicator = Instance.new("Frame")
indicator.Size = UDim2.new(0, 20, 1, 0)
indicator.BackgroundColor3 = Color3.fromRGB(255, 50, 50)
indicator.Parent = bar
Instance.new("UICorner", indicator)

local targetZone = Instance.new("Frame")
targetZone.Size = UDim2.new(0.2, 0, 1, 0)
targetZone.Position = UDim2.new(0.4, 0, 0, 0)
targetZone.BackgroundColor3 = Color3.fromRGB(0, 200, 0)
targetZone.BackgroundTransparency = 0.5
targetZone.Parent = bar

local inMinigame = false
local indicatorPos = 0
local direction = 1
local SPEED = 0.8

tool.Activated:Connect(function()
    if inMinigame then return end
    inMinigame = true
    gui.Enabled = true
    
    -- Animate indicator
    local connection
    connection = game:GetService("RunService").RenderStepped:Connect(function(dt)
        indicatorPos = indicatorPos + direction * SPEED * dt
        if indicatorPos >= 1 then direction = -1 end
        if indicatorPos <= 0 then direction = 1 end
        indicator.Position = UDim2.new(indicatorPos * 0.8, 0, 0, 0)
    end)
    
    -- Player presses Space to lock in
    local inputConn
    inputConn = game:GetService("UserInputService").InputBegan:Connect(function(input)
        if input.KeyCode == Enum.KeyCode.Space then
            connection:Disconnect()
            inputConn:Disconnect()
            -- Check if in green zone (0.4 to 0.6)
            local success = indicatorPos >= 0.4 and indicatorPos <= 0.6
            gui.Enabled = false
            inMinigame = false
            defibEvent:FireServer(success)
        end
    end)
end)

-- Server defib:
local defibEvent = Instance.new("RemoteEvent")
defibEvent.Name = "DefibAction"
defibEvent.Parent = ReplicatedStorage

defibEvent.OnServerEvent:Connect(function(medic, success)
    if not success then return end
    local medicChar = medic.Character
    if not medicChar then return end
    local root = medicChar:FindFirstChild("HumanoidRootPart")
    
    -- Find nearest downed player
    for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
        if p ~= medic and p.Character then
            local h = p.Character:FindFirstChild("Humanoid")
            local r = p.Character:FindFirstChild("HumanoidRootPart")
            if h and r and h.Health <= 0 then
                local dist = (r.Position - root.Position).Magnitude
                if dist <= 8 then
                    h.Health = h.MaxHealth * 0.3
                    h.WalkSpeed = 16
                    h.JumpPower = 50
                    -- Re-enable joints
                    for _, joint in ipairs(p.Character:GetDescendants()) do
                        if joint:IsA("Motor6D") then
                            joint.Enabled = true
                        end
                    end
                    break
                end
            end
        end
    end
end)

## HUNGER & THIRST SYSTEM
-- ModuleScript "NeedsSystem":
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local HUNGER_DRAIN = 0.5   -- per minute
local THIRST_DRAIN = 0.8   -- per minute
local STARVE_DAMAGE = 2    -- health per tick when starving
local needs = {}

local updateEvent = Instance.new("RemoteEvent")
updateEvent.Name = "NeedsUpdate"
updateEvent.Parent = ReplicatedStorage

Players.PlayerAdded:Connect(function(player)
    needs[player.UserId] = { hunger = 100, thirst = 100 }
    
    -- Drain loop
    task.spawn(function()
        while player.Parent do
            task.wait(60)  -- every minute
            if not needs[player.UserId] then break end
            needs[player.UserId].hunger = math.max(0, needs[player.UserId].hunger - HUNGER_DRAIN)
            needs[player.UserId].thirst = math.max(0, needs[player.UserId].thirst - THIRST_DRAIN)
            
            -- Damage if starving/dehydrated
            local char = player.Character
            if char then
                local h = char:FindFirstChild("Humanoid")
                if h then
                    if needs[player.UserId].hunger <= 0 then h:TakeDamage(STARVE_DAMAGE) end
                    if needs[player.UserId].thirst <= 0 then h:TakeDamage(STARVE_DAMAGE * 1.5) end
                end
            end
            
            -- Send update to client
            updateEvent:FireClient(player, needs[player.UserId])
        end
    end)
end)

-- Eat/drink function (call from food item scripts):
local NeedsSystem = {}
function NeedsSystem.eat(player, amount)
    if needs[player.UserId] then
        needs[player.UserId].hunger = math.min(100, needs[player.UserId].hunger + amount)
        updateEvent:FireClient(player, needs[player.UserId])
    end
end
function NeedsSystem.drink(player, amount)
    if needs[player.UserId] then
        needs[player.UserId].thirst = math.min(100, needs[player.UserId].thirst + amount)
        updateEvent:FireClient(player, needs[player.UserId])
    end
end
return NeedsSystem

## STAMINA SYSTEM
local STAMINA_MAX = 100
local STAMINA_DRAIN = 20   -- per second sprinting
local STAMINA_REGEN = 8    -- per second resting
local SPRINT_SPEED = 24
local WALK_SPEED = 16

-- LocalScript:
local player = game:GetService("Players").LocalPlayer
local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local stamina = STAMINA_MAX
local isSprinting = false

-- Stamina bar UI
local gui = player.PlayerGui:WaitForChild("HUD")  -- assumes HUD exists
local staminaBar = gui:FindFirstChild("StaminaBar", true)

RunService.RenderStepped:Connect(function(dt)
    local char = player.Character
    if not char then return end
    local humanoid = char:FindFirstChild("Humanoid")
    if not humanoid then return end
    
    isSprinting = UIS:IsKeyDown(Enum.KeyCode.LeftShift) and stamina > 0
        and humanoid.MoveDirection.Magnitude > 0
    
    if isSprinting then
        stamina = math.max(0, stamina - STAMINA_DRAIN * dt)
        humanoid.WalkSpeed = SPRINT_SPEED
    else
        stamina = math.min(STAMINA_MAX, stamina + STAMINA_REGEN * dt)
        humanoid.WalkSpeed = WALK_SPEED
    end
    
    if staminaBar then
        staminaBar.Size = UDim2.new(stamina / STAMINA_MAX, 0, 1, 0)
        staminaBar.BackgroundColor3 = stamina < 20 
            and Color3.fromRGB(255, 50, 50) 
            or Color3.fromRGB(50, 200, 255)
    end
end)

## DRUG/ALCOHOL EFFECTS
-- LocalScript (triggered by server RemoteEvent):
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local effectEvent = ReplicatedStorage:WaitForChild("ApplyDrugEffect")

local function applyAlcohol(level)  -- level 1-3
    local blurEffect = Instance.new("BlurEffect")
    blurEffect.Size = level * 8
    blurEffect.Parent = camera
    
    -- Wobbly camera
    local conn
    conn = game:GetService("RunService").RenderStepped:Connect(function(t)
        camera.CFrame = camera.CFrame * CFrame.Angles(
            math.sin(t * 2) * math.rad(level * 0.5),
            math.sin(t * 1.3) * math.rad(level * 0.3),
            0
        )
    end)
    
    -- Slow movement
    local char = player.Character
    if char then
        local h = char:FindFirstChild("Humanoid")
        if h then h.WalkSpeed = math.max(4, 16 - level * 3) end
    end
    
    -- Wear off after time
    task.delay(level * 30, function()
        TweenService:Create(blurEffect, TweenInfo.new(5), {Size = 0}):Play()
        task.wait(5)
        blurEffect:Destroy()
        conn:Disconnect()
        local char2 = player.Character
        if char2 then
            local h = char2:FindFirstChild("Humanoid")
            if h then h.WalkSpeed = 16 end
        end
    end)
end

effectEvent.OnClientEvent:Connect(function(effectType, level)
    if effectType == "alcohol" then applyAlcohol(level) end
end)
`
