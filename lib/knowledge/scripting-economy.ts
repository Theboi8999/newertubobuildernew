export const ECONOMY_SCRIPTING_KNOWLEDGE = `
=== ECONOMY SCRIPTING — CURRENCY, SHOPS, INVENTORY, JOBS, PAYCHECKS ===

## CURRENCY SYSTEM WITH DATASTORE
-- ModuleScript "EconomySystem" in ServerScriptService:
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local moneyStore = DataStoreService:GetDataStore("PlayerMoney_v1")
local playerMoney = {}

local moneyEvent = Instance.new("RemoteEvent")
moneyEvent.Name = "MoneyUpdate"
moneyEvent.Parent = ReplicatedStorage

local EconomySystem = {}

function EconomySystem.getMoney(player)
    return playerMoney[player.UserId] or 0
end

function EconomySystem.giveMoney(player, amount)
    local userId = player.UserId
    playerMoney[userId] = (playerMoney[userId] or 0) + amount
    moneyEvent:FireClient(player, playerMoney[userId])
    -- Save
    pcall(function() moneyStore:SetAsync("money_"..userId, playerMoney[userId]) end)
end

function EconomySystem.takeMoney(player, amount)
    local userId = player.UserId
    local current = playerMoney[userId] or 0
    if current < amount then return false end  -- insufficient funds
    playerMoney[userId] = current - amount
    moneyEvent:FireClient(player, playerMoney[userId])
    pcall(function() moneyStore:SetAsync("money_"..userId, playerMoney[userId]) end)
    return true
end

function EconomySystem.loadMoney(player)
    local userId = player.UserId
    local success, data = pcall(function()
        return moneyStore:GetAsync("money_"..userId)
    end)
    playerMoney[userId] = (success and data) or 500  -- default starting money
    moneyEvent:FireClient(player, playerMoney[userId])
end

Players.PlayerAdded:Connect(EconomySystem.loadMoney)
Players.PlayerRemoving:Connect(function(player)
    local userId = player.UserId
    if playerMoney[userId] then
        pcall(function() moneyStore:SetAsync("money_"..userId, playerMoney[userId]) end)
    end
    playerMoney[userId] = nil
end)

return EconomySystem

## SHOP GUI SYSTEM
-- Script inside Shop Model (ShopKeeper NPC or Shop counter):
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local shopEvent = Instance.new("RemoteEvent")
shopEvent.Name = "ShopAction"
shopEvent.Parent = ReplicatedStorage

local SHOP_ITEMS = {
    { name = "Handcuffs",        price = 50,   toolId = "Handcuffs" },
    { name = "Radio",            price = 30,   toolId = "Radio" },
    { name = "First Aid Kit",    price = 80,   toolId = "FirstAidKit" },
    { name = "Police Baton",     price = 40,   toolId = "Baton" },
    { name = "Taser",            price = 120,  toolId = "Taser" },
    { name = "Speedloader",      price = 25,   toolId = "Speedloader" },
}

local cd = Instance.new("ClickDetector")
cd.MaxActivationDistance = 8
cd.Parent = script.Parent:FindFirstChild("Counter") or script.Parent

cd.MouseClick:Connect(function(player)
    -- Open shop UI on client
    shopEvent:FireClient(player, "open", SHOP_ITEMS)
end)

shopEvent.OnServerEvent:Connect(function(player, action, itemName)
    if action == "buy" then
        local item = nil
        for _, i in ipairs(SHOP_ITEMS) do
            if i.name == itemName then item = i break end
        end
        if not item then return end
        
        local Economy = require(game.ServerScriptService.EconomySystem)
        local success = Economy.takeMoney(player, item.price)
        
        if success then
            -- Give tool from ServerStorage
            local tool = game.ServerStorage:FindFirstChild(item.toolId)
            if tool then
                tool:Clone().Parent = player.Backpack
            end
            shopEvent:FireClient(player, "purchased", item.name)
        else
            shopEvent:FireClient(player, "insufficient", item.price)
        end
    end
end)

-- LocalScript for Shop GUI:
local shopEvent = game:GetService("ReplicatedStorage"):WaitForChild("ShopAction")
local player = game:GetService("Players").LocalPlayer

local gui = Instance.new("ScreenGui")
gui.Name = "ShopGUI"
gui.Enabled = false
gui.Parent = player.PlayerGui

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 400, 0, 500)
frame.AnchorPoint = Vector2.new(0.5, 0.5)
frame.Position = UDim2.new(0.5, 0, 0.5, 0)
frame.BackgroundColor3 = Color3.fromRGB(15, 15, 25)
frame.BackgroundTransparency = 0.1
frame.Parent = gui
Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 16)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 50)
title.BackgroundTransparency = 1
title.TextColor3 = Color3.fromRGB(255,255,255)
title.Font = Enum.Font.GothamBold
title.TextSize = 20
title.Text = "🛒 POLICE EQUIPMENT SHOP"
title.Parent = frame

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 30, 0, 30)
closeBtn.Position = UDim2.new(1, -35, 0, 10)
closeBtn.BackgroundColor3 = Color3.fromRGB(180, 40, 40)
closeBtn.Text = "✕"
closeBtn.TextColor3 = Color3.fromRGB(255,255,255)
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextSize = 16
closeBtn.Parent = frame
Instance.new("UICorner", closeBtn).CornerRadius = UDim.new(0, 6)
closeBtn.MouseButton1Click:Connect(function() gui.Enabled = false end)

local itemList = Instance.new("ScrollingFrame")
itemList.Size = UDim2.new(1, -20, 1, -70)
itemList.Position = UDim2.new(0, 10, 0, 60)
itemList.BackgroundTransparency = 1
itemList.ScrollBarThickness = 4
itemList.Parent = frame
Instance.new("UIListLayout", itemList).Padding = UDim.new(0, 6)

shopEvent.OnClientEvent:Connect(function(action, data)
    if action == "open" then
        gui.Enabled = true
        -- Clear and rebuild list
        for _, c in ipairs(itemList:GetChildren()) do
            if not c:IsA("UIListLayout") then c:Destroy() end
        end
        for _, item in ipairs(data) do
            local row = Instance.new("Frame")
            row.Size = UDim2.new(1, 0, 0, 55)
            row.BackgroundColor3 = Color3.fromRGB(30, 30, 45)
            row.Parent = itemList
            Instance.new("UICorner", row).CornerRadius = UDim.new(0, 8)
            
            local nameLabel = Instance.new("TextLabel")
            nameLabel.Size = UDim2.new(0.6, 0, 1, 0)
            nameLabel.Position = UDim2.new(0, 10, 0, 0)
            nameLabel.BackgroundTransparency = 1
            nameLabel.TextColor3 = Color3.fromRGB(220,220,220)
            nameLabel.Font = Enum.Font.Gotham
            nameLabel.TextSize = 14
            nameLabel.TextXAlignment = Enum.TextXAlignment.Left
            nameLabel.Text = item.name
            nameLabel.Parent = row
            
            local priceLabel = Instance.new("TextLabel")
            priceLabel.Size = UDim2.new(0.2, 0, 1, 0)
            priceLabel.Position = UDim2.new(0.6, 0, 0, 0)
            priceLabel.BackgroundTransparency = 1
            priceLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
            priceLabel.Font = Enum.Font.GothamBold
            priceLabel.TextSize = 14
            priceLabel.Text = "$"..item.price
            priceLabel.Parent = row
            
            local buyBtn = Instance.new("TextButton")
            buyBtn.Size = UDim2.new(0, 70, 0, 35)
            buyBtn.AnchorPoint = Vector2.new(1, 0.5)
            buyBtn.Position = UDim2.new(1, -8, 0.5, 0)
            buyBtn.BackgroundColor3 = Color3.fromRGB(0, 120, 255)
            buyBtn.TextColor3 = Color3.fromRGB(255,255,255)
            buyBtn.Font = Enum.Font.GothamBold
            buyBtn.TextSize = 13
            buyBtn.Text = "BUY"
            buyBtn.Parent = row
            Instance.new("UICorner", buyBtn).CornerRadius = UDim.new(0, 8)
            buyBtn.MouseButton1Click:Connect(function()
                shopEvent:FireServer("buy", item.name)
            end)
        end
    elseif action == "purchased" then
        -- Toast notification
        print("Purchased: " .. tostring(data))
    elseif action == "insufficient" then
        print("Not enough money! Need $" .. tostring(data))
    end
end)

## INVENTORY SYSTEM — HOTBAR
-- LocalScript:
local Players = game:GetService("Players")
local UIS = game:GetService("UserInputService")
local player = Players.LocalPlayer

local hotbarSlots = 5
local hotbar = {}  -- [slot] = toolName

-- Hotbar GUI
local gui = player.PlayerGui:WaitForChild("HUD")
local hotbarFrame = Instance.new("Frame")
hotbarFrame.Size = UDim2.new(0, hotbarSlots * 64 + 10, 0, 70)
hotbarFrame.AnchorPoint = Vector2.new(0.5, 1)
hotbarFrame.Position = UDim2.new(0.5, 0, 1, -10)
hotbarFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 20)
hotbarFrame.BackgroundTransparency = 0.3
hotbarFrame.Parent = gui
Instance.new("UICorner", hotbarFrame).CornerRadius = UDim.new(0, 12)
Instance.new("UIListLayout", hotbarFrame).FillDirection = Enum.FillDirection.Horizontal

for i = 1, hotbarSlots do
    local slot = Instance.new("Frame")
    slot.Name = "Slot_"..i
    slot.Size = UDim2.new(0, 58, 0, 58)
    slot.BackgroundColor3 = Color3.fromRGB(30, 30, 50)
    slot.BackgroundTransparency = 0.3
    slot.Parent = hotbarFrame
    Instance.new("UICorner", slot).CornerRadius = UDim.new(0, 8)
    
    local numLabel = Instance.new("TextLabel")
    numLabel.Size = UDim2.new(0, 18, 0, 18)
    numLabel.Position = UDim2.new(0, 2, 0, 2)
    numLabel.BackgroundTransparency = 1
    numLabel.TextColor3 = Color3.fromRGB(150,150,150)
    numLabel.Font = Enum.Font.GothamBold
    numLabel.TextSize = 11
    numLabel.Text = tostring(i)
    numLabel.Parent = slot
end

-- Equip on number key press
UIS.InputBegan:Connect(function(input, processed)
    if processed then return end
    for i = 1, hotbarSlots do
        if input.KeyCode == Enum.KeyCode["Alpha"..i] then
            local tool = hotbar[i]
            if tool then
                local backpackTool = player.Backpack:FindFirstChild(tool)
                if backpackTool then
                    player.Character.Humanoid:EquipTool(backpackTool)
                end
            end
        end
    end
end)

## LOCKER / CLOTHING SYSTEM
local locker = script.Parent
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local lockerEvent = Instance.new("RemoteEvent")
lockerEvent.Name = "LockerAction"
lockerEvent.Parent = ReplicatedStorage

local UNIFORMS = {
    { name = "Police Officer",    shirtId = "rbxassetid://12345", pantsId = "rbxassetid://12346", hat = "Police Cap" },
    { name = "Detective",         shirtId = "rbxassetid://12347", pantsId = "rbxassetid://12348", hat = nil },
    { name = "Tactical Officer",  shirtId = "rbxassetid://12349", pantsId = "rbxassetid://12350", hat = "Tactical Helmet" },
}

local TOOLS_IN_LOCKER = {"Handcuffs", "Radio", "Baton", "Taser"}

local cd = Instance.new("ClickDetector")
cd.MaxActivationDistance = 5
cd.Parent = locker:FindFirstChild("Door") or locker
cd.MouseClick:Connect(function(player)
    lockerEvent:FireClient(player, "open", UNIFORMS, TOOLS_IN_LOCKER)
end)

lockerEvent.OnServerEvent:Connect(function(player, action, data)
    if action == "selectUniform" then
        local uniform = UNIFORMS[data]
        if not uniform then return end
        local char = player.Character
        if not char then return end
        -- Apply shirt/pants
        local shirt = char:FindFirstChildOfClass("Shirt") or Instance.new("Shirt", char)
        local pants = char:FindFirstChildOfClass("Pants") or Instance.new("Pants", char)
        shirt.ShirtTemplate = uniform.shirtId
        pants.PantsTemplate = uniform.pantsId
        
    elseif action == "takeTool" then
        local tool = game.ServerStorage:FindFirstChild(data)
        if tool then tool:Clone().Parent = player.Backpack end
    end
end)

## JOB / WHITELIST SYSTEM
local DataStoreService = game:GetService("DataStoreService")
local jobStore = DataStoreService:GetDataStore("PlayerJobs_v1")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local JOBS = {
    "Civilian", "Police Officer", "Detective", "Paramedic", 
    "Firefighter", "Criminal", "Government Official"
}

local playerJobs = {}
local jobEvent = Instance.new("RemoteEvent")
jobEvent.Name = "JobSystem"
jobEvent.Parent = ReplicatedStorage

local JobSystem = {}

function JobSystem.getJob(player)
    return playerJobs[player.UserId] or "Civilian"
end

function JobSystem.setJob(player, job)
    playerJobs[player.UserId] = job
    pcall(function() jobStore:SetAsync("job_"..player.UserId, job) end)
    jobEvent:FireClient(player, "jobUpdate", job)
end

function JobSystem.hasJob(player, job)
    return playerJobs[player.UserId] == job
end

-- Load job on join
game:GetService("Players").PlayerAdded:Connect(function(player)
    local success, data = pcall(function()
        return jobStore:GetAsync("job_"..player.UserId)
    end)
    playerJobs[player.UserId] = (success and data) or "Civilian"
    jobEvent:FireClient(player, "jobUpdate", playerJobs[player.UserId])
end)

return JobSystem

## PAYCHECK SYSTEM
-- Script in ServerScriptService:
local JOB_SALARIES = {
    Civilian = 100,
    ["Police Officer"] = 350,
    Detective = 450,
    Paramedic = 380,
    Firefighter = 360,
    Criminal = 0,
    ["Government Official"] = 500,
}

local PAYCHECK_INTERVAL = 300  -- seconds (5 minutes)

game:GetService("RunService").Heartbeat:Connect(function() end)

task.spawn(function()
    while true do
        task.wait(PAYCHECK_INTERVAL)
        local Economy = require(game.ServerScriptService.EconomySystem)
        local JobSystem = require(game.ServerScriptService.JobSystem)
        
        for _, player in ipairs(game:GetService("Players"):GetPlayers()) do
            local job = JobSystem.getJob(player)
            local salary = JOB_SALARIES[job] or 0
            if salary > 0 then
                Economy.giveMoney(player, salary)
                -- Notify player
                local paycheckEvent = game:GetService("ReplicatedStorage"):FindFirstChild("Paycheck")
                if paycheckEvent then
                    paycheckEvent:FireClient(player, salary, job)
                end
            end
        end
    end
end)
`
