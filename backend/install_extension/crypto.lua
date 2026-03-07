-- Crypto via libcrypto FFI (using Steam's bundled OpenSSL)

local fs = require("fs")
local ffi = require("ffi")
local logger = require("logger")

local M = {}

local crypto_lib = nil
local ffi_cdef_done = false

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
function M.compute_hmac_sha256(key_bytes, message)
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
function M.hex_to_bytes(hex_str)
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

return M
