export const ADVANCED_SYSTEM_KNOWLEDGE = `
=== ADVANCED SYSTEMS — DATASTORE, PROFILESERVICE, RAGDOLL, ANTI-CHEAT, TEAMS ===

## PROFILESERVICE PATTERN (Industry standard data saving)
-- ModuleScript "PlayerDataManager" in ServerScriptService:
-- Uses ProfileService by loleris (most popular data saving solution in top RP servers)
-- Install via: require(game:GetService("ReplicatedStorage"):WaitForChild("ProfileService"))

local ProfileService = require(game.ServerScriptService.ProfileService)
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local PROFILE_TEMPLATE = {
    money = 500,
    job = "Civilian",
    inventory = {},
    hunger = 100,
    thirst = 100,
    playtime = 0,
    arrests = 0,
    deaths = 0,
    rank = 1,
    xp = 0,
    banned = false,
    banReason = "",
}

local ProfileStore = ProfileService.GetProfileStore("PlayerData_v1", PROFILE_TEMPLATE)
local Profiles = {}

local dataEvent = Instance.new("RemoteEvent")
dataEvent.Name = "PlayerDataSync"
dataEvent.Parent = ReplicatedStorage

local function onPlayerAdded(player)
    local profile = ProfileStore:LoadProfileAsync("Player_"..player.UserId)
    if profile then
        profile:AddUserId(player.UserId)
        profile:Reconcile()
        
        profile:ListenToRelease(function()
            Profiles[player.UserId] = nil
            player:Kick("Data released. Rejoin to play.")
        end)
        
        if player.Parent == Players then
            Profiles[player.UserId] = profile
            -- Send initial data to client
            dataEvent:FireClient(player, profile.Data)
        else
            profile:Release()
        end
    else
        player:Kick("Failed to load data. Please rejoin.")
    end
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(function(player)
    local profile = Profiles[player.UserId]
    if profile then profile:Release() end
end)

-- Get/Set functions
local PlayerData = {}

function PlayerData.get(player)
    local profile = Profiles[player.UserId]
    return profile and profile.Data or nil
end

function PlayerData.set(player, key, value)
    local profile = Profiles[player.UserId]
    if profile then
        profile.Data[key] = value
        dataEvent:FireClient(player, profile.Data)
    end
end

function PlayerData.increment(player, key, amount)
    local profile = Profiles[player.UserId]
    if profile and type(profile.Data[key]) == "number" then
        profile.Data[key] = profile.Data[key] + (amount or 1)
        dataEvent:FireClient(player, profile.Data)
    end
end

return PlayerData

## RAGDOLL SYSTEM
-- ModuleScript "RagdollSystem":
local RagdollSystem = {}

function RagdollSystem.ragdoll(character)
    local humanoid = character:FindFirstChild("Humanoid")
    if not humanoid then return end
    humanoid.PlatformStand = true
    
    for _, joint in ipairs(character:GetDescendants()) do
        if joint:IsA("Motor6D") then
            local socket = Instance.new("BallSocketConstraint")
            local a0 = Instance.new("Attachment")
            local a1 = Instance.new("Attachment")
            a0.CFrame = joint.C0
            a1.CFrame = joint.C1
            a0.Parent = joint.Part0
            a1.Parent = joint.Part1
            socket.Attachment0 = a0
            socket.Attachment1 = a1
            socket.LimitsEnabled = true
            socket.TwistLimitsEnabled = true
            socket.Parent = joint.Part0
            joint.Enabled = false
        end
    end
    
    -- Make each limb physical
    for _, part in ipairs(character:GetDescendants()) do
        if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
            part.CanCollide = true
        end
    end
end

function RagdollSystem.unragdoll(character)
    local humanoid = character:FindFirstChild("Humanoid")
    if not humanoid then return end
    
    for _, joint in ipairs(character:GetDescendants()) do
        if joint:IsA("Motor6D") then
            joint.Enabled = true
        end
        if joint:IsA("BallSocketConstraint") then
            joint:Destroy()
        end
        if joint:IsA("Attachment") and joint.Name == "" then
            joint:Destroy()
        end
    end
    humanoid.PlatformStand = false
end

return RagdollSystem

## ANTI-CHEAT PATTERNS (Server-side validation)
-- ALL of these checks go in server Scripts — never trust client:

-- 1. Speed check: reject movement if player moved too far too fast
local lastPositions = {}
local MAX_SPEED_STUDS = 100  -- per second, generous for vehicles

game:GetService("Players").PlayerAdded:Connect(function(player)
    game:GetService("RunService").Heartbeat:Connect(function(dt)
        local char = player.Character
        if not char then return end
        local root = char:FindFirstChild("HumanoidRootPart")
        if not root then return end
        
        local last = lastPositions[player.UserId]
        if last then
            local dist = (root.Position - last.pos).Magnitude
            local elapsed = tick() - last.time
            local speed = dist / elapsed
            if speed > MAX_SPEED_STUDS and elapsed > 0.5 then
                -- Teleport back (light touch, not kick)
                root.CFrame = CFrame.new(last.pos)
            end
        end
        lastPositions[player.UserId] = {pos = root.Position, time = tick()}
    end)
end)

-- 2. RemoteEvent sanity checks (add to ALL OnServerEvent handlers):
local function validatePlayer(player, target)
    -- Target must exist
    if not target then return false end
    -- Target must be in workspace (not already dead/removed)
    if not target:IsDescendantOf(workspace) then return false end
    -- Distance check
    if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
        local targetPos = target.Position or (target:FindFirstChild("HumanoidRootPart") 
            and target.HumanoidRootPart.Position)
        if targetPos then
            local dist = (player.Character.HumanoidRootPart.Position - targetPos).Magnitude
            if dist > 200 then return false end  -- too far away to interact
        end
    end
    return true
end

-- 3. Rate limiting RemoteEvents:
local rateLimits = {}  -- [userId_eventName] = lastCallTime

local function checkRateLimit(player, eventName, minInterval)
    local key = player.UserId .. "_" .. eventName
    local last = rateLimits[key] or 0
    if tick() - last < minInterval then return false end
    rateLimits[key] = tick()
    return true
end

-- Usage: if not checkRateLimit(player, "FireGun", 0.1) then return end

-- 4. Damage validation:
local function validateDamage(attacker, victim, damage)
    if damage <= 0 or damage > 500 then return false end  -- impossible damage
    if not victim:IsA("Humanoid") then return false end
    if victim.Health <= 0 then return false end  -- already dead
    -- Check attacker isn't too far from victim
    local aChar = attacker.Character
    local vChar = victim.Parent
    if aChar and vChar then
        local aRoot = aChar:FindFirstChild("HumanoidRootPart")
        local vRoot = vChar:FindFirstChild("HumanoidRootPart")
        if aRoot and vRoot then
            if (aRoot.Position - vRoot.Position).Magnitude > 600 then
                return false  -- beyond max weapon range
            end
        end
    end
    return true
end

## TEAM SYSTEM
-- Script in ServerScriptService:
local Teams = game:GetService("Teams")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Create teams
local teamData = {
    {name="Civilian",          color=BrickColor.new("Medium stone grey"), spawnName="CivilianSpawn"},
    {name="Police",            color=BrickColor.new("Bright blue"),       spawnName="PoliceSpawn"},
    {name="Fire Brigade",      color=BrickColor.new("Bright red"),        spawnName="FireSpawn"},
    {name="Paramedics",        color=BrickColor.new("Bright yellow"),     spawnName="MedSpawn"},
    {name="Government",        color=BrickColor.new("Reddish brown"),     spawnName="GovSpawn"},
    {name="Criminal",          color=BrickColor.new("Black"),             spawnName="CriminalSpawn"},
}

local teamObjects = {}
for _, td in ipairs(teamData) do
    local team = Instance.new("Team")
    team.Name = td.name
    team.TeamColor = td.color
    team.AutoAssignable = false
    team.Parent = Teams
    teamObjects[td.name] = team
end

local teamEvent = Instance.new("RemoteEvent")
teamEvent.Name = "TeamChange"
teamEvent.Parent = ReplicatedStorage

teamEvent.OnServerEvent:Connect(function(player, teamName)
    local team = teamObjects[teamName]
    if not team then return end
    
    -- Check job whitelist
    local JobSystem = require(game.ServerScriptService.JobSystem)
    if not JobSystem.hasJob(player, teamName) and teamName ~= "Civilian" then
        teamEvent:FireClient(player, "denied", "You are not whitelisted for " .. teamName)
        return
    end
    
    player.Team = team
    JobSystem.setJob(player, teamName)
    
    -- Respawn at team spawn
    local spawn = workspace:FindFirstChild(team.Name .. "Spawn")
    if spawn and player.Character then
        player.Character:FindFirstChild("HumanoidRootPart").CFrame = 
            spawn.CFrame + Vector3.new(0, 3, 0)
    end
    
    teamEvent:FireClient(player, "joined", teamName)
end)

-- Friendly fire prevention
game:GetService("RunService").Heartbeat:Connect(function()
    -- Handled in damage scripts by checking player.Team ~= victim team
end)

## CUTSCENE SYSTEM
-- LocalScript:
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local camera = workspace.CurrentCamera
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local cutsceneEvent = ReplicatedStorage:WaitForChild("PlayCutscene")

local function playCutscene(scenes)
    camera.CameraType = Enum.CameraType.Scriptable
    
    -- Disable player controls
    local humanoid = player.Character and player.Character:FindFirstChild("Humanoid")
    if humanoid then humanoid.WalkSpeed = 0; humanoid.JumpPower = 0 end
    
    for _, scene in ipairs(scenes) do
        -- scene = {startCFrame, endCFrame, duration, text}
        camera.CFrame = scene.startCFrame
        
        -- Show subtitle
        if scene.text then
            local gui = player.PlayerGui:WaitForChild("HUD")
            local subtitle = gui:FindFirstChild("CutsceneSubtitle")
            if subtitle then
                subtitle.Text = scene.text
                subtitle.Visible = true
            end
        end
        
        TweenService:Create(camera, TweenInfo.new(scene.duration, Enum.EasingStyle.Quad), {
            CFrame = scene.endCFrame
        }):Play()
        task.wait(scene.duration)
    end
    
    -- Restore control
    camera.CameraType = Enum.CameraType.Custom
    if humanoid then humanoid.WalkSpeed = 16; humanoid.JumpPower = 50 end
end

cutsceneEvent.OnClientEvent:Connect(function(scenes) playCutscene(scenes) end)

-- Server triggers cutscene:
-- cutsceneEvent:FireClient(player, {
--   {startCFrame = CFrame.new(0,10,0), endCFrame = CFrame.new(0,10,20), duration = 3, text = "Welcome to the city..."},
--   {startCFrame = CFrame.new(0,10,20), endCFrame = CFrame.new(50,5,20), duration = 4, text = "The city never sleeps."},
-- })
`
