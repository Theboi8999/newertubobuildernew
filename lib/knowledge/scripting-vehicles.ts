export const VEHICLE_SCRIPTING_KNOWLEDGE = `
=== VEHICLE SCRIPTING — CAR PHYSICS, HELICOPTERS, BOATS, TRAINS, BIKES ===

## CAR PHYSICS — REALISTIC HANDLING
-- Use VehicleSeat for basic cars, but for realistic handling use BodyForce per wheel:
local car = script.Parent
local seat = car:FindFirstChild("VehicleSeat")
local wheels = {
    car:FindFirstChild("Wheel_FL"),
    car:FindFirstChild("Wheel_FR"), 
    car:FindFirstChild("Wheel_RL"),
    car:FindFirstChild("Wheel_RR"),
}

-- Suspension: keep each wheel at correct ride height
local RIDE_HEIGHT = 2.5
local SUSPENSION_STRENGTH = 8000
local SUSPENSION_DAMPING = 500
local MAX_SPEED = 120  -- studs/s
local DRIFT_THRESHOLD = 0.7  -- throttle above this = drift possible

local RunService = game:GetService("RunService")

for _, wheel in ipairs(wheels) do
    local bf = Instance.new("BodyForce")
    bf.Name = "SuspensionForce"
    bf.Force = Vector3.new(0, 0, 0)
    bf.Parent = wheel
end

RunService.Heartbeat:Connect(function(dt)
    if not seat.Occupant then return end
    local throttle = seat.ThrottleFloat
    local steer = seat.SteerFloat
    
    for _, wheel in ipairs(wheels) do
        if not wheel then continue end
        -- Raycast down from wheel to find ground
        local rayResult = workspace:Raycast(
            wheel.Position,
            Vector3.new(0, -(RIDE_HEIGHT + 1), 0),
            RaycastParams.new()
        )
        local bf = wheel:FindFirstChild("SuspensionForce")
        if bf and rayResult then
            local compression = RIDE_HEIGHT - rayResult.Distance
            local vel = wheel.AssemblyLinearVelocity.Y
            bf.Force = Vector3.new(0, 
                (compression * SUSPENSION_STRENGTH) - (vel * SUSPENSION_DAMPING), 
                0)
        elseif bf then
            bf.Force = Vector3.new(0, 0, 0)
        end
    end
end)

## DRIFT MECHANIC
-- Add to car script:
local DRIFT_FACTOR = 0.85  -- higher = more drift
local isDrifting = false

local UIS = game:GetService("UserInputService")
UIS.InputBegan:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.LeftShift then
        isDrifting = true
        -- Reduce rear wheel friction
        for i = 3, 4 do
            if wheels[i] then
                local physProps = PhysicalProperties.new(0.1, 0.1, 0.5, 0.5, 0.5)
                wheels[i].CustomPhysicalProperties = physProps
            end
        end
    end
end)
UIS.InputEnded:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.LeftShift then
        isDrifting = false
        for i = 3, 4 do
            if wheels[i] then
                wheels[i].CustomPhysicalProperties = PhysicalProperties.new(
                    Enum.Material.SmoothPlastic)
            end
        end
    end
end)

## HELICOPTER LIFT PHYSICS
-- Realistic helicopter using BodyForce for lift:
local heli = script.Parent
local body = heli:FindFirstChild("Body")
local seat = heli:FindFirstChild("PilotSeat")

local LIFT_FORCE = workspace.Gravity * body.AssemblyMass
local MAX_LIFT = LIFT_FORCE * 1.8
local PITCH_SPEED = 15
local ROLL_SPEED = 15
local YAW_SPEED = 40
local COLLECTIVE_SPEED = 0.5

local bf = Instance.new("BodyForce")
bf.Force = Vector3.new(0, 0, 0)
bf.Parent = body

local bg = Instance.new("BodyGyro")
bg.MaxTorque = Vector3.new(4e5, 4e5, 4e5)
bg.D = 50
bg.P = 1000
bg.CFrame = body.CFrame
bg.Parent = body

local collective = 0  -- 0 to 1 lift multiplier
local pitch, roll, yaw = 0, 0, 0

RunService.Heartbeat:Connect(function(dt)
    if not seat.Occupant then
        collective = math.max(collective - dt * 0.3, 0)
        bf.Force = Vector3.new(0, LIFT_FORCE * collective, 0)
        return
    end
    
    -- W/S = collective up/down
    if UIS:IsKeyDown(Enum.KeyCode.W) then collective = math.min(collective + COLLECTIVE_SPEED * dt, 1) end
    if UIS:IsKeyDown(Enum.KeyCode.S) then collective = math.max(collective - COLLECTIVE_SPEED * dt, 0) end
    -- A/D = yaw
    if UIS:IsKeyDown(Enum.KeyCode.A) then yaw = yaw - YAW_SPEED * dt end
    if UIS:IsKeyDown(Enum.KeyCode.D) then yaw = yaw + YAW_SPEED * dt end
    -- Arrow keys = pitch/roll
    if UIS:IsKeyDown(Enum.KeyCode.Up) then pitch = math.clamp(pitch - PITCH_SPEED * dt, -30, 30) end
    if UIS:IsKeyDown(Enum.KeyCode.Down) then pitch = math.clamp(pitch + PITCH_SPEED * dt, -30, 30) end
    if UIS:IsKeyDown(Enum.KeyCode.Left) then roll = math.clamp(roll - ROLL_SPEED * dt, -30, 30) end
    if UIS:IsKeyDown(Enum.KeyCode.Right) then roll = math.clamp(roll + ROLL_SPEED * dt, -30, 30) end
    
    -- Return pitch/roll to neutral when no input
    if not UIS:IsKeyDown(Enum.KeyCode.Up) and not UIS:IsKeyDown(Enum.KeyCode.Down) then
        pitch = pitch * 0.92
    end
    if not UIS:IsKeyDown(Enum.KeyCode.Left) and not UIS:IsKeyDown(Enum.KeyCode.Right) then
        roll = roll * 0.92
    end
    
    bg.CFrame = CFrame.Angles(0, math.rad(yaw), 0) 
        * CFrame.Angles(math.rad(pitch), 0, math.rad(roll))
    bf.Force = Vector3.new(0, LIFT_FORCE * collective * 1.5, 0)
        + body.CFrame.LookVector * (pitch * -20)
        + body.CFrame.RightVector * (roll * 20)
end)

## BOAT BUOYANCY
-- Keep boat level and floating on water (water plane at Y=0):
local WATER_LEVEL = 0
local BUOYANCY_STRENGTH = 2000
local BUOYANCY_DAMPING = 300
local FLOAT_POINTS = {"Float_FL","Float_FR","Float_RL","Float_RR"}

RunService.Heartbeat:Connect(function(dt)
    for _, pointName in ipairs(FLOAT_POINTS) do
        local point = script.Parent:FindFirstChild(pointName)
        if not point then continue end
        local depth = WATER_LEVEL - point.Position.Y
        if depth > 0 then
            local bf = point:FindFirstChild("BuoyancyForce") or Instance.new("BodyForce")
            bf.Name = "BuoyancyForce"
            bf.Force = Vector3.new(0, 
                (depth * BUOYANCY_STRENGTH) - (point.AssemblyLinearVelocity.Y * BUOYANCY_DAMPING),
                0)
            bf.Parent = point
        end
    end
end)

## MOTORBIKE LEAN
local bike = script.Parent
local seat = bike:FindFirstChild("VehicleSeat")
local body = bike:FindFirstChild("Body")
local MAX_LEAN = 25  -- degrees

local bg = Instance.new("BodyGyro")
bg.MaxTorque = Vector3.new(1e6, 1e4, 1e6)
bg.D = 100
bg.P = 5000
bg.Parent = body

RunService.Heartbeat:Connect(function(dt)
    if not seat.Occupant then
        bg.CFrame = CFrame.new()
        return
    end
    local steer = seat.SteerFloat
    local speed = body.AssemblyLinearVelocity.Magnitude
    local leanAmount = steer * MAX_LEAN * math.min(speed / 30, 1)
    local yaw = math.atan2(-body.CFrame.LookVector.X, -body.CFrame.LookVector.Z)
    bg.CFrame = CFrame.Angles(0, yaw, math.rad(-leanAmount))
end)

## TRAIN ON RAILS (waypoint-based)
-- Place Waypoint parts along track named Waypoint_1, Waypoint_2... etc:
local train = script.Parent
local body = train:FindFirstChild("Body")
local TRAIN_SPEED = 40
local waypoints = {}
local currentWP = 1

-- Collect waypoints
for i = 1, 100 do
    local wp = workspace:FindFirstChild("Waypoint_" .. i)
    if wp then table.insert(waypoints, wp) else break end
end

local bv = Instance.new("BodyVelocity")
bv.MaxForce = Vector3.new(1e7, 0, 1e7)
bv.Parent = body

local bg = Instance.new("BodyGyro")
bg.MaxTorque = Vector3.new(0, 1e7, 0)
bg.D = 200
bg.Parent = body

RunService.Heartbeat:Connect(function(dt)
    if #waypoints == 0 then return end
    local target = waypoints[currentWP]
    local dist = (target.Position - body.Position).Magnitude
    if dist < 5 then
        currentWP = (currentWP % #waypoints) + 1
    end
    local direction = (target.Position - body.Position).Unit
    bv.Velocity = Vector3.new(direction.X, 0, direction.Z) * TRAIN_SPEED
    bg.CFrame = CFrame.new(Vector3.new(), Vector3.new(direction.X, 0, direction.Z))
end)

## FORKLIFT LIFTING MECHANISM
local fork = script.Parent:FindFirstChild("ForkArm")
local FORK_SPEED = 0.3
local MIN_HEIGHT = 0
local MAX_HEIGHT = 20
local forkHeight = 0
local attachedLoad = nil

UIS.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.Q then
        forkHeight = math.min(forkHeight + FORK_SPEED, MAX_HEIGHT)
        fork.Position = fork.Position + Vector3.new(0, FORK_SPEED, 0)
        if attachedLoad then
            attachedLoad.Position = attachedLoad.Position + Vector3.new(0, FORK_SPEED, 0)
        end
    end
    if input.KeyCode == Enum.KeyCode.E then
        forkHeight = math.max(forkHeight - FORK_SPEED, MIN_HEIGHT)
        fork.Position = fork.Position - Vector3.new(0, FORK_SPEED, 0)
    end
end)
`
