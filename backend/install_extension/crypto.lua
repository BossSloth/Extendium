-- Pure Lua HMAC-SHA256 implementation (no external dependencies)

local M = {}

-- SHA-256 constants
local K = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
}

-- Bitwise operations for Lua 5.1/5.2 compatibility
local function rshift(n, bits)
    return math.floor(n / (2 ^ bits))
end

local function lshift(n, bits)
    return (n * (2 ^ bits)) % (2 ^ 32)
end

local function bxor(a, b)
    local result = 0
    local bit = 1
    for i = 1, 32 do
        if (a % 2) ~= (b % 2) then
            result = result + bit
        end
        a = math.floor(a / 2)
        b = math.floor(b / 2)
        bit = bit * 2
    end
    return result
end

local function band(a, b)
    local result = 0
    local bit = 1
    for i = 1, 32 do
        if (a % 2) == 1 and (b % 2) == 1 then
            result = result + bit
        end
        a = math.floor(a / 2)
        b = math.floor(b / 2)
        bit = bit * 2
    end
    return result
end

local function bnot(n)
    return (2 ^ 32 - 1) - n
end

local function rotr(n, bits)
    return bxor(rshift(n, bits), lshift(n, 32 - bits))
end

-- SHA-256 functions
local function Ch(x, y, z)
    return bxor(band(x, y), band(bnot(x), z))
end

local function Maj(x, y, z)
    return bxor(bxor(band(x, y), band(x, z)), band(y, z))
end

local function Sigma0(x)
    return bxor(bxor(rotr(x, 2), rotr(x, 13)), rotr(x, 22))
end

local function Sigma1(x)
    return bxor(bxor(rotr(x, 6), rotr(x, 11)), rotr(x, 25))
end

local function sigma0(x)
    return bxor(bxor(rotr(x, 7), rotr(x, 18)), rshift(x, 3))
end

local function sigma1(x)
    return bxor(bxor(rotr(x, 17), rotr(x, 19)), rshift(x, 10))
end

-- Convert string to array of 32-bit words
local function str_to_words(str)
    local words = {}
    for i = 1, #str, 4 do
        local b1 = string.byte(str, i) or 0
        local b2 = string.byte(str, i + 1) or 0
        local b3 = string.byte(str, i + 2) or 0
        local b4 = string.byte(str, i + 3) or 0
        words[#words + 1] = lshift(b1, 24) + lshift(b2, 16) + lshift(b3, 8) + b4
    end
    return words
end

-- Convert 32-bit words to string
local function words_to_str(words)
    local bytes = {}
    for i = 1, #words do
        local w = words[i]
        bytes[#bytes + 1] = string.char(
            band(rshift(w, 24), 0xFF),
            band(rshift(w, 16), 0xFF),
            band(rshift(w, 8), 0xFF),
            band(w, 0xFF)
        )
    end
    return table.concat(bytes)
end

-- SHA-256 hash function
local function sha256(message)
    -- Initial hash values
    local H = {
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    }

    -- Pre-processing
    local msg_len = #message
    local msg = message .. string.char(0x80)

    -- Pad to 448 bits (56 bytes) mod 512 bits (64 bytes)
    local pad_len = 56 - (#msg % 64)
    if pad_len < 0 then pad_len = pad_len + 64 end
    msg = msg .. string.rep(string.char(0), pad_len)

    -- Append length as 64-bit big-endian
    local bit_len = msg_len * 8
    msg = msg .. string.char(0, 0, 0, 0) .. string.char(
        band(rshift(bit_len, 24), 0xFF),
        band(rshift(bit_len, 16), 0xFF),
        band(rshift(bit_len, 8), 0xFF),
        band(bit_len, 0xFF)
    )

    -- Process message in 512-bit chunks
    for chunk_start = 1, #msg, 64 do
        local chunk = msg:sub(chunk_start, chunk_start + 63)
        local W = str_to_words(chunk)

        -- Extend the first 16 words into the remaining 48 words
        for i = 17, 64 do
            W[i] = (sigma1(W[i - 2]) + W[i - 7] + sigma0(W[i - 15]) + W[i - 16]) % (2 ^ 32)
        end

        -- Initialize working variables
        local a, b, c, d, e, f, g, h = H[1], H[2], H[3], H[4], H[5], H[6], H[7], H[8]

        -- Main loop
        for i = 1, 64 do
            local T1 = (h + Sigma1(e) + Ch(e, f, g) + K[i] + W[i]) % (2 ^ 32)
            local T2 = (Sigma0(a) + Maj(a, b, c)) % (2 ^ 32)
            h = g
            g = f
            f = e
            e = (d + T1) % (2 ^ 32)
            d = c
            c = b
            b = a
            a = (T1 + T2) % (2 ^ 32)
        end

        -- Add to hash values
        H[1] = (H[1] + a) % (2 ^ 32)
        H[2] = (H[2] + b) % (2 ^ 32)
        H[3] = (H[3] + c) % (2 ^ 32)
        H[4] = (H[4] + d) % (2 ^ 32)
        H[5] = (H[5] + e) % (2 ^ 32)
        H[6] = (H[6] + f) % (2 ^ 32)
        H[7] = (H[7] + g) % (2 ^ 32)
        H[8] = (H[8] + h) % (2 ^ 32)
    end

    return words_to_str(H)
end

-- HMAC-SHA256 implementation
function M.compute_hmac_sha256(key_bytes, message)
    local key = key_bytes or ""

    -- Keys longer than block size are shortened by hashing them
    if #key > 64 then
        key = sha256(key)
    end

    -- Keys shorter than block size are padded to block size by padding with zeros
    if #key < 64 then
        key = key .. string.rep(string.char(0), 64 - #key)
    end

    -- Outer and inner padded keys
    local o_key_pad = {}
    local i_key_pad = {}
    for i = 1, 64 do
        local byte = string.byte(key, i)
        o_key_pad[i] = string.char(bxor(byte, 0x5c))
        i_key_pad[i] = string.char(bxor(byte, 0x36))
    end
    local o_key_pad_str = table.concat(o_key_pad)
    local i_key_pad_str = table.concat(i_key_pad)

    -- HMAC = H(o_key_pad || H(i_key_pad || message))
    local inner_hash = sha256(i_key_pad_str .. message)
    local hmac = sha256(o_key_pad_str .. inner_hash)

    -- Convert to uppercase hex string
    local hex = {}
    for i = 1, #hmac do
        hex[i] = string.format("%02X", string.byte(hmac, i))
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
