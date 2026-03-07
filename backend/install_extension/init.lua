-- Steam Extension Installer for Millennium
-- Installs the fake-header-extension into Steam's Chromium preferences

local fs = require("fs")
local json = require("json")
local sys_utils = require("utils")
local logger = require("logger")

local config = require("install_extension.config")
local install_utils = require("install_extension.utils")
local extension_builder = require("install_extension.extension_builder")
local HmacContext = require("install_extension.hmac")
local windows = require("install_extension.windows")

local M = {}

-- Helper to load prefs file with fallback to empty table
local function load_prefs_file(path, label)
    if not fs.exists(path) then
        logger:warn("[install] " .. label .. " not found, will create new")
        return {}
    end
    local data = config.read_json_file(path, label)
    if data then
        logger:info("[install] Loaded existing " .. label)
    end
    return data or {}
end

-- Set up extension in a prefs object
local function setup_extension_prefs(prefs, extension_id, extension_settings, hmac_ctx, ext_mac, dev_mode_mac, compute_super)
    install_utils.ensure_nested(prefs, "extensions", "settings")
    install_utils.ensure_nested(prefs, "extensions", "ui")
    prefs.extensions.ui.developer_mode = true
    prefs.extensions.settings[extension_id] = extension_settings

    if hmac_ctx then
        install_utils.ensure_nested(prefs, "protection", "macs", "extensions", "settings")
        install_utils.ensure_nested(prefs, "protection", "ui")
        if ext_mac then prefs.protection.macs.extensions.settings[extension_id] = ext_mac end
        if dev_mode_mac then prefs.protection.ui.developer_mode = dev_mode_mac end

        if compute_super then
            local super_mac = hmac_ctx:compute_super_mac(prefs.protection.macs)
            if super_mac then
                prefs.protection.super_mac = super_mac
                logger:info("[install] Super MAC computed")
            end
        end
    end
end

local function kill_steam_webhelper()
    if config.is_windows() then
        sys_utils.exec('taskkill /F /IM steamwebhelper.exe')
    else
        sys_utils.exec('pkill -f steamwebhelper')
    end
    logger:info("[install] Steam webhelper killed")
end

function M.install()
    logger:info("========================================")
    logger:info("[install] Starting extension installation...")
    logger:info("========================================")

    -- Get paths
    local extension_dir = config.get_extension_dir()
    if not extension_dir then
        logger:error("[install] Failed to get extension directory")
        return json.encode({ success = false, error = "Failed to get extension directory" })
    end
    logger:info("[install] Extension directory: " .. extension_dir)

    if not fs.exists(extension_dir) then
        logger:error("[install] Extension directory does not exist: " .. extension_dir)
        return json.encode({ success = false, error = "Extension directory not found" })
    end

    -- Read extension keys (contains pre-computed extension ID)
    local keys = config.read_extension_keys()
    if not keys or not keys.extensionId then
        return json.encode({ success = false, error = "Failed to read extension keys" })
    end
    local extension_id = keys.extensionId

    -- Read manifest
    local manifest = config.read_manifest()
    if not manifest then
        return json.encode({ success = false, error = "Failed to read manifest" })
    end

    -- Get Steam config directory
    local config_dir = config.get_steam_config_dir()
    if not config_dir then
        logger:error("[install] Failed to determine Steam config directory")
        return json.encode({ success = false, error = "Failed to determine Steam config directory" })
    end
    logger:info("[install] Steam config directory: " .. config_dir)

    if not fs.exists(config_dir) then
        logger:error("[install] Steam config directory does not exist: " .. config_dir)
        return json.encode({ success = false, error = "Steam config directory not found. Has Steam been run?" })
    end

    -- Resolve extension path to canonical form
    local canonical_extension_dir = fs.canonical(extension_dir)
    if canonical_extension_dir then
        extension_dir = canonical_extension_dir
        logger:info("[install] Canonical extension path: " .. extension_dir)
    end

    -- Build extension settings
    local extension_settings = extension_builder.build_extension_settings(extension_dir, manifest)
    logger:info("[install] Built extension settings")

    -- Initialize HMAC context (Windows only)
    ---@type HmacContext|nil
    local hmac_ctx = nil
    if config.is_windows() then
        logger:info("[install] Initializing HMAC context for Windows...")
        local sid = windows.get_windows_sid()
        if sid and sid ~= "" then
            -- Steam CEF uses empty seed (like Edge/Brave)
            hmac_ctx = HmacContext.new(sid, "")
            logger:info("[install] HMAC context initialized")
        else
            logger:warn("[install] Could not get Windows SID, HMAC will be skipped")
        end
    else
        logger:info("[install] Linux detected, HMAC not required")
    end

    -- ========================================================================
    -- PHASE 1: Read all files and compute everything BEFORE writing
    -- ========================================================================
    logger:info("[install] Phase 1: Reading files and computing signatures...")

    local prefs_path = fs.join(config_dir, "Preferences")
    local secure_prefs_path = fs.join(config_dir, "Secure Preferences")

    local prefs = load_prefs_file(prefs_path, "Preferences")
    local secure_prefs = fs.exists(secure_prefs_path) and load_prefs_file(secure_prefs_path, "Secure Preferences") or nil

    -- Compute HMACs if needed (Windows only) - do this BEFORE modifying prefs
    local ext_mac, dev_mode_mac
    if hmac_ctx then
        logger:info("[install] Computing HMAC signatures...")
        ext_mac = hmac_ctx:compute_mac("extensions.settings." .. extension_id, extension_settings)
        if ext_mac then logger:info("[install] Extension MAC computed") end

        dev_mode_mac = hmac_ctx:compute_mac("extensions.ui.developer_mode", true)
        if dev_mode_mac then logger:info("[install] Developer mode MAC computed") end
    end

    -- Set up both Preferences and Secure Preferences
    setup_extension_prefs(prefs, extension_id, extension_settings, hmac_ctx, ext_mac, dev_mode_mac, false)
    if secure_prefs then
        setup_extension_prefs(secure_prefs, extension_id, extension_settings, hmac_ctx, ext_mac, dev_mode_mac, true)
    end

    -- Pre-encode JSON to minimize time between writes and kill
    logger:info("[install] Encoding JSON...")
    local prefs_json = json.encode(prefs)
    local secure_prefs_json = secure_prefs and json.encode(secure_prefs) or nil

    -- ========================================================================
    -- PHASE 2: Write files and kill Steam IMMEDIATELY after
    -- ========================================================================
    logger:info("[install] Phase 2: Writing files and killing Steam...")

    -- Write Preferences
    local success, write_err = sys_utils.write_file(prefs_path, prefs_json)
    if not success then
        logger:error("[install] Failed to write Preferences: " .. (write_err or "unknown"))
        return json.encode({ success = false, error = "Failed to write Preferences" })
    end
    logger:info("[install] Preferences written")

    -- Write Secure Preferences
    if secure_prefs_json then
        success, write_err = sys_utils.write_file(secure_prefs_path, secure_prefs_json)
        if not success then
            logger:error("[install] Failed to write Secure Preferences: " .. (write_err or "unknown"))
            return json.encode({ success = false, error = "Failed to write Secure Preferences" })
        end
        logger:info("[install] Secure Preferences written")
    end

    -- Kill Steam webhelper IMMEDIATELY after writing to prevent it from overriding our changes
    kill_steam_webhelper()

    logger:info("========================================")
    logger:info("[install] Installation complete!")
    logger:info("[install] Extension ID: " .. extension_id)
    logger:info("[install] Extension Path: " .. extension_dir)
    logger:info("========================================")

    return json.encode({
        success = true,
        extensionId = extension_id,
        extensionPath = extension_dir,
        message = "Extension installed. Restart Steam to load it."
    })
end

local function check_extension_in_prefs(prefs, extension_id)
    return prefs.extensions ~= nil and
           prefs.extensions.settings ~= nil and
           prefs.extensions.settings[extension_id] ~= nil
end

function M.check_status()
    logger:info("[check_status] Checking installation status...")

    local keys = config.read_extension_keys()
    if not keys or not keys.extensionId then
        return json.encode({ installed = false, error = "Extension keys not found" })
    end

    local config_dir = config.get_steam_config_dir()
    if not config_dir then
        return json.encode({ installed = false, error = "Steam config directory not found" })
    end

    local installed = false

    local prefs_path = fs.join(config_dir, "Preferences")
    local secure_prefs_path = fs.join(config_dir, "Secure Preferences")

    local prefs = load_prefs_file(prefs_path, "Preferences")
    local secure_prefs = fs.exists(secure_prefs_path) and load_prefs_file(secure_prefs_path, "Secure Preferences") or nil

    if prefs and check_extension_in_prefs(prefs, keys.extensionId) then
        logger:info("[check_status] Extension found in Preferences")
        installed = true
    end

    if secure_prefs and check_extension_in_prefs(secure_prefs, keys.extensionId) then
        logger:info("[check_status] Extension found in Secure Preferences")
        installed = true
    end

    logger:info("[check_status] Installation status: " .. (installed and "installed" or "not installed"))

    return json.encode({
        installed = installed,
        extensionId = keys.extensionId
    })
end

return M
