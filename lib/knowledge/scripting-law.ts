export const LAW_SCRIPTING_KNOWLEDGE = `
=== LAW ENFORCEMENT SCRIPTING — RADIO, BOOKING, WANTED, EVIDENCE, CAD ===

## RADIO SYSTEM — PUSH TO TALK, CHANNELS, RANGE
-- LocalScript:
local Players = game:GetService("Players")
local UIS = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local player = Players.LocalPlayer

local radioEvent = ReplicatedStorage:WaitForChild("RadioTransmit")
local RADIO_RANGE = 200  -- studs, 0 = global
local currentChannel = 1

-- Radio GUI
local gui = player.PlayerGui
local radioFrame = Instance.new("ScreenGui")
radioFrame.Name = "RadioHUD"
radioFrame.Parent = gui

local channelLabel = Instance.new("TextLabel")
channelLabel.Size = UDim2.new(0, 160, 0, 36)
channelLabel.Position = UDim2.new(0, 10, 0.5, -18)
channelLabel.BackgroundColor3 = Color3.fromRGB(10, 30, 10)
channelLabel.BackgroundTransparency = 0.3
channelLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
channelLabel.Font = Enum.Font.GothamBold
channelLabel.TextSize = 14
channelLabel.Text = "📻 CH " .. currentChannel .. " — READY"
channelLabel.Parent = radioFrame
Instance.new("UICorner", channelLabel).CornerRadius = UDim.new(0, 8)

local isTalking = false

UIS.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.CapsLock and not isTalking then
        isTalking = true
        channelLabel.Text = "📻 CH " .. currentChannel .. " — TRANSMITTING"
        channelLabel.BackgroundColor3 = Color3.fromRGB(0, 60, 0)
        radioEvent:FireServer("start", currentChannel)
    end
    -- Change channel with number keys
    for i = 1, 9 do
        if input.KeyCode == Enum.KeyCode["Alpha"..i] then
            currentChannel = i
            channelLabel.Text = "📻 CH " .. currentChannel .. " — READY"
        end
    end
end)

UIS.InputEnded:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.CapsLock and isTalking then
        isTalking = false
        channelLabel.Text = "📻 CH " .. currentChannel .. " — READY"
        channelLabel.BackgroundColor3 = Color3.fromRGB(10, 30, 10)
        radioEvent:FireServer("stop", currentChannel)
    end
end)

-- Server radio handler:
local radioEvent = Instance.new("RemoteEvent")
radioEvent.Name = "RadioTransmit"
radioEvent.Parent = ReplicatedStorage

radioEvent.OnServerEvent:Connect(function(sender, action, channel)
    local senderChar = sender.Character
    if not senderChar then return end
    local senderRoot = senderChar:FindFirstChild("HumanoidRootPart")
    if not senderRoot then return end
    
    -- Relay to all players on same channel within range
    for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
        if p ~= sender and p.Character then
            local pRoot = p.Character:FindFirstChild("HumanoidRootPart")
            if pRoot then
                local dist = (pRoot.Position - senderRoot.Position).Magnitude
                if RADIO_RANGE == 0 or dist <= RADIO_RANGE then
                    radioEvent:FireClient(p, action, channel, sender.Name)
                end
            end
        end
    end
end)

## WANTED LEVEL SYSTEM
-- Script in ServerScriptService:
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local wantedEvent = Instance.new("RemoteEvent")
wantedEvent.Name = "WantedUpdate"
wantedEvent.Parent = ReplicatedStorage

local wantedLevels = {}  -- [userId] = 0-5
local wantedTimers = {}  -- [userId] = time remaining

local LEVEL_DECAY_TIME = {60, 90, 120, 180, 300}  -- seconds per level

local function setWanted(player, level)
    local userId = player.UserId
    wantedLevels[userId] = math.clamp(level, 0, 5)
    wantedTimers[userId] = LEVEL_DECAY_TIME[level] or 0
    
    -- Notify all police
    for _, p in ipairs(Players:GetPlayers()) do
        wantedEvent:FireClient(p, player.Name, wantedLevels[userId])
    end
end

local function increaseWanted(player, amount)
    local current = wantedLevels[player.UserId] or 0
    setWanted(player, current + (amount or 1))
end

-- Decay over time
game:GetService("RunService").Heartbeat:Connect(function(dt)
    for userId, timer in pairs(wantedTimers) do
        if wantedLevels[userId] and wantedLevels[userId] > 0 then
            wantedTimers[userId] = timer - dt
            if wantedTimers[userId] <= 0 then
                wantedLevels[userId] = wantedLevels[userId] - 1
                wantedTimers[userId] = LEVEL_DECAY_TIME[wantedLevels[userId]] or 0
                local p = Players:GetPlayerByUserId(userId)
                if p then
                    for _, officer in ipairs(Players:GetPlayers()) do
                        wantedEvent:FireClient(officer, p.Name, wantedLevels[userId])
                    end
                end
            end
        end
    end
end)

return { setWanted = setWanted, increaseWanted = increaseWanted }

## BOOKING SYSTEM — CHARGE SUSPECTS, PRINT CHARGE SHEET
-- Script handles booking via GUI:
local DataStoreService = game:GetService("DataStoreService")
local bookingStore = DataStoreService:GetDataStore("BookingRecords")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local bookingEvent = Instance.new("RemoteEvent")
bookingEvent.Name = "BookingSuspect"
bookingEvent.Parent = ReplicatedStorage

local CHARGES = {
    "Assault", "Robbery", "Murder", "Drug Possession", "Drug Trafficking",
    "Theft", "Grand Theft Auto", "Evading Police", "Reckless Driving",
    "Possession of Illegal Weapon", "Trespassing", "Public Intoxication",
    "Resisting Arrest", "Obstruction of Justice", "Vandalism",
}

bookingEvent.OnServerEvent:Connect(function(officer, suspect, selectedCharges, sentence)
    if not suspect or not suspect.Character then return end
    
    local record = {
        suspectName = suspect.Name,
        suspectId = suspect.UserId,
        officerName = officer.Name,
        charges = selectedCharges,
        sentence = sentence,  -- minutes
        timestamp = os.time(),
        bookingId = math.random(100000, 999999),
    }
    
    -- Save to DataStore
    local key = "booking_" .. suspect.UserId .. "_" .. record.bookingId
    pcall(function()
        bookingStore:SetAsync(key, record)
    end)
    
    -- Imprison: teleport to cell, restrict movement for sentence duration
    local char = suspect.Character
    local humanoid = char:FindFirstChild("Humanoid")
    local cellSpawn = workspace:FindFirstChild("CellSpawn")
    
    if char:FindFirstChild("HumanoidRootPart") and cellSpawn then
        char.HumanoidRootPart.CFrame = cellSpawn.CFrame + Vector3.new(0, 3, 0)
    end
    
    -- Send booking receipt to officer's client
    bookingEvent:FireClient(officer, "receipt", record)
    
    -- Auto release after sentence
    task.delay(sentence * 60, function()
        if suspect.Character then
            local releaseSpawn = workspace:FindFirstChild("ReleaseSpawn")
            if releaseSpawn and suspect.Character:FindFirstChild("HumanoidRootPart") then
                suspect.Character.HumanoidRootPart.CFrame = releaseSpawn.CFrame + Vector3.new(0,3,0)
            end
        end
    end)
end)

## SPEED CAMERA
-- Script placed in a SpeedCamera Model:
local camera = script.Parent
local sensor = camera:FindFirstChild("SpeedSensor")  -- invisible part across road
local SPEED_LIMIT = 50  -- studs/s
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local speedAlert = Instance.new("RemoteEvent")
speedAlert.Name = "SpeedCameraAlert"
speedAlert.Parent = ReplicatedStorage

local recentDetections = {}

sensor.Touched:Connect(function(hit)
    local vehicle = hit:FindFirstAncestorOfClass("Model")
    if not vehicle then return end
    if recentDetections[vehicle] then return end
    recentDetections[vehicle] = true
    
    local speed = hit.AssemblyLinearVelocity.Magnitude
    if speed > SPEED_LIMIT then
        -- Find the driver
        local seat = vehicle:FindFirstChildOfClass("VehicleSeat")
        if seat and seat.Occupant then
            local player = game:GetService("Players"):GetPlayerFromCharacter(seat.Occupant.Parent)
            if player then
                -- Notify all police
                for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
                    speedAlert:FireClient(p, player.Name, math.floor(speed), camera.Name)
                end
            end
        end
    end
    
    task.delay(3, function() recentDetections[vehicle] = nil end)
end)

## BREATHALYSER TOOL
local tool = script.Parent
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local breathEvent = ReplicatedStorage:WaitForChild("BreathalyserTest")

tool.Activated:Connect(function()
    breathEvent:FireServer()
end)

-- Server:
local breathEvent = Instance.new("RemoteEvent")
breathEvent.Name = "BreathalyserTest"
breathEvent.Parent = ReplicatedStorage

-- Alcohol levels stored by NeedsSystem or DrugSystem
local alcoholLevels = {}  -- [userId] = 0.0 to 0.4+ BAC

breathEvent.OnServerEvent:Connect(function(officer, suspect)
    if not suspect then return end
    local bac = alcoholLevels[suspect.UserId] or 0
    local result = string.format("BAC: %.3f — %s",
        bac,
        bac > 0.08 and "⚠️ OVER LIMIT" or "✅ CLEAR"
    )
    breathEvent:FireClient(officer, suspect.Name, bac, result)
end)

## EVIDENCE SYSTEM
local DataStoreService = game:GetService("DataStoreService")
local evidenceStore = DataStoreService:GetDataStore("Evidence")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local evidenceEvent = Instance.new("RemoteEvent")
evidenceEvent.Name = "EvidenceAction"
evidenceEvent.Parent = ReplicatedStorage

-- Collect evidence tool:
-- When officer uses "EvidenceBag" tool on a tagged item (CollectionService "Evidence"):
evidenceEvent.OnServerEvent:Connect(function(officer, action, itemPart, caseId)
    if action == "collect" then
        if not itemPart then return end
        local record = {
            itemName = itemPart.Name,
            collectedBy = officer.Name,
            location = tostring(itemPart.Position),
            timestamp = os.time(),
            caseId = caseId or "UNCATEGORISED",
        }
        local key = "evidence_" .. caseId .. "_" .. os.time()
        pcall(function() evidenceStore:SetAsync(key, record) end)
        itemPart:Destroy()  -- item collected
        evidenceEvent:FireClient(officer, "collected", record)
        
    elseif action == "retrieve" then
        -- Return list of evidence for a case
        local items = {}
        pcall(function()
            local pages = evidenceStore:ListKeysAsync("evidence_" .. caseId)
            for _, key in ipairs(pages:GetCurrentPage()) do
                local item = evidenceStore:GetAsync(key.KeyName)
                table.insert(items, item)
            end
        end)
        evidenceEvent:FireClient(officer, "list", items)
    end
end)

## CAD SYSTEM — COMPUTER AIDED DISPATCH
-- Officers can update status, dispatch calls, see all units:
local cadData = {
    units = {},   -- [userId] = {name, status, location, vehicle}
    calls = {},   -- list of active calls
}

local cadEvent = Instance.new("RemoteEvent")
cadEvent.Name = "CADSystem"
cadEvent.Parent = ReplicatedStorage

local STATUSES = {
    "10-8 Available",
    "10-6 Busy",
    "10-97 At Scene",
    "10-11 Traffic Stop",
    "10-95 Subject in Custody",
    "10-7 Off Duty",
}

cadEvent.OnServerEvent:Connect(function(player, action, data)
    if action == "updateStatus" then
        local char = player.Character
        local pos = char and char:FindFirstChild("HumanoidRootPart") 
            and tostring(char.HumanoidRootPart.Position) or "Unknown"
        cadData.units[player.UserId] = {
            name = player.Name,
            status = data.status,
            location = pos,
            vehicle = data.vehicle or "On Foot",
        }
        -- Broadcast update to all officers
        for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
            cadEvent:FireClient(p, "unitsUpdate", cadData.units)
        end
        
    elseif action == "newCall" then
        local call = {
            id = math.random(1000, 9999),
            type = data.type,
            location = data.location,
            priority = data.priority or 3,
            time = os.date("%H:%M"),
            assignedUnit = nil,
        }
        table.insert(cadData.calls, call)
        for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
            cadEvent:FireClient(p, "newCall", call)
        end
    end
end)
`
