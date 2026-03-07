-- Steam Extension Installer for Millennium
-- Installs the fake-header-extension into Steam's Chromium preferences

local millennium = require("millennium")
local fs = require("fs")
local json = require("json")
local utils = require("utils")
local logger = require("logger")
local ffi = require("ffi")

local M = {}

-- Helper to create empty arrays that serialize as [] not {}
-- cjson treats tables with no elements ambiguously, this ensures array serialization
local function empty_array()
    local arr = {}
    local mt = { __jsontype = "array" }
    setmetatable(arr, mt)
    return arr
end

-- Normalize path separators for Windows (ensure backslashes)
local function normalize_path_for_windows(path)
    if not path then return path end
    -- Replace forward slashes with backslashes for Windows
    return path:gsub("/", "\\")
end

-- ============================================================================
-- Configuration
-- ============================================================================

local function get_plugin_dir()
    local backend_path = utils.get_backend_path()
    if not backend_path then
        return nil
    end
    return fs.parent_path(backend_path)
end

local function get_extension_dir()
    local plugin_dir = get_plugin_dir()
    if not plugin_dir then
        return nil
    end
    return fs.join(plugin_dir, "fake-header-extension")
end

local function is_windows()
    -- Detect platform by checking for Windows-style path
    local steam_path = millennium.steam_path()
    return steam_path:match("^%a:") ~= nil
end

local function get_steam_config_dir()
    local steam_path = millennium.steam_path()
    logger:info("[install] Steam path: " .. tostring(steam_path))

    local is_win = is_windows()  -- Call the function!
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
        local home = utils.getenv("HOME")
        if home then
            return fs.join(home, ".local", "share", "Steam", "config", "htmlcache", "Default")
        end
        return nil
    end
end



-- ============================================================================
-- Extension ID (read from pre-generated keys file)
-- ============================================================================

local function read_extension_keys()
    local extension_dir = get_extension_dir()
    if not extension_dir then
        logger:error("[install] Failed to get extension directory")
        return nil
    end

    local keys_path = fs.join(extension_dir, "extension-keys.json")
    logger:info("[install] Looking for keys at: " .. keys_path)

    if not fs.exists(keys_path) then
        logger:error("[install] extension-keys.json not found. Run generate-extension-keys.ts first!")
        return nil
    end

    local content, err = utils.read_file(keys_path)
    if not content then
        logger:error("[install] Failed to read keys: " .. (err or "unknown error"))
        return nil
    end

    local keys, decode_err = json.decode(content)
    if not keys then
        logger:error("[install] Failed to decode keys: " .. (decode_err or "unknown error"))
        return nil
    end

    logger:info("[install] Extension ID: " .. tostring(keys.extensionId))
    return keys
end

local function read_manifest()
    local extension_dir = get_extension_dir()
    if not extension_dir then
        logger:error("[install] Failed to get extension directory")
        return nil
    end

    local manifest_path = fs.join(extension_dir, "manifest.json")
    logger:info("[install] Reading manifest: " .. manifest_path)

    if not fs.exists(manifest_path) then
        logger:error("[install] manifest.json not found at: " .. manifest_path)
        return nil
    end

    local content, err = utils.read_file(manifest_path)
    if not content then
        logger:error("[install] Failed to read manifest: " .. (err or "unknown error"))
        return nil
    end

    local manifest, decode_err = json.decode(content)
    if not manifest then
        logger:error("[install] Failed to decode manifest: " .. (decode_err or "unknown error"))
        return nil
    end

    logger:info("[install] Extension: " .. tostring(manifest.name) .. " v" .. tostring(manifest.version))
    return manifest
end

-- ============================================================================
-- Windows HMAC Support
-- ============================================================================

local function get_windows_sid()
    if not is_windows() then
        return ""
    end

    logger:info("[install] Getting Windows SID...")

    local cmd = 'powershell -Command "[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value"'
    local output, status = utils.exec(cmd)

    if not output then
        logger:error("[install] Failed to get Windows SID: " .. tostring(status))
        return ""
    end

    local sid = utils.trim(output)
    logger:info("[install] Raw SID: " .. sid)

    -- SID format: S-1-5-21-XXXXXXXXXX-XXXXXXXXXX-XXXXXXXXXX-XXXX
    -- Remove the last RID component (as extloader does)
    if utils.startswith(sid, "S-1-") then
        local parts = utils.split(sid, "-")
        -- Remove last element
        table.remove(parts)
        sid = utils.join(parts, "-")
        logger:info("[install] SID (without RID): " .. sid)
        return sid
    end

    logger:warn("[install] SID doesn't match expected format")
    return ""
end

-- ============================================================================
-- Crypto via libcrypto FFI (using Steam's bundled OpenSSL)
-- ============================================================================

local crypto_lib = nil

-- Load libcrypto from Steam's bundled location
local function load_libcrypto()
    if crypto_lib then return crypto_lib end

    local paths = {
        "C:\\Program Files (x86)\\Steam\\ext\\data\\pyx64\\libcrypto-3.dll",
        "C:\\Program Files (x86)\\Steam\\ext\\data\\pyx64\\libcrypto-3-x64.dll",
        "C:\\Program Files (x86)\\Steam\\ext\\data\\cache\\libcrypto-3.dll",
        "C:\\Program Files (x86)\\Steam\\ext\\data\\cache\\libcrypto-3-x64.dll",
        "libcrypto-3-x64",  -- Try system path
        "libcrypto-3",
        "libcrypto",
    }

    for _, path in ipairs(paths) do
        if not fs.exists(path) then
            goto continue
        end

        local lib = ffi.load(path)
        if lib then
            logger:info("[install] Loaded libcrypto from: " .. path)
            crypto_lib = lib
            return lib
        end
        ::continue::
    end

    logger:error("[install] Failed to load libcrypto from any path")
    return nil
end

-- Define OpenSSL HMAC functions (only once)
local ffi_cdef_done = false
local function ensure_ffi_cdef()
    if ffi_cdef_done then return end
    ffi_cdef_done = true
    ffi.cdef[[
        typedef struct evp_md_st EVP_MD;
        typedef struct evp_md_ctx_st EVP_MD_CTX;
        typedef struct hmac_ctx_st HMAC_CTX;

        const EVP_MD *EVP_sha256(void);

        unsigned char *HMAC(
            const EVP_MD *evp_md,
            const void *key, int key_len,
            const unsigned char *data, size_t data_len,
            unsigned char *md, unsigned int *md_len
        );
    ]]
end

-- Compute HMAC-SHA256 using libcrypto
-- For Steam CEF, key is empty (zero-length)
local function compute_hmac_sha256(key_bytes, message)
    ensure_ffi_cdef()
    local lib = load_libcrypto()
    if not lib then
        logger:error("[install] libcrypto not available")
        return nil
    end

    local key_ptr = nil
    local key_len = 0
    if key_bytes and #key_bytes > 0 then
        key_ptr = ffi.cast("const void*", key_bytes)
        key_len = #key_bytes
    end

    local data = ffi.cast("const unsigned char*", message)
    local data_len = #message

    local md = ffi.new("unsigned char[32]")  -- SHA256 = 32 bytes
    local md_len = ffi.new("unsigned int[1]")

    local result = lib.HMAC(
        lib.EVP_sha256(),
        key_ptr, key_len,
        data, data_len,
        md, md_len
    )

    if result == nil then
        logger:error("[install] HMAC computation failed")
        return nil
    end

    -- Convert to uppercase hex string
    local hex = {}
    for i = 0, 31 do
        hex[i + 1] = string.format("%02X", md[i])
    end

    return table.concat(hex)
end

-- Convert hex string to bytes
local function hex_to_bytes(hex_str)
    if not hex_str or hex_str == "" then
        return ""
    end
    local bytes = {}
    for i = 1, #hex_str, 2 do
        local byte = tonumber(hex_str:sub(i, i + 1), 16)
        if byte then
            table.insert(bytes, string.char(byte))
        end
    end
    return table.concat(bytes)
end

-- ============================================================================
-- JSON Helpers for HMAC
-- ============================================================================

-- Encode JSON with sorted keys (critical for HMAC - must match JS JSON.stringify order)
local function json_encode_sorted(value)
    local t = type(value)

    if value == nil then
        return "null"
    elseif t == "boolean" then
        return value and "true" or "false"
    elseif t == "number" then
        if value == math.floor(value) and value >= -2147483648 and value <= 2147483647 then
            return string.format("%d", value)
        else
            return string.format("%.14g", value)
        end
    elseif t == "string" then
        -- Use cjson for proper string escaping
        return json.encode(value)
    elseif t == "table" then
        -- Check if array (sequential integer keys starting at 1)
        local is_array = false
        local max_idx = 0
        local count = 0
        for k, _ in pairs(value) do
            count = count + 1
            if type(k) == "number" and k == math.floor(k) and k >= 1 then
                if k > max_idx then max_idx = k end
            end
        end
        -- It's an array if all keys are sequential integers 1..n
        if count > 0 and max_idx == count then
            is_array = true
            for i = 1, max_idx do
                if value[i] == nil then
                    is_array = false
                    break
                end
            end
        end
        -- Empty table - check metatable hint
        if next(value) == nil then
            local mt = getmetatable(value)
            if mt and mt.__jsontype == "array" then
                return "[]"
            end
            -- Default empty table to object
            return "{}"
        end

        if is_array then
            local parts = {}
            for i = 1, max_idx do
                parts[i] = json_encode_sorted(value[i])
            end
            return "[" .. table.concat(parts, ",") .. "]"
        else
            -- Object - sort keys alphabetically (matches JS insertion order in our case)
            local keys = {}
            for k, v in pairs(value) do
                -- Only include string keys with non-nil values
                if type(k) == "string" and v ~= nil then
                    table.insert(keys, k)
                end
            end
            table.sort(keys)

            local parts = {}
            for _, k in ipairs(keys) do
                local v = value[k]
                -- Double-check for nil (shouldn't happen but safety net)
                if v ~= nil then
                    table.insert(parts, json.encode(k) .. ":" .. json_encode_sorted(v))
                end
            end
            return "{" .. table.concat(parts, ",") .. "}"
        end
    else
        return "null"
    end
end

-- Remove empty tables and arrays (Chromium's DeepCopyWithoutEmptyChildren)
local function remove_empty_children(obj)
    if type(obj) ~= "table" then
        return obj
    end

    -- Check if array
    local is_array = #obj > 0 or next(obj) == nil
    if is_array and #obj == 0 then
        return nil -- Empty array
    end

    local cleaned = {}
    local has_keys = false

    for k, v in pairs(obj) do
        local cleaned_v = remove_empty_children(v)
        if cleaned_v ~= nil then
            -- Skip empty tables
            if type(cleaned_v) ~= "table" or next(cleaned_v) ~= nil then
                cleaned[k] = cleaned_v
                has_keys = true
            end
        end
    end

    if not has_keys then
        return nil
    end

    return cleaned
end

-- Escape '<' in JSON string (Chromium requirement)
local function escape_json_for_hmac(json_str)
    return json_str:gsub("<", "\\u003C")
end

-- ============================================================================
-- HMAC Context
-- ============================================================================

local HmacContext = {}

function HmacContext:new(sid, seed_hex)
    local obj = {
        sid = sid or "",
        seed_hex = seed_hex or "", -- Empty for Steam CEF
        seed_bytes = hex_to_bytes(seed_hex or "")
    }
    setmetatable(obj, { __index = HmacContext })
    return obj
end

function HmacContext:compute_mac(json_path, value)
    local cleaned = remove_empty_children(value)
    -- Use sorted JSON for consistent key ordering (must match JS JSON.stringify)
    local json_value = json_encode_sorted(cleaned)
    json_value = escape_json_for_hmac(json_value)

    local message = self.sid .. json_path .. json_value
    logger:info("[install] Computing MAC for path: " .. json_path)
    logger:info("[install] Message length: " .. #message)
    logger:info("[install] JSON preview: " .. json_value:sub(1, 100) .. "...")

    local mac = compute_hmac_sha256(self.seed_bytes, message)
    if mac then
        logger:info("[install] MAC: " .. mac:sub(1, 16) .. "...")
    else
        logger:error("[install] MAC computation returned nil!")
    end
    return mac
end

function HmacContext:compute_super_mac(macs)
    -- Use sorted JSON for consistent key ordering
    local macs_json = json_encode_sorted(macs)
    local message = self.sid .. macs_json

    logger:info("[install] Computing super MAC...")
    logger:info("[install] MACs JSON: " .. macs_json:sub(1, 100) .. "...")

    local mac = compute_hmac_sha256(self.seed_bytes, message)
    if mac then
        logger:info("[install] Super MAC: " .. mac:sub(1, 16) .. "...")
    else
        logger:error("[install] Super MAC computation returned nil!")
    end
    return mac
end

-- ============================================================================
-- Windows File Time
-- ============================================================================

local function get_windows_file_time()
    -- FILETIME: 100-nanosecond intervals since January 1, 1601
    local epoch_diff = 11644473600 -- seconds between 1601 and 1970
    local now = utils.time() -- current Unix timestamp in seconds
    local windows_time = (now + epoch_diff) * 10000000 -- convert to 100-ns intervals
    return string.format("%.0f", windows_time)
end

-- ============================================================================
-- Extension Settings Builder
-- ============================================================================

local function build_extension_settings(extension_dir, manifest)
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
            api = #api_permissions > 0 and api_permissions or empty_array(),
            explicit_host = { "<all_urls>" },
            manifest_permissions = empty_array(),
            scriptable_host = { "<all_urls>" },
        },
        commands = {},
        content_settings = empty_array(),
        creation_flags = 38,
        first_install_time = file_time,
        from_webstore = false,
        granted_permissions = {
            api = #api_permissions > 0 and api_permissions or empty_array(),
            explicit_host = { "<all_urls>" },
            manifest_permissions = empty_array(),
            scriptable_host = { "<all_urls>" },
        },
        incognito_content_settings = empty_array(),
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

-- ============================================================================
-- Main Installation Logic
-- ============================================================================

function M.install()
    logger:info("========================================")
    logger:info("[install] Starting extension installation...")
    logger:info("========================================")

    -- Get paths
    local extension_dir = get_extension_dir()
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
    local keys = read_extension_keys()
    if not keys or not keys.extensionId then
        return json.encode({ success = false, error = "Failed to read extension keys" })
    end
    local extension_id = keys.extensionId

    -- Read manifest
    local manifest = read_manifest()
    if not manifest then
        return json.encode({ success = false, error = "Failed to read manifest" })
    end

    -- Get Steam config directory
    local config_dir = get_steam_config_dir()
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

    -- Normalize path separators for Windows (ensure backslashes)
    -- if is_windows() then
    --     extension_dir = normalize_path_for_windows(extension_dir)
    --     logger:info("[install] Normalized Windows path: " .. extension_dir)
    -- end

    -- Build extension settings
    local extension_settings = build_extension_settings(extension_dir, manifest)
    logger:info("[install] Built extension settings")

    -- Initialize HMAC context (Windows only)
    local hmac_ctx = nil
    if is_windows() then
        logger:info("[install] Initializing HMAC context for Windows...")
        local sid = get_windows_sid()
        if sid and sid ~= "" then
            -- Steam CEF uses empty seed (like Edge/Brave)
            hmac_ctx = HmacContext:new(sid, "")
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

    -- Read Preferences
    local prefs = {}
    if fs.exists(prefs_path) then
        local content, err = utils.read_file(prefs_path)
        if content then
            local decoded, decode_err = json.decode(content)
            if decoded then
                prefs = decoded
                logger:info("[install] Loaded existing Preferences")
            else
                logger:warn("[install] Failed to decode Preferences: " .. (decode_err or "unknown"))
            end
        else
            logger:warn("[install] Failed to read Preferences: " .. (err or "unknown"))
        end
    else
        logger:warn("[install] Preferences not found, will create new")
    end

    -- Read Secure Preferences
    local secure_prefs = nil
    local has_secure_prefs = fs.exists(secure_prefs_path)
    if has_secure_prefs then
        local content, err = utils.read_file(secure_prefs_path)
        if content then
            local decoded, decode_err = json.decode(content)
            if decoded then
                secure_prefs = decoded
                logger:info("[install] Loaded existing Secure Preferences")
            else
                logger:warn("[install] Failed to decode Secure Preferences: " .. (decode_err or "unknown"))
                secure_prefs = {}
            end
        else
            logger:warn("[install] Failed to read Secure Preferences: " .. (err or "unknown"))
            secure_prefs = {}
        end
    else
        logger:info("[install] Secure Preferences not found, will skip")
    end

    -- Compute HMACs if needed (Windows only) - do this BEFORE modifying prefs
    local ext_mac = nil
    local dev_mode_mac = nil
    local secure_ext_mac = nil
    local secure_dev_mode_mac = nil
    local secure_super_mac = nil

    if hmac_ctx then
        logger:info("[install] Computing HMAC signatures...")
        ext_mac = hmac_ctx:compute_mac("extensions.settings." .. extension_id, extension_settings)
        if ext_mac then logger:info("[install] Extension MAC computed") end

        dev_mode_mac = hmac_ctx:compute_mac("extensions.ui.developer_mode", true)
        if dev_mode_mac then logger:info("[install] Developer mode MAC computed") end

        -- For secure prefs, we need the super_mac computed after setting up macs structure
        if has_secure_prefs then
            secure_ext_mac = ext_mac  -- Same MAC for both files
            secure_dev_mode_mac = dev_mode_mac
        end
    end

    -- Set up Preferences structure
    if not prefs.extensions then prefs.extensions = {} end
    if not prefs.extensions.settings then prefs.extensions.settings = {} end
    if not prefs.extensions.ui then prefs.extensions.ui = {} end
    prefs.extensions.ui.developer_mode = true
    prefs.extensions.settings[extension_id] = extension_settings

    if hmac_ctx then
        if not prefs.protection then prefs.protection = {} end
        if not prefs.protection.macs then prefs.protection.macs = {} end
        if not prefs.protection.macs.extensions then prefs.protection.macs.extensions = {} end
        if not prefs.protection.macs.extensions.settings then prefs.protection.macs.extensions.settings = {} end
        if not prefs.protection.ui then prefs.protection.ui = {} end

        if ext_mac then prefs.protection.macs.extensions.settings[extension_id] = ext_mac end
        if dev_mode_mac then prefs.protection.ui.developer_mode = dev_mode_mac end
    end

    -- Set up Secure Preferences structure
    if secure_prefs then
        if not secure_prefs.extensions then secure_prefs.extensions = {} end
        if not secure_prefs.extensions.settings then secure_prefs.extensions.settings = {} end
        if not secure_prefs.extensions.ui then secure_prefs.extensions.ui = {} end
        secure_prefs.extensions.ui.developer_mode = true
        secure_prefs.extensions.settings[extension_id] = extension_settings

        if hmac_ctx then
            if not secure_prefs.protection then secure_prefs.protection = {} end
            if not secure_prefs.protection.macs then secure_prefs.protection.macs = {} end
            if not secure_prefs.protection.macs.extensions then secure_prefs.protection.macs.extensions = {} end
            if not secure_prefs.protection.macs.extensions.settings then secure_prefs.protection.macs.extensions.settings = {} end
            if not secure_prefs.protection.ui then secure_prefs.protection.ui = {} end

            if secure_ext_mac then secure_prefs.protection.macs.extensions.settings[extension_id] = secure_ext_mac end
            if secure_dev_mode_mac then secure_prefs.protection.ui.developer_mode = secure_dev_mode_mac end

            -- Super MAC for Secure Preferences
            secure_super_mac = hmac_ctx:compute_super_mac(secure_prefs.protection.macs)
            if secure_super_mac then
                secure_prefs.protection.super_mac = secure_super_mac
                logger:info("[install] Super MAC computed")
            end
        end
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
    local success, write_err = utils.write_file(prefs_path, prefs_json)
    if not success then
        logger:error("[install] Failed to write Preferences: " .. (write_err or "unknown"))
        return json.encode({ success = false, error = "Failed to write Preferences" })
    end
    logger:info("[install] Preferences written")

    -- Write Secure Preferences
    if secure_prefs_json then
        success, write_err = utils.write_file(secure_prefs_path, secure_prefs_json)
        if not success then
            logger:error("[install] Failed to write Secure Preferences: " .. (write_err or "unknown"))
            return json.encode({ success = false, error = "Failed to write Secure Preferences" })
        end
        logger:info("[install] Secure Preferences written")
    end

    -- Kill Steam webhelper IMMEDIATELY after writing
    if is_windows() then
        utils.exec('taskkill /F /IM steamwebhelper.exe')
    else
        utils.exec('pkill -f steamwebhelper')
    end
    logger:info("[install] Steam webhelper killed")

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

-- ============================================================================
-- Check Installation Status
-- ============================================================================

function M.check_status()
    logger:info("[install] Checking installation status...")

    local keys = read_extension_keys()
    if not keys or not keys.extensionId then
        return json.encode({ installed = false, error = "Extension keys not found" })
    end

    local config_dir = get_steam_config_dir()
    if not config_dir then
        return json.encode({ installed = false, error = "Steam config directory not found" })
    end

    local prefs_path = fs.join(config_dir, "Preferences")
    if not fs.exists(prefs_path) then
        return json.encode({ installed = false, error = "Preferences file not found" })
    end

    local content, err = utils.read_file(prefs_path)
    if not content then
        return json.encode({ installed = false, error = "Failed to read Preferences" })
    end

    local prefs, decode_err = json.decode(content)
    if not prefs then
        return json.encode({ installed = false, error = "Failed to parse Preferences" })
    end

    local installed = prefs.extensions ~= nil and
                      prefs.extensions.settings ~= nil and
                      prefs.extensions.settings[keys.extensionId] ~= nil

    logger:info("[install] Installation status: " .. (installed and "installed" or "not installed"))

    return json.encode({
        installed = installed,
        extensionId = keys.extensionId
    })
end

return M
