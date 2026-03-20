export const UI_SCRIPTING_KNOWLEDGE = `
=== UI & HUD SCRIPTING — SPEEDOMETER, MINIMAP, NOTIFICATIONS, LEADERBOARD, ADMIN ===

## SPEEDOMETER HUD
-- LocalScript (works for any VehicleSeat):
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer

local gui = Instance.new("ScreenGui")
gui.Name = "SpeedometerHUD"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 140, 0, 80)
frame.AnchorPoint = Vector2.new(1, 1)
frame.Position = UDim2.new(1, -20, 1, -20)
frame.BackgroundColor3 = Color3.fromRGB(5, 5, 15)
frame.BackgroundTransparency = 0.2
frame.Visible = false
frame.Parent = gui
Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 14)

local speedLabel = Instance.new("TextLabel")
speedLabel.Size = UDim2.new(1, 0, 0.6, 0)
speedLabel.BackgroundTransparency = 1
speedLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
speedLabel.Font = Enum.Font.GothamBold
speedLabel.TextSize = 32
speedLabel.Text = "0"
speedLabel.Parent = frame

local unitLabel = Instance.new("TextLabel")
unitLabel.Size = UDim2.new(1, 0, 0.3, 0)
unitLabel.Position = UDim2.new(0, 0, 0.65, 0)
unitLabel.BackgroundTransparency = 1
unitLabel.TextColor3 = Color3.fromRGB(150, 150, 180)
unitLabel.Font = Enum.Font.Gotham
unitLabel.TextSize = 12
unitLabel.Text = "KM/H"
unitLabel.Parent = frame

local STUDS_PER_SECOND_TO_KMH = 1.4375
local currentSeat = nil

RunService.RenderStepped:Connect(function()
    local char = player.Character
    if not char then frame.Visible = false return end
    local humanoid = char:FindFirstChild("Humanoid")
    if not humanoid then frame.Visible = false return end
    
    -- Find occupied vehicle seat
    local seat = nil
    for _, obj in ipairs(char:GetDescendants()) do
        if obj:IsA("Weld") and obj.Part1 and obj.Part1:IsA("VehicleSeat") then
            seat = obj.Part1
            break
        end
    end
    
    if seat then
        frame.Visible = true
        local speed = seat.AssemblyLinearVelocity.Magnitude * STUDS_PER_SECOND_TO_KMH
        speedLabel.Text = tostring(math.floor(speed))
        -- Color code by speed
        if speed > 120 then speedLabel.TextColor3 = Color3.fromRGB(255, 50, 50)
        elseif speed > 80 then speedLabel.TextColor3 = Color3.fromRGB(255, 180, 0)
        else speedLabel.TextColor3 = Color3.fromRGB(255, 255, 255) end
    else
        frame.Visible = false
    end
end)

## MINIMAP / RADAR
-- LocalScript:
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer

local MINIMAP_SIZE = 160
local MINIMAP_SCALE = 0.4  -- 1 stud = 0.4 pixels on minimap
local UPDATE_INTERVAL = 0.5

local gui = Instance.new("ScreenGui")
gui.Name = "MinimapHUD"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, MINIMAP_SIZE, 0, MINIMAP_SIZE)
frame.AnchorPoint = Vector2.new(1, 0)
frame.Position = UDim2.new(1, -10, 0, 10)
frame.BackgroundColor3 = Color3.fromRGB(10, 15, 10)
frame.BackgroundTransparency = 0.2
frame.ClipsDescendants = true
frame.Parent = gui
Instance.new("UICorner", frame).CornerRadius = UDim.new(1, 0)

-- Border ring
local border = Instance.new("UIStroke")
border.Color = Color3.fromRGB(60, 80, 60)
border.Thickness = 2
border.Parent = frame

-- Player dot (always center)
local playerDot = Instance.new("Frame")
playerDot.Size = UDim2.new(0, 8, 0, 8)
playerDot.AnchorPoint = Vector2.new(0.5, 0.5)
playerDot.Position = UDim2.new(0.5, 0, 0.5, 0)
playerDot.BackgroundColor3 = Color3.fromRGB(0, 150, 255)
playerDot.ZIndex = 10
playerDot.Parent = frame
Instance.new("UICorner", playerDot).CornerRadius = UDim.new(1, 0)

-- Direction indicator (triangle pointing forward)
local dirArrow = Instance.new("Frame")
dirArrow.Size = UDim2.new(0, 0, 0, 0)  -- use ImageLabel with triangle image
dirArrow.AnchorPoint = Vector2.new(0.5, 0.5)
dirArrow.Position = UDim2.new(0.5, 0, 0.5, -8)
dirArrow.BackgroundColor3 = Color3.fromRGB(0, 200, 255)
dirArrow.Parent = frame

local otherDots = {}

local function getOrCreateDot(p)
    if not otherDots[p] then
        local dot = Instance.new("Frame")
        dot.Size = UDim2.new(0, 6, 0, 6)
        dot.AnchorPoint = Vector2.new(0.5, 0.5)
        dot.BackgroundColor3 = Color3.fromRGB(255, 80, 80)  -- red for others
        dot.ZIndex = 5
        dot.Parent = frame
        Instance.new("UICorner", dot).CornerRadius = UDim.new(1, 0)
        
        local nameTag = Instance.new("TextLabel")
        nameTag.Size = UDim2.new(0, 60, 0, 14)
        nameTag.AnchorPoint = Vector2.new(0.5, 1)
        nameTag.Position = UDim2.new(0.5, 0, 0, -2)
        nameTag.BackgroundTransparency = 1
        nameTag.TextColor3 = Color3.fromRGB(255,255,255)
        nameTag.TextSize = 8
        nameTag.Font = Enum.Font.Gotham
        nameTag.Text = p.Name
        nameTag.Parent = dot
        
        otherDots[p] = dot
    end
    return otherDots[p]
end

local lastUpdate = 0
RunService.RenderStepped:Connect(function()
    local now = tick()
    if now - lastUpdate < UPDATE_INTERVAL then return end
    lastUpdate = now
    
    local myChar = player.Character
    if not myChar then return end
    local myRoot = myChar:FindFirstChild("HumanoidRootPart")
    if not myRoot then return end
    
    local myPos = myRoot.Position
    
    -- Rotate minimap with player
    local yaw = math.atan2(-myRoot.CFrame.LookVector.X, -myRoot.CFrame.LookVector.Z)
    frame.Rotation = math.deg(yaw)
    
    for _, p in ipairs(Players:GetPlayers()) do
        if p ~= player and p.Character then
            local root = p.Character:FindFirstChild("HumanoidRootPart")
            if root then
                local relPos = root.Position - myPos
                local mapX = 0.5 + (relPos.X * MINIMAP_SCALE) / MINIMAP_SIZE
                local mapY = 0.5 + (relPos.Z * MINIMAP_SCALE) / MINIMAP_SIZE
                
                local dot = getOrCreateDot(p)
                dot.Position = UDim2.new(mapX, 0, mapY, 0)
                dot.Visible = (math.abs(mapX - 0.5) < 0.5 and math.abs(mapY - 0.5) < 0.5)
            end
        else
            if otherDots[p] then
                otherDots[p]:Destroy()
                otherDots[p] = nil
            end
        end
    end
end)

## NOTIFICATION SYSTEM — TOAST POPUPS
-- LocalScript (place in StarterPlayerScripts):
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")

local notifyEvent = Instance.new("RemoteEvent")
notifyEvent.Name = "Notification"
notifyEvent.Parent = ReplicatedStorage

local gui = Instance.new("ScreenGui")
gui.Name = "NotificationSystem"
gui.ResetOnSpawn = false
gui.Parent = Players.LocalPlayer.PlayerGui

local container = Instance.new("Frame")
container.Size = UDim2.new(0, 300, 1, 0)
container.AnchorPoint = Vector2.new(1, 0)
container.Position = UDim2.new(1, -10, 0, 10)
container.BackgroundTransparency = 1
container.Parent = gui
local layout = Instance.new("UIListLayout", container)
layout.VerticalAlignment = Enum.VerticalAlignment.Top
layout.Padding = UDim.new(0, 8)

local ICONS = {info="ℹ️", success="✅", warning="⚠️", error="❌", arrest="🚔", fire="🔥", medical="🚑"}
local COLORS = {
    info=Color3.fromRGB(0,100,200),
    success=Color3.fromRGB(0,160,80),
    warning=Color3.fromRGB(200,140,0),
    error=Color3.fromRGB(180,40,40),
    arrest=Color3.fromRGB(0,60,180),
    fire=Color3.fromRGB(200,80,0),
    medical=Color3.fromRGB(200,0,60),
}

local function showNotification(message, notifType, duration)
    notifType = notifType or "info"
    duration = duration or 4
    
    local card = Instance.new("Frame")
    card.Size = UDim2.new(1, 0, 0, 60)
    card.BackgroundColor3 = COLORS[notifType] or COLORS.info
    card.BackgroundTransparency = 0.15
    card.Parent = container
    Instance.new("UICorner", card).CornerRadius = UDim.new(0, 10)
    
    local icon = Instance.new("TextLabel")
    icon.Size = UDim2.new(0, 40, 1, 0)
    icon.BackgroundTransparency = 1
    icon.TextSize = 20
    icon.Text = ICONS[notifType] or ICONS.info
    icon.Parent = card
    
    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, -50, 1, 0)
    label.Position = UDim2.new(0, 45, 0, 0)
    label.BackgroundTransparency = 1
    label.TextColor3 = Color3.fromRGB(255,255,255)
    label.Font = Enum.Font.Gotham
    label.TextSize = 13
    label.TextXAlignment = Enum.TextXAlignment.Left
    label.TextWrapped = true
    label.Text = message
    label.Parent = card
    
    -- Slide in
    card.Position = UDim2.new(1.1, 0, 0, 0)
    TweenService:Create(card, TweenInfo.new(0.3, Enum.EasingStyle.Back), 
        {Position = UDim2.new(0, 0, 0, 0)}):Play()
    
    -- Slide out after duration
    task.delay(duration, function()
        TweenService:Create(card, TweenInfo.new(0.3), 
            {Position = UDim2.new(1.1, 0, 0, 0)}):Play()
        task.wait(0.3)
        card:Destroy()
    end)
end

notifyEvent.OnClientEvent:Connect(showNotification)

-- Server can call: notifyEvent:FireClient(player, "You've been arrested!", "arrest", 5)
-- Or all: notifyEvent:FireAllClients("Building on fire!", "fire", 6)

## COMPASS HUD
-- LocalScript:
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer

local gui = Instance.new("ScreenGui")
gui.Name = "CompassHUD"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 200, 0, 36)
frame.AnchorPoint = Vector2.new(0.5, 0)
frame.Position = UDim2.new(0.5, 0, 0, 8)
frame.BackgroundColor3 = Color3.fromRGB(5, 5, 15)
frame.BackgroundTransparency = 0.3
frame.ClipsDescendants = true
frame.Parent = gui
Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 8)

local compassLabel = Instance.new("TextLabel")
compassLabel.Size = UDim2.new(1, 0, 1, 0)
compassLabel.BackgroundTransparency = 1
compassLabel.TextColor3 = Color3.fromRGB(200, 200, 220)
compassLabel.Font = Enum.Font.GothamBold
compassLabel.TextSize = 14
compassLabel.Text = "N"
compassLabel.Parent = frame

local DIRECTIONS = {"N","NE","E","SE","S","SW","W","NW","N"}

RunService.RenderStepped:Connect(function()
    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end
    local yaw = math.deg(math.atan2(-root.CFrame.LookVector.X, -root.CFrame.LookVector.Z))
    if yaw < 0 then yaw = yaw + 360 end
    local idx = math.floor((yaw + 22.5) / 45) % 8 + 1
    compassLabel.Text = DIRECTIONS[idx] .. "  " .. math.floor(yaw) .. "°"
end)

## IN-GAME ADMIN PANEL
-- LocalScript — only shown to admins:
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local UIS = game:GetService("UserInputService")
local player = Players.LocalPlayer
local adminEvent = ReplicatedStorage:WaitForChild("AdminAction")

local ADMIN_IDS = {123456789}  -- Add admin UserIds here
local isAdmin = table.find(ADMIN_IDS, player.UserId) ~= nil
if not isAdmin then return end

local gui = Instance.new("ScreenGui")
gui.Name = "AdminPanel"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui
gui.Enabled = false

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 420, 0, 520)
frame.AnchorPoint = Vector2.new(0.5, 0.5)
frame.Position = UDim2.new(0.5, 0, 0.5, 0)
frame.BackgroundColor3 = Color3.fromRGB(8, 8, 18)
frame.BackgroundTransparency = 0.05
frame.Parent = gui
Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 16)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 48)
title.BackgroundColor3 = Color3.fromRGB(0, 60, 180)
title.TextColor3 = Color3.fromRGB(255,255,255)
title.Font = Enum.Font.GothamBold
title.TextSize = 18
title.Text = "⚙️ ADMIN PANEL"
title.Parent = frame

-- Player list
local playerList = Instance.new("ScrollingFrame")
playerList.Size = UDim2.new(0.45, -5, 1, -100)
playerList.Position = UDim2.new(0, 5, 0, 54)
playerList.BackgroundColor3 = Color3.fromRGB(15, 15, 28)
playerList.BackgroundTransparency = 0.3
playerList.ScrollBarThickness = 3
playerList.Parent = frame
Instance.new("UIListLayout", playerList).Padding = UDim.new(0, 4)

-- Actions panel
local actionsFrame = Instance.new("Frame")
actionsFrame.Size = UDim2.new(0.55, -10, 1, -100)
actionsFrame.Position = UDim2.new(0.45, 5, 0, 54)
actionsFrame.BackgroundTransparency = 1
actionsFrame.Parent = frame

local selectedPlayer = nil

local ACTIONS = {
    {text="🚫 Kick",     color=Color3.fromRGB(180,80,0),   action="kick"},
    {text="🔨 Ban",      color=Color3.fromRGB(180,0,0),    action="ban"},
    {text="✈️ Teleport", color=Color3.fromRGB(0,120,200),  action="tp"},
    {text="👁 Spectate", color=Color3.fromRGB(0,150,100),  action="spectate"},
    {text="⚡ Speed×2",  color=Color3.fromRGB(150,0,200),  action="speed"},
    {text="💀 Kill",     color=Color3.fromRGB(120,0,0),    action="kill"},
    {text="🧹 Clear",    color=Color3.fromRGB(60,60,60),   action="clearinv"},
    {text="💰 Give $500",color=Color3.fromRGB(0,140,60),   action="givemoney"},
}

for i, a in ipairs(ACTIONS) do
    local btn = Instance.new("TextButton")
    btn.Size = UDim2.new(1, -10, 0, 38)
    btn.Position = UDim2.new(0, 5, 0, (i-1)*44)
    btn.BackgroundColor3 = a.color
    btn.BackgroundTransparency = 0.3
    btn.TextColor3 = Color3.fromRGB(255,255,255)
    btn.Font = Enum.Font.GothamBold
    btn.TextSize = 13
    btn.Text = a.text
    btn.Parent = actionsFrame
    Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 8)
    btn.MouseButton1Click:Connect(function()
        if selectedPlayer then
            adminEvent:FireServer(a.action, selectedPlayer)
        end
    end)
end

-- Refresh player list
local function refreshPlayers()
    for _, c in ipairs(playerList:GetChildren()) do
        if not c:IsA("UIListLayout") then c:Destroy() end
    end
    for _, p in ipairs(Players:GetPlayers()) do
        local btn = Instance.new("TextButton")
        btn.Size = UDim2.new(1, -4, 0, 36)
        btn.BackgroundColor3 = selectedPlayer == p 
            and Color3.fromRGB(0,60,150) or Color3.fromRGB(25,25,40)
        btn.TextColor3 = Color3.fromRGB(220,220,220)
        btn.Font = Enum.Font.Gotham
        btn.TextSize = 13
        btn.Text = p.Name
        btn.Parent = playerList
        Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 6)
        btn.MouseButton1Click:Connect(function()
            selectedPlayer = p
            refreshPlayers()
        end)
    end
end

-- Toggle with F9
UIS.InputBegan:Connect(function(input, processed)
    if input.KeyCode == Enum.KeyCode.F9 then
        gui.Enabled = not gui.Enabled
        if gui.Enabled then refreshPlayers() end
    end
end)

-- Server admin actions:
adminEvent.OnServerEvent:Connect(function(admin, action, target)
    -- Verify admin
    if not table.find(ADMIN_IDS, admin.UserId) then return end
    if not target then return end
    
    if action == "kick" then target:Kick("Kicked by admin") 
    elseif action == "kill" then
        if target.Character and target.Character:FindFirstChild("Humanoid") then
            target.Character.Humanoid.Health = 0
        end
    elseif action == "tp" then
        if admin.Character and target.Character then
            target.Character:FindFirstChild("HumanoidRootPart").CFrame = 
                admin.Character.HumanoidRootPart.CFrame * CFrame.new(3,0,0)
        end
    elseif action == "speed" then
        if target.Character and target.Character:FindFirstChild("Humanoid") then
            target.Character.Humanoid.WalkSpeed = 32
        end
    elseif action == "givemoney" then
        local Economy = require(game.ServerScriptService.EconomySystem)
        Economy.giveMoney(target, 500)
    end
end)

## LOADING SCREEN
-- LocalScript in ReplicatedFirst:
local ReplicatedFirst = game:GetService("ReplicatedFirst")
ReplicatedFirst:RemoveDefaultLoadingScreen()

local gui = Instance.new("ScreenGui")
gui.Name = "LoadingScreen"
gui.IgnoreGuiInset = true
gui.Parent = game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui")

local bg = Instance.new("Frame")
bg.Size = UDim2.new(1, 0, 1, 0)
bg.BackgroundColor3 = Color3.fromRGB(5, 5, 15)
bg.Parent = gui

local logo = Instance.new("TextLabel")
logo.Size = UDim2.new(0, 400, 0, 80)
logo.AnchorPoint = Vector2.new(0.5, 0.5)
logo.Position = UDim2.new(0.5, 0, 0.4, 0)
logo.BackgroundTransparency = 1
logo.TextColor3 = Color3.fromRGB(255, 255, 255)
logo.Font = Enum.Font.GothamBold
logo.TextSize = 48
logo.Text = "YOUR GAME NAME"
logo.Parent = bg

local bar = Instance.new("Frame")
bar.Size = UDim2.new(0.4, 0, 0, 4)
bar.AnchorPoint = Vector2.new(0.5, 0.5)
bar.Position = UDim2.new(0.5, 0, 0.6, 0)
bar.BackgroundColor3 = Color3.fromRGB(30, 30, 50)
bar.Parent = bg
Instance.new("UICorner", bar)

local fill = Instance.new("Frame")
fill.Size = UDim2.new(0, 0, 1, 0)
fill.BackgroundColor3 = Color3.fromRGB(0, 120, 255)
fill.Parent = bar
Instance.new("UICorner", fill)

-- Animate loading bar
game:GetService("TweenService"):Create(fill, TweenInfo.new(
    game:GetService("ContentProvider"):GetRequestQueueSize() > 0 and 3 or 1
), {Size = UDim2.new(1, 0, 1, 0)}):Play()

game.Loaded:Connect(function()
    game:GetService("TweenService"):Create(bg, TweenInfo.new(0.8), 
        {BackgroundTransparency = 1}):Play()
    task.wait(0.8)
    gui:Destroy()
end)
`
