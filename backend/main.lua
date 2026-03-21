local millennium = require("millennium")
local fs = require("fs")
local json = require("json")
local utils = require("utils")
local logger = require("logger")
local install_extension = require("install_extension.init")
local legacy_extensions = require("legacy_extensions")
local EXTENDIUM_EXTERNAL_LINKS_FILE = "external-links.json"
local EXTENDIUM_INSTALL_STATE_FILE = "install-state.json"

local extendium_settings = {}

function GetPluginDir()
    local backend_path = utils.get_backend_path()
    if not backend_path then
        return nil
    end
    return fs.parent_path(backend_path)
end

---@return table|nil
function GetExternalLinks()
    local plugin_dir = GetPluginDir()
    if not plugin_dir then
        logger:error("Failed to get plugin directory")
        return nil
    end

    local external_links_path = fs.join(plugin_dir, EXTENDIUM_EXTERNAL_LINKS_FILE)

    if fs.is_file(external_links_path) then
        local content, err = utils.read_file(external_links_path)
        if content then
            return content
        else
            logger:error("Error reading external links " .. external_links_path .. ": " .. (err or "unknown error"))
        end
    end
end

---@param external_links string
---@return nil
function UpdateExternalLinks(external_links)
    local plugin_dir = GetPluginDir()
    if not plugin_dir then
        logger:error("Failed to get plugin directory")
        return
    end

    local external_links_path = fs.join(plugin_dir, EXTENDIUM_EXTERNAL_LINKS_FILE)

    local success, err = utils.write_file(external_links_path, external_links)
    if not success then
        logger:error("Error writing external links " .. external_links_path .. ": " .. (err or "unknown error"))
    end
end

---@return table|nil
function GetInstallState()
    local plugin_dir = GetPluginDir()
    if not plugin_dir then
        logger:error("Failed to get plugin directory")
        return nil
    end

    local state_path = fs.join(plugin_dir, EXTENDIUM_INSTALL_STATE_FILE)

    if fs.is_file(state_path) then
        local content, err = utils.read_file(state_path)
        if content then
            local state, decode_err = json.decode(content)
            if state then
                return state
            else
                logger:error("Error decoding install state " .. state_path .. ": " .. (decode_err or "unknown error"))
            end
        else
            logger:error("Error reading install state " .. state_path .. ": " .. (err or "unknown error"))
        end
    end

    return nil
end

---@param state table
---@return nil
function SaveInstallState(state)
    local plugin_dir = GetPluginDir()
    if not plugin_dir then
        logger:error("Failed to get plugin directory")
        return
    end

    local state_path = fs.join(plugin_dir, EXTENDIUM_INSTALL_STATE_FILE)
    local state_json = json.encode(state)

    local success, err = utils.write_file(state_path, state_json)
    if not success then
        logger:error("Error writing install state " .. state_path .. ": " .. (err or "unknown error"))
    end
end

---@param settings_json string
---@return nil
function UpdateSettings(settings_json)
    local settings = json.decode(settings_json)
    if settings then
        extendium_settings = settings
    else
        logger:error("Error decoding settings JSON")
    end
end

---@return string
function GetExtendiumInfo()
    return json.encode({
      externalLinks = GetExternalLinks(),
      installState = GetInstallState(),
      settings = extendium_settings,
    })
end

---Install the fake-header-extension into Steam's Chromium preferences
---@return string JSON result with success status
function InstallInternalExtension()
    logger:info("InstallExtension called from frontend")
    return install_extension.install()
end

---Check if the extension is currently installed
---@return string JSON result with installation status
function CheckInternalExtensionStatus()
    logger:info("CheckExtensionStatus called from frontend")
    return install_extension.check_status()
end

function CheckIfInternalExtensionIsInstalled()
    local status_result = install_extension.check_status()
    local status = json.decode(status_result)

    local install_state = GetInstallState() or {}

    if status and status.installed then
        if install_state.installAttempted then
            logger:info("Clearing previous install attempt flag")
            SaveInstallState({
                installAttempted = false,
                installFailed = false,
                lastChecked = os.time()
            })
        end
    else
        logger:info("Helper extension is not installed")

        if install_state.installAttempted then
            logger:error("Helper extension installation failed - extension not found after previous install attempt")
            SaveInstallState({
                installAttempted = true,
                installFailed = true,
                lastChecked = os.time(),
                errorMessage = "Helper extension installation failed. Please try installing manually or check logs."
            })
            millennium.call_frontend_method("showExtensionInstallationFailedDialog")

            return true
        else
            logger:info("First run - attempting to install helper extension")
            SaveInstallState({
                installAttempted = true,
                installFailed = false,
                lastChecked = os.time()
            })

            local install_result = install_extension.install()
            local result = json.decode(install_result)

            if result and result.success then
                logger:info("Helper extension installation initiated successfully")
            else
                logger:error("Helper extension installation failed: " .. (result and result.error or "unknown error"))
                SaveInstallState({
                    installAttempted = true,
                    installFailed = true,
                    lastChecked = os.time(),
                    errorMessage = result and result.error or "Installation failed with unknown error"
                })
            end
        end
    end

    return false
end

---Delete the .extensions folder
function DeleteLegacyExtensions()
    return legacy_extensions.DeleteLegacyExtensions()
end

function on_load()
    logger:info("Extendium loaded in Millennium version: " .. millennium.version())
    millennium.ready()
end

function on_frontend_loaded()
    local did_show_dialog = CheckIfInternalExtensionIsInstalled()
    if not did_show_dialog then
        legacy_extensions.HandleLegacyExtensions()
    end
end

function on_unload()
    logger:info("Extendium unloaded")
end

return {
    on_load = on_load,
    on_frontend_loaded = on_frontend_loaded,
    on_unload = on_unload,
}