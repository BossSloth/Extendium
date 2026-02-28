---@meta

---Millennium module for Steam plugin development
---@class millennium
local millennium = {}

---Plugin log entry
---@class PluginLogEntry
---@field message string Base64 encoded log message
---@field level integer Log level (0=debug, 1=info, 2=warn, 3=error)

---Plugin logs collection
---@class PluginLogs
---@field name string Display name of the plugin
---@field logs PluginLogEntry[] Array of log entries for this plugin

---Called one time after your plugin has finished bootstrapping.
---Used to let Millennium know what plugins crashed/loaded etc.
---@return boolean success True if the ready message was sent successfully
function millennium.ready() end

---Add a CSS file to the browser webkit hook list
---@param moduleItem string Path to CSS file relative to steamui directory
---@param regexSelector? string Regex pattern for URL matching (default: ".*")
---@return integer moduleId Module ID for later removal, or 0 on failure
function millennium.add_browser_css(moduleItem, regexSelector) end

---Add a JavaScript file to the browser webkit hook list
---@param moduleItem string Path to JS file relative to steamui directory
---@param regexSelector? string Regex pattern for URL matching (default: ".*")
---@return integer moduleId Module ID for later removal, or 0 on failure
function millennium.add_browser_js(moduleItem, regexSelector) end

---Remove a CSS or JavaScript file using the ModuleID from add_browser_js/css
---@param moduleId integer Module ID returned from add_browser_css or add_browser_js
---@return boolean success True if module was successfully removed
function millennium.remove_browser_module(moduleId) end

---Get user settings (not implemented yet, will likely be removed)
---@deprecated This function is not implemented and may be removed
---@return any
function millennium.get_user_settings() end

---Set user settings key (not implemented yet, will likely be removed)
---@deprecated This function is not implemented and may be removed
---@return any
function millennium.set_user_settings_key() end

---Get the version of Millennium in semantic versioning format
---@return string version Millennium version string (e.g., "1.0.0")
function millennium.version() end

---Get the path to the Steam directory
---@return string steamPath Full path to Steam installation directory
function millennium.steam_path() end

---Get the path to the Millennium install directory
---@return string installPath Full path to Millennium installation directory
function millennium.get_install_path() end

---Get all current stored logs from all loaded and previously loaded plugins during this instance
---@return string logsJson JSON string containing array of PluginLogs objects
function millennium.get_plugin_logs() end

---Call a JavaScript method on the frontend
---@param methodName string Name of the method to call on the frontend
---@param params? (string|number|boolean)[] Array of parameters (only string, number, boolean supported)
---@return any result Result from the frontend method call
function millennium.call_frontend_method(methodName, params) end

---Toggle the status of a plugin (Use with caution, this is an internal function and may change without notice)
---@param pluginName string Name of the plugin to toggle
---@return any result Result of the toggle operation
function millennium.change_plugin_status(pluginName) end

---Check if a plugin is enabled (Use with caution, this is an internal function and may change without notice)
---@param pluginName string Name of the plugin to check
---@return boolean enabled True if the plugin is enabled
function millennium.is_plugin_enabled(pluginName) end

---Get the build date of Millennium (Use with caution, this is an internal function and may change without notice)
---@return string buildDate Build timestamp string
function millennium.__internal_get_build_date() end

--- Compare two semantic versions against one another. Very useful when you need to conditionally add features depending on the version of Millennium.
---
--- Example: If there is a API function "new_call" introduced in Millennium 2.30.0 and up, you can check if the function is available on the users installation with
---```lua
--- millennium.cmp_version(millennium.version(), "2.30.0") >= 0
--- ```
---
---@param version1 string The first version to compare
---@param version2 string version2
---@return number status -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2, -2 if there was an error parsing or comparing versions.
function millennium.cmp_version(version1, version2) end

return millennium
