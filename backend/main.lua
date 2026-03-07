local millennium = require("millennium")
local fs = require("fs")
local json = require("json")
local utils = require("utils")
local logger = require("logger")
local install_extension = require("install_extension.init")

local EXTENDIUM_EXTERNAL_LINKS_FILE = "external-links.json"

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
        return {}
    end

    local external_links_path = fs.join(plugin_dir, EXTENDIUM_EXTERNAL_LINKS_FILE)

    if fs.is_file(external_links_path) then
        local content, err = utils.read_file(external_links_path)
        if content then
            local external_links, decode_err = json.decode(content)
            if external_links then
                return external_links
            else
                logger:error("Error decoding external links " .. external_links_path .. ": " .. (decode_err or "unknown error"))
            end
        else
            logger:error("Error reading external links " .. external_links_path .. ": " .. (err or "unknown error"))
        end
    end

    return nil
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

---@return string
function GetExtendiumInfo()
    return json.encode({
      externalLinks = GetExternalLinks(),
    })
end

---Install the fake-header-extension into Steam's Chromium preferences
---@return string JSON result with success status
function InstallExtension()
    logger:info("InstallExtension called from frontend")
    return install_extension.install()
end

---Check if the extension is currently installed
---@return string JSON result with installation status
function CheckExtensionStatus()
    logger:info("CheckExtensionStatus called from frontend")
    return install_extension.check_status()
end

function on_load()
    millennium.ready()
end

function on_frontend_loaded()
end

return {
    on_load = on_load,
    on_frontend_loaded = on_frontend_loaded,
}