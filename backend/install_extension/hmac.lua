-- HMAC Context for computing MACs on Chrome preferences

local logger = require("logger")
local json_helpers = require("install_extension.json_helpers")
local sha2 = require("install_extension.sha2")

---@class HmacContext
---@field device_id string
---@field seed_hex string
---@field seed_bytes string
local HmacContext = {}
HmacContext.__index = HmacContext

---@param device_id string
---@param seed_hex string
---@return HmacContext
function HmacContext.new(device_id, seed_hex)
    local self = setmetatable({}, HmacContext)
    self.device_id = device_id or ""
    self.seed_hex = seed_hex or "" -- Empty for Steam CEF
    self.seed_bytes = sha2.hex_to_bin(seed_hex or "")
    return self
end

---@param json_path string
---@param value any
---@return string|nil
function HmacContext:compute_mac(json_path, value)
    local cleaned = json_helpers.remove_empty_children(value)
    -- Use sorted JSON for consistent key ordering (must match JS JSON.stringify)
    local json_value = json_helpers.encode_sorted(cleaned)
    json_value = json_helpers.escape_for_hmac(json_value)

    local message = self.device_id .. json_path .. json_value
    logger:info("[install] Computing MAC for path: " .. json_path)
    logger:info("[install] Message length: " .. #message)
    logger:info("[install] JSON preview: " .. json_value:sub(1, 100) .. "...")

    local mac = string.upper(sha2.hmac(sha2.sha256, self.seed_bytes, message))
    if mac then
        logger:info("[install] MAC: " .. mac:sub(1, 16) .. "...")
    else
        logger:error("[install] MAC computation returned nil!")
    end
    return mac
end

---@param macs table
---@return string|nil
function HmacContext:compute_super_mac(macs)
    -- Chromium removes empty descendants before serializing tracked values.
    local cleaned_macs = json_helpers.remove_empty_children(macs) or {}
    local macs_json = json_helpers.encode_sorted(cleaned_macs)
    local message = self.device_id .. macs_json

    logger:info("[install] Computing super MAC...")
    logger:info("[install] MACs JSON: " .. macs_json:sub(1, 100) .. "...")

    local mac = string.upper(sha2.hmac(sha2.sha256, self.seed_bytes, message))
    if mac then
        logger:info("[install] Super MAC: " .. mac:sub(1, 16) .. "...")
    else
        logger:error("[install] Super MAC computation returned nil!")
    end
    return mac
end

return HmacContext
