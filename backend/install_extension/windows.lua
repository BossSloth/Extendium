-- Windows-specific utilities

local sys_utils = require("utils")
local logger = require("logger")
local config = require("install_extension.config")

local M = {}

function M.get_windows_sid()
    if not config.is_windows() then
        return ""
    end

    logger:info("[install] Getting Windows SID...")

    local cmd = 'powershell -Command "[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value"'
    local output, status = sys_utils.exec(cmd)

    if not output then
        logger:error("[install] Failed to get Windows SID: " .. tostring(status))
        return ""
    end

    local sid = sys_utils.trim(output)
    logger:info("[install] Raw SID: " .. sid)

    -- SID format: S-1-5-21-XXXXXXXXXX-XXXXXXXXXX-XXXXXXXXXX-XXXX
    -- Remove the last RID component (as extloader does)
    if sys_utils.startswith(sid, "S-1-") then
        local parts = sys_utils.split(sid, "-")
        -- Remove last element
        table.remove(parts)
        sid = sys_utils.join(parts, "-")
        logger:info("[install] SID (without RID): " .. sid)
        return sid
    end

    logger:warn("[install] SID doesn't match expected format")
    return ""
end

return M
