-- Configuration and path helpers for extension installation

local millennium = require("millennium")
local fs = require("fs")
local json = require("json")
local utils = require("utils")
local logger = require("logger")

local M = {}

function M.is_windows()
    return jit.os == "Windows"
end

function M.get_plugin_dir()
    local backend_path = utils.get_backend_path()
    if not backend_path then
        return nil
    end
    return fs.parent_path(backend_path)
end

function M.get_extension_dir()
    local plugin_dir = M.get_plugin_dir()
    if not plugin_dir then
        return nil
    end
    return fs.join(plugin_dir, "fake-header-extension")
end

function M.get_steam_config_dir()
    local steam_path = millennium.steam_path()
    logger:info("[install] Steam path: " .. tostring(steam_path))

    local is_win = M.is_windows()
    logger:info("[install] Platform: " .. (is_win and "Windows" or "Linux"))

    if is_win then
        -- Windows: %LOCALAPPDATA%\Steam\htmlcache\Default
        local appdata = utils.getenv("LOCALAPPDATA")
        if appdata then
            return fs.join(appdata, "Steam", "htmlcache", "Default")
        end
        return nil
    else
        -- Linux: ~/.local/share/Steam/config/htmlcache/Default
        -- Or symlink:  ~/.steam/steam/config/htmlcache/Default
        local home = utils.getenv("HOME")
        if home then
            return fs.join(home, ".steam", "steam", "config", "htmlcache", "Default")
        end
        return nil
    end
end

-- Generic JSON file reader with logging
function M.read_json_file(path, label)
    logger:info("[install] Reading " .. label .. ": " .. path)

    if not fs.exists(path) then
        logger:error("[install] " .. label .. " not found at: " .. path)
        return nil
    end

    local content, err = utils.read_file(path)
    if not content then
        logger:error("[install] Failed to read " .. label .. ": " .. (err or "unknown error"))
        return nil
    end

    local data, decode_err = json.decode(content)
    if not data then
        logger:error("[install] Failed to decode " .. label .. ": " .. (decode_err or "unknown error"))
        return nil
    end

    return data
end

function M.read_extension_keys()
    local extension_dir = M.get_extension_dir()
    if not extension_dir then
        logger:error("[install] Failed to get extension directory")
        return nil
    end

    local keys = M.read_json_file(fs.join(extension_dir, "extension-keys.json"), "extension-keys.json")
    if keys then
        logger:info("[install] Extension ID: " .. tostring(keys.extensionId))
    end
    return keys
end

function M.read_manifest()
    local extension_dir = M.get_extension_dir()
    if not extension_dir then
        logger:error("[install] Failed to get extension directory")
        return nil
    end

    local manifest = M.read_json_file(fs.join(extension_dir, "manifest.json"), "manifest.json")
    if manifest then
        logger:info("[install] Extension: " .. tostring(manifest.name) .. " v" .. tostring(manifest.version))
    end
    return manifest
end

return M
