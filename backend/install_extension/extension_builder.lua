-- Extension settings builder for Chrome preferences

local sys_utils = require("utils")
local install_utils = require("install_extension.utils")

local M = {}

-- Get Windows FILETIME (100-nanosecond intervals since January 1, 1601)
local function get_windows_file_time()
    local epoch_diff = 11644473600 -- seconds between 1601 and 1970
    local now = sys_utils.time() -- current Unix timestamp in seconds
    local windows_time = (now + epoch_diff) * 10000000 -- convert to 100-ns intervals
    return string.format("%.0f", windows_time)
end

function M.build_extension_settings(extension_dir, manifest)
    local permissions = manifest.permissions or {}
    local api_permissions = {}

    for _, p in ipairs(permissions) do
        -- Filter out URL patterns, keep API permissions
        if not p:match("://") and not p:match("^<") and not p:match("^%*") then
            table.insert(api_permissions, p)
        end
    end

    local file_time = get_windows_file_time()

    return {
        active_permissions = {
            api = #api_permissions > 0 and api_permissions or install_utils.empty_array(),
            explicit_host = { "<all_urls>" },
            manifest_permissions = install_utils.empty_array(),
            scriptable_host = { "<all_urls>" },
        },
        commands = {},
        content_settings = install_utils.empty_array(),
        creation_flags = 38,
        first_install_time = file_time,
        from_webstore = false,
        granted_permissions = {
            api = #api_permissions > 0 and api_permissions or install_utils.empty_array(),
            explicit_host = { "<all_urls>" },
            manifest_permissions = install_utils.empty_array(),
            scriptable_host = { "<all_urls>" },
        },
        incognito_content_settings = install_utils.empty_array(),
        incognito_preferences = {},
        last_update_time = file_time,
        location = 4, -- kUnpacked (developer mode)
        newAllowFileAccess = true,
        path = extension_dir,
        preferences = {},
        regular_only_preferences = {},
        state = 1, -- Enabled
        was_installed_by_default = false,
        was_installed_by_oem = false,
        withholding_permissions = false,
    }
end

return M
