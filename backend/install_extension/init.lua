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
local json_helpers = require("install_extension.json_helpers")
local windows = require("install_extension.windows")
local macos = require("install_extension.macos")

local M = {}

-- Load an existing preferences file. Callers decide whether a missing file may
-- be created; malformed existing files are never silently replaced.
local function load_prefs_file(path, label)
    if not fs.exists(path) then
        return nil, label .. " not found"
    end
    local data = config.read_json_file(path, label)
    if data then
        logger:info("[install] Loaded existing " .. label)
        return data, nil
    end
    return nil, "Failed to read " .. label
end

local function initialize_hmac_context()
    if config.is_windows() then
        logger:info("[install] Initializing HMAC context for Windows...")
        local sid = windows.get_windows_sid()
        if sid and sid ~= "" then
            -- Steam CEF uses an empty seed (like Edge/Brave).
            logger:info("[install] HMAC context initialized")
            return HmacContext.new(sid, ""), nil
        end
        logger:warn("[install] Could not get Windows SID, HMAC will be skipped")
        return nil, nil
    elseif config.is_macos() then
        logger:info("[install] Initializing HMAC context for macOS...")
        local device_id = macos.get_macos_device_id()
        if device_id and device_id ~= "" then
            -- Steam CEF uses an empty seed; macOS uses IOPlatformUUID as the
            -- device-specific part of the authenticated preference message.
            logger:info("[install] HMAC context initialized")
            return HmacContext.new(device_id, ""), nil
        end
        logger:error("[install] Could not get the macOS preference device ID")
        return nil, "Failed to get the macOS device identifier required to sign Chromium preferences"
    elseif config.is_linux() then
        logger:info("[install] Linux detected, HMAC not required")
        return nil, nil
    end

    return nil, "Unsupported platform: " .. tostring(jit.os)
end

-- Set up extension in a prefs object
local function setup_extension_prefs(prefs, extension_id, extension_settings, hmac_ctx, ext_mac, dev_mode_mac, compute_super)
    install_utils.ensure_nested(prefs, "extensions", "settings")
    install_utils.ensure_nested(prefs, "extensions", "ui")
    prefs.extensions.ui.developer_mode = true
    prefs.extensions.settings[extension_id] = extension_settings

    if hmac_ctx then
        install_utils.ensure_nested(prefs, "protection", "macs", "extensions", "settings")
        install_utils.ensure_nested(prefs, "protection", "macs", "extensions", "ui")
        if ext_mac then prefs.protection.macs.extensions.settings[extension_id] = ext_mac end
        if dev_mode_mac then prefs.protection.macs.extensions.ui.developer_mode = dev_mode_mac end

        -- Remove the location used by older Extendium builds. Chromium only
        -- reads tracked hashes from protection.macs.
        if prefs.protection.ui then
            prefs.protection.ui.developer_mode = nil
            if next(prefs.protection.ui) == nil then
                prefs.protection.ui = nil
            end
        end

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
        local msg = "Steam has been closed to complete the Extendium plugin installation.     Please restart Steam."
        sys_utils.exec('start "" powershell -WindowStyle Hidden -Command "taskkill /F /IM steamwebhelper.exe; taskkill /F /IM steam.exe; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show(\'' .. msg .. '\', \'Steam restart required - extendium\', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)"')
    elseif config.is_macos() then
        -- Run detached because utils.exec uses a blocking pipe. The bracketed
        -- helper pattern cannot match this shell command itself.
        sys_utils.exec([[( /bin/sleep 1; /usr/bin/pkill -KILL -f '/[S]team Helper.app/Contents/MacOS/Steam Helper'; /usr/bin/pkill -KILL -x steam_osx; /usr/bin/osascript -e 'display dialog "Steam has been closed to complete the Extendium plugin installation. Relaunch it using your normal Millennium launcher." with title "Steam restart required - Extendium" buttons {"OK"} default button "OK" with icon caution' ) </dev/null >/dev/null 2>&1 &]])
    elseif config.is_linux() then
        sys_utils.exec('sleep 1 && pkill -KILL -f steam')
        local msg = "Steam has been closed to complete the Extendium plugin installation.\\nPlease restart Steam."
        sys_utils.exec('zenity --info --title "Steam restart required - extendium" --text "' .. msg .. '" &')
    else
        logger:error("[install] Cannot restart Steam on unsupported platform")
        return
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

    -- Initialize the platform-specific HMAC context for Chromium's tracked
    -- preferences. macOS fails closed if its device ID is unavailable.
    local hmac_ctx, hmac_err = initialize_hmac_context()
    if hmac_err then
        return json.encode({ success = false, error = hmac_err })
    end

    -- ========================================================================
    -- PHASE 1: Read all files and compute everything BEFORE writing
    -- ========================================================================
    logger:info("[install] Phase 1: Reading files and computing signatures...")

    local prefs_path = fs.join(config_dir, "Preferences")
    local secure_prefs_path = fs.join(config_dir, "Secure Preferences")

    local prefs = {}
    if fs.exists(prefs_path) then
        local prefs_err
        prefs, prefs_err = load_prefs_file(prefs_path, "Preferences")
        if not prefs then
            return json.encode({ success = false, error = prefs_err })
        end
    else
        logger:warn("[install] Preferences not found, will create new")
    end

    local secure_prefs = nil
    if fs.exists(secure_prefs_path) then
        local secure_prefs_err
        secure_prefs, secure_prefs_err = load_prefs_file(secure_prefs_path, "Secure Preferences")
        if not secure_prefs then
            return json.encode({ success = false, error = secure_prefs_err })
        end
    elseif config.is_macos() then
        logger:error("[install] Secure Preferences is required on macOS")
        return json.encode({
            success = false,
            error = "Secure Preferences not found. Start Steam once before installing Extendium."
        })
    end

    -- Compute HMACs if needed - do this BEFORE modifying prefs
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

    logger:info("========================================")
    logger:info("[install] Installation complete! Please restart Steam!")
    logger:info("[install] Extension ID: " .. extension_id)
    logger:info("[install] Extension Path: " .. extension_dir)
    logger:info("========================================")

    -- Kill Steam webhelper IMMEDIATELY after writing to prevent it from overriding our changes
    kill_steam_webhelper()

    return json.encode({
        success = true,
        extensionId = extension_id,
        extensionPath = extension_dir,
        message = "Extension installed. Restart Steam to load it."
    })
end

local function get_extension_settings(prefs, extension_id)
    if not prefs or not prefs.extensions or not prefs.extensions.settings then
        return nil
    end
    return prefs.extensions.settings[extension_id]
end

local function extension_path_exists(extension_settings)
    return extension_settings
        and type(extension_settings.path) == "string"
        and extension_settings.path ~= ""
        and fs.exists(extension_settings.path)
end

local function validate_tracked_extension(prefs, extension_id, hmac_ctx)
    local extension_settings = get_extension_settings(prefs, extension_id)
    if not extension_settings or not hmac_ctx then
        return false
    end

    local protection = prefs.protection
    local macs = protection and protection.macs
    local extension_macs = macs and macs.extensions
    local settings_macs = extension_macs and extension_macs.settings
    local ui_macs = extension_macs and extension_macs.ui

    local stored_ext_mac = settings_macs and settings_macs[extension_id]
    local expected_ext_mac = hmac_ctx:compute_mac(
        "extensions.settings." .. extension_id,
        extension_settings
    )
    if not stored_ext_mac or stored_ext_mac ~= expected_ext_mac then
        logger:warn("[check_status] Extension preference MAC is missing or invalid")
        return false
    end

    if not prefs.extensions.ui or prefs.extensions.ui.developer_mode ~= true then
        logger:warn("[check_status] Chromium developer mode is not enabled")
        return false
    end

    local stored_dev_mode_mac = ui_macs and ui_macs.developer_mode
    local expected_dev_mode_mac = hmac_ctx:compute_mac("extensions.ui.developer_mode", true)
    if not stored_dev_mode_mac or stored_dev_mode_mac ~= expected_dev_mode_mac then
        logger:warn("[check_status] Developer-mode preference MAC is missing or invalid")
        return false
    end

    local expected_super_mac = macs and hmac_ctx:compute_super_mac(macs)
    if not protection or not protection.super_mac or protection.super_mac ~= expected_super_mac then
        logger:warn("[check_status] Chromium preference super MAC is missing or invalid")
        return false
    end

    return true
end

local function remove_extension_from_prefs(prefs, extension_id, hmac_ctx, recompute_super)
    local extension_settings = get_extension_settings(prefs, extension_id)
    if not extension_settings then
        return false
    end

    prefs.extensions.settings[extension_id] = nil

    local protection = prefs.protection
    local macs = protection and protection.macs
    local extension_macs = macs and macs.extensions
    local settings_macs = extension_macs and extension_macs.settings
    if settings_macs then
        settings_macs[extension_id] = nil
    end

    if protection and protection.ui then
        protection.ui.developer_mode = nil
        if next(protection.ui) == nil then
            protection.ui = nil
        end
    end

    if macs then
        protection.macs = json_helpers.remove_empty_children(macs) or {}
    end

    if recompute_super then
        if not hmac_ctx then
            return false
        end

        if not protection then
            prefs.protection = { macs = {} }
            protection = prefs.protection
        elseif not protection.macs then
            protection.macs = {}
        end

        if prefs.extensions
            and prefs.extensions.ui
            and prefs.extensions.ui.developer_mode == true then
            install_utils.ensure_nested(protection, "macs", "extensions", "ui")
            protection.macs.extensions.ui.developer_mode =
                hmac_ctx:compute_mac("extensions.ui.developer_mode", true)
        end

        protection.super_mac = hmac_ctx:compute_super_mac(protection.macs)
    end

    return true
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

    local prefs_path = fs.join(config_dir, "Preferences")
    local secure_prefs_path = fs.join(config_dir, "Secure Preferences")

    local prefs = nil
    if fs.exists(prefs_path) then
        prefs = select(1, load_prefs_file(prefs_path, "Preferences"))
    end

    local secure_prefs = nil
    if fs.exists(secure_prefs_path) then
        secure_prefs = select(1, load_prefs_file(secure_prefs_path, "Secure Preferences"))
    end

    local hmac_ctx, hmac_err = initialize_hmac_context()
    if hmac_err then
        return json.encode({ installed = false, error = hmac_err })
    end

    local installed = false
    local needs_cleanup = false
    local prefs_settings = get_extension_settings(prefs, keys.extensionId)
    local secure_settings = get_extension_settings(secure_prefs, keys.extensionId)

    if config.is_macos() then
        -- Secure Preferences is authoritative for tracked extensions on macOS.
        -- A Preferences-only entry must not report a successful installation.
        if secure_settings then
            logger:info("[check_status] Extension found in Secure Preferences")
            if not extension_path_exists(secure_settings) then
                logger:warn("[check_status] Secure Preferences contains an invalid extension path")
                needs_cleanup = true
            elseif not validate_tracked_extension(secure_prefs, keys.extensionId, hmac_ctx) then
                needs_cleanup = true
            else
                installed = true
            end
        end
    else
        if prefs_settings then
            logger:info("[check_status] Extension found in Preferences")
            if extension_path_exists(prefs_settings) then
                installed = true
            else
                logger:warn("[check_status] Preferences contains an invalid extension path")
                needs_cleanup = true
            end
        end

        if secure_settings then
            logger:info("[check_status] Extension found in Secure Preferences")
            if extension_path_exists(secure_settings) then
                installed = true
            else
                logger:warn("[check_status] Secure Preferences contains an invalid extension path")
                needs_cleanup = true
            end
        end
    end

    if needs_cleanup then
        logger:info("[check_status] Cleaning up invalid extension entries...")

        -- Clean the authoritative tracked file first so a secondary write
        -- failure cannot leave a stale secure entry.
        if secure_settings then
            if (config.is_windows() or config.is_macos()) and not hmac_ctx then
                return json.encode({
                    installed = false,
                    error = "Cannot safely clean Secure Preferences without an HMAC context"
                })
            end

            remove_extension_from_prefs(
                secure_prefs,
                keys.extensionId,
                hmac_ctx,
                config.is_windows() or config.is_macos()
            )
            local secure_prefs_json = json.encode(secure_prefs)
            local success, write_err = sys_utils.write_file(secure_prefs_path, secure_prefs_json)
            if success then
                logger:info("[check_status] Removed invalid extension from Secure Preferences")
            else
                logger:error("[check_status] Failed to clean Secure Preferences: " .. (write_err or "unknown"))
                return json.encode({ installed = false, error = "Failed to clean Secure Preferences" })
            end
        end

        if prefs_settings then
            remove_extension_from_prefs(prefs, keys.extensionId, hmac_ctx, false)
            local prefs_json = json.encode(prefs)
            local success, write_err = sys_utils.write_file(prefs_path, prefs_json)
            if success then
                logger:info("[check_status] Removed invalid extension from Preferences")
            else
                logger:error("[check_status] Failed to clean Preferences: " .. (write_err or "unknown"))
                return json.encode({ installed = false, error = "Failed to clean Preferences" })
            end
        end

        kill_steam_webhelper()
        installed = false
    end

    logger:info("[check_status] Installation status: " .. (installed and "installed" or "not installed"))

    return json.encode({
        installed = installed,
        extensionId = keys.extensionId
    })
end

return M
