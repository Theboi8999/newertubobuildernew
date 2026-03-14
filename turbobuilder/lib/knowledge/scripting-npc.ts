export const NPC_SCRIPTING_KNOWLEDGE = `
=== NPC SCRIPTING — CIVILIANS, CRIMINALS, TRAFFIC, SHOPKEEPERS, CROWDS ===

## NPC CIVILIAN — WANDER, FLEE FROM GUNSHOTS
-- Script inside NPC Model:
local PathfindingService = game:GetService("PathfindingService")
local RunService = game:GetService("RunService")
local humanoid = script.Parent:FindFirstChild("Humanoid")
local root = script.Parent:FindFirstChild("HumanoidRootPart")

local WANDER_RADIUS = 40
local FLEE_SPEED = 18
local NORMAL_SPEED = 8
local FLEE_DURATION = 10
local spawnPos = root.Position

local isFleeing = false
local fleePath = nil

-- Random idle animations (sit, look around)
local function playIdleAnim()
    task.wait(math.random(3, 8))
    -- Face random direction
    local randomAngle = math.random(0, 360)
    root.CFrame = CFrame.new(root.Position) * CFrame.Angles(0, math.rad(randomAngle), 0)
end

-- Wander to random point near spawn
local function wander()
    if isFleeing then return end
    local target = spawnPos + Vector3.new(
        math.random(-WANDER_RADIUS, WANDER_RADIUS),
        0,
        math.random(-WANDER_RADIUS, WANDER_RADIUS)
    )
    local path = PathfindingService:CreatePath({
        AgentHeight = 5, AgentRadius = 2, AgentCanJump = true
    })
    local success = pcall(function() path:ComputeAsync(root.Position, target) end)
    if success and path.Status == Enum.PathStatus.Success then
        for _, wp in ipairs(path:GetWaypoints()) do
            if isFleeing then break end
            humanoid:MoveTo(wp.Position)
            humanoid.MoveToFinished:Wait()
        end
    end
end

-- Flee from a position
local function fleeFrom(dangerPos)
    isFleeing = true
    humanoid.WalkSpeed = FLEE_SPEED
    
    -- Run away from danger
    local fleeDirection = (root.Position - dangerPos).Unit
    local fleeTarget = root.Position + fleeDirection * 60
    
    humanoid:MoveTo(fleeTarget)
    
    -- Play panic animation (wave arms etc via AnimationController)
    
    task.wait(FLEE_DURATION)
    isFleeing = false
    humanoid.WalkSpeed = NORMAL_SPEED
end

-- Listen for gunshots (Sound named "Gunshot" played near NPC)
local function checkForDanger()
    while true do
        task.wait(1)
        for _, sound in ipairs(workspace:GetDescendants()) do
            if sound:IsA("Sound") and sound.Name == "GunfireAlert" and sound.IsPlaying then
                local soundPart = sound.Parent
                if soundPart:IsA("BasePart") then
                    local dist = (soundPart.Position - root.Position).Magnitude
                    if dist < 60 and not isFleeing then
                        task.spawn(function() fleeFrom(soundPart.Position) end)
                    end
                end
            end
        end
    end
end

task.spawn(checkForDanger)

-- Main wander loop
while true do
    wander()
    task.wait(math.random(2, 5))
end

## NPC CRIMINAL — FLEE FROM POLICE, USE COVER
-- Script inside Criminal NPC:
local PathfindingService = game:GetService("PathfindingService")
local Players = game:GetService("Players")
local humanoid = script.Parent:FindFirstChild("Humanoid")
local root = script.Parent:FindFirstChild("HumanoidRootPart")

local DETECTION_RANGE = 50
local FLEE_SPEED = 20
local HIDE_RANGE = 8

humanoid.WalkSpeed = FLEE_SPEED

local function isPolice(player)
    local jobSystem = require(game.ServerScriptService:FindFirstChild("JobSystem"))
    if jobSystem then
        return jobSystem.getJob(player) == "Police Officer" or 
               jobSystem.getJob(player) == "Detective"
    end
    return false
end

local function findCover()
    -- Find large parts to hide behind
    local coverParts = {}
    for _, obj in ipairs(workspace:GetDescendants()) do
        if obj:IsA("BasePart") and not obj:IsDescendantOf(script.Parent) then
            if obj.Size.X > 3 or obj.Size.Z > 3 then
                local dist = (obj.Position - root.Position).Magnitude
                if dist < 30 then
                    table.insert(coverParts, obj)
                end
            end
        end
    end
    if #coverParts > 0 then
        return coverParts[math.random(1, #coverParts)].Position
    end
    return nil
end

while true do
    task.wait(0.5)
    local nearestCop, nearestDist = nil, DETECTION_RANGE
    
    for _, p in ipairs(Players:GetPlayers()) do
        if isPolice(p) and p.Character then
            local pRoot = p.Character:FindFirstChild("HumanoidRootPart")
            if pRoot then
                local dist = (pRoot.Position - root.Position).Magnitude
                if dist < nearestDist then
                    nearestCop = p
                    nearestDist = dist
                end
            end
        end
    end
    
    if nearestCop and nearestCop.Character then
        local copRoot = nearestCop.Character:FindFirstChild("HumanoidRootPart")
        -- Try to find cover first
        local coverPos = findCover()
        if coverPos and (coverPos - root.Position).Magnitude < 20 then
            humanoid:MoveTo(coverPos)
        else
            -- Flee away from cop
            local fleeDir = (root.Position - copRoot.Position).Unit
            humanoid:MoveTo(root.Position + fleeDir * 30)
        end
    end
end

## NPC TRAFFIC — DRIVE ON ROADS VIA WAYPOINTS
-- Script inside traffic vehicle Model:
local RunService = game:GetService("RunService")
local model = script.Parent
local body = model:FindFirstChild("Body") or model:FindFirstChild("Hull")
local TRAFFIC_SPEED = 25
local STOP_DISTANCE = 15  -- stop if obstacle within this distance

-- Collect road waypoints tagged "TrafficWaypoint"
local waypoints = {}
local tagged = game:GetService("CollectionService"):GetTagged("TrafficWaypoint")
-- Sort by Name (TrafficWaypoint_1, _2 etc.)
table.sort(tagged, function(a, b) 
    local aNum = tonumber(a.Name:match("%d+")) or 0
    local bNum = tonumber(b.Name:match("%d+")) or 0
    return aNum < bNum
end)
waypoints = tagged

if #waypoints == 0 then return end

-- Start at random waypoint
local currentWP = math.random(1, #waypoints)

local bv = Instance.new("BodyVelocity")
bv.MaxForce = Vector3.new(1e6, 0, 1e6)
bv.Parent = body

local bg = Instance.new("BodyGyro")
bg.MaxTorque = Vector3.new(0, 1e6, 0)
bg.D = 150
bg.P = 2000
bg.Parent = body

local stopped = false

RunService.Heartbeat:Connect(function(dt)
    local target = waypoints[currentWP]
    if not target then return end
    
    -- Check for obstacles (other vehicles, players)
    local rayResult = workspace:Raycast(
        body.Position + Vector3.new(0, 1, 0),
        body.CFrame.LookVector * STOP_DISTANCE,
        RaycastParams.new()
    )
    
    stopped = rayResult ~= nil and rayResult.Instance ~= body
    
    if stopped then
        bv.Velocity = Vector3.new(0, 0, 0)
        return
    end
    
    local dist = (target.Position - body.Position).Magnitude
    if dist < 8 then
        currentWP = (currentWP % #waypoints) + 1
    end
    
    local dir = (target.Position - body.Position)
    dir = Vector3.new(dir.X, 0, dir.Z).Unit
    bv.Velocity = dir * TRAFFIC_SPEED
    bg.CFrame = CFrame.new(Vector3.new(), dir)
end)

## NPC SHOPKEEPER — GREET AND OPEN SHOP
local npc = script.Parent
local humanoid = npc:FindFirstChild("Humanoid")
local root = npc:FindFirstChild("HumanoidRootPart")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GREET_RANGE = 12
local greeted = {}
local shopEvent = ReplicatedStorage:WaitForChild("ShopAction")

-- Billboard name tag
local billboard = Instance.new("BillboardGui")
billboard.Size = UDim2.new(0, 160, 0, 40)
billboard.StudsOffset = Vector3.new(0, 3, 0)
billboard.AlwaysOnTop = false
billboard.Parent = root

local nameLabel = Instance.new("TextLabel")
nameLabel.Size = UDim2.new(1, 0, 1, 0)
nameLabel.BackgroundTransparency = 1
nameLabel.TextColor3 = Color3.fromRGB(255, 255, 200)
nameLabel.Font = Enum.Font.GothamBold
nameLabel.TextSize = 14
nameLabel.Text = npc.Name .. "\n[Click to Shop]"
nameLabel.Parent = billboard

-- Face nearest player and greet them
local function facePlayer(player)
    if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
        local targetPos = player.Character.HumanoidRootPart.Position
        root.CFrame = CFrame.new(root.Position, Vector3.new(targetPos.X, root.Position.Y, targetPos.Z))
    end
end

-- Click to open shop
local cd = Instance.new("ClickDetector")
cd.MaxActivationDistance = GREET_RANGE
cd.Parent = root

cd.MouseClick:Connect(function(player)
    facePlayer(player)
    shopEvent:FireClient(player, "open", {
        {name="Item 1", price=50, toolId="Item1"},
        {name="Item 2", price=100, toolId="Item2"},
    })
end)

-- Idle greet animation
game:GetService("RunService").Heartbeat:Connect(function()
    for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
        if p.Character then
            local pRoot = p.Character:FindFirstChild("HumanoidRootPart")
            if pRoot then
                local dist = (pRoot.Position - root.Position).Magnitude
                if dist < GREET_RANGE and not greeted[p] then
                    greeted[p] = true
                    facePlayer(p)
                    -- Play wave animation here
                    task.delay(10, function() greeted[p] = nil end)
                end
            end
        end
    end
end)

## NPC CROWD — DISPERSE WHEN ALARMED
-- Script managing a group of civilian NPCs:
local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local alarmEvent = ReplicatedStorage:WaitForChild("AlarmAlert")

alarmEvent.OnServerEvent:Connect(function(player, location)
    -- Tell all civilian NPCs near alarm to flee
    for _, npc in ipairs(CollectionService:GetTagged("Civilian_NPC")) do
        local root = npc:FindFirstChild("HumanoidRootPart")
        local humanoid = npc:FindFirstChild("Humanoid")
        if root and humanoid then
            local dist = (root.Position - workspace[location].Position).Magnitude
            if dist < 80 then
                -- Each NPC flees in slightly different direction
                humanoid.WalkSpeed = 18
                local angle = math.random(0, 360)
                local fleeDir = Vector3.new(math.cos(math.rad(angle)), 0, math.sin(math.rad(angle)))
                humanoid:MoveTo(root.Position + fleeDir * 50)
                task.delay(15, function()
                    humanoid.WalkSpeed = 8
                end)
            end
        end
    end
end)
`
