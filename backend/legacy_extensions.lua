
local json = require("json")
local fs = require("fs")
local utils = require("utils")
local logger = require("logger")
local millennium = require("millennium")

local M = {}

function M.HandleLegacyExtensions()
    local plugin_dir = GetPluginDir()
    if not plugin_dir then
        logger:error("Failed to get plugin directory")
        return json.encode({ error = "Failed to get plugin directory" })
    end

    local extensions_dir = fs.join(plugin_dir, ".extensions")

    if not fs.exists(extensions_dir) or not fs.is_directory(extensions_dir) then
        return json.encode({})
    end

    local extensions = {}
    local entries, err = fs.list(extensions_dir)

    if entries then
        for _, entry in ipairs(entries) do
            if entry.is_directory then
                local metadata_path = fs.join(entry.path, "metadata.json")
                local extension_data = {
                    name = string.gsub(entry.name, '-', ' '),
                    hasMetadata = false
                }

                if fs.is_file(metadata_path) then
                    local content, err = utils.read_file(metadata_path)
                    if content then
                        local metadata, decode_err = json.decode(content)
                        if metadata then
                            extension_data.hasMetadata = true
                            extension_data.extensionId = metadata.extensionId
                            extension_data.url = metadata.url
                        else
                            logger:warn("Failed to decode metadata for " .. entry .. ": " .. (decode_err or "unknown error"))
                        end
                    else
                        logger:warn("Failed to read metadata for " .. entry .. ": " .. (err or "unknown error"))
                    end
                end

                table.insert(extensions, extension_data)
            end
        end
    end

    if #extensions == 0 then
      return
    end

    logger:info("Found " .. #extensions .. " legacy extensions")

    local extensions_json = json.encode(extensions)
    millennium.call_frontend_method("showLegacyExtensionDialog", {extensions_json})
end

---Delete the .extensions folder
function M.DeleteLegacyExtensions()
    local plugin_dir = GetPluginDir()
    if not plugin_dir then
        logger:error("Failed to get plugin directory")
    end

    local extensions_dir = fs.join(plugin_dir, ".extensions")

    if not fs.exists(extensions_dir) or not fs.is_directory(extensions_dir) then
        return
    end

    local count, err = fs.remove_all(extensions_dir)
    if count then
        logger:info("Deleted legacy extensions folder: " .. count .. " items removed")
    else
        logger:error("Failed to delete legacy extensions folder: " .. (err or "unknown error"))
    end
end

return M