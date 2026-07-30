-- macOS-specific utilities

local sys_utils = require("utils")
local logger = require("logger")
local config = require("install_extension.config")

local M = {}

function M.get_macos_device_id()
    if not config.is_macos() then
        return ""
    end

    logger:info("[install] Getting macOS Chromium preference device ID...")

    -- Chromium uses IOPlatformUUID as the device-specific component when
    -- authenticating tracked preferences on macOS.
    local output, status = sys_utils.exec("/usr/sbin/ioreg -rd1 -c IOPlatformExpertDevice")
    if not output then
        logger:error("[install] Failed to read IOPlatformUUID: " .. tostring(status))
        return ""
    end

    local device_id = output:match('"IOPlatformUUID"%s*=%s*"([^"]+)"')
    local uuid_pattern = "^"
        .. string.rep("%x", 8) .. "%-"
        .. string.rep("%x", 4) .. "%-"
        .. string.rep("%x", 4) .. "%-"
        .. string.rep("%x", 4) .. "%-"
        .. string.rep("%x", 12)
        .. "$"
    if not device_id or not device_id:match(uuid_pattern) then
        logger:error("[install] IOPlatformUUID was missing or malformed")
        return ""
    end

    -- Do not log the persistent machine identifier.
    logger:info("[install] macOS Chromium preference device ID found")
    return device_id
end

return M
