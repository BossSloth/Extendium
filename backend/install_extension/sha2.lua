--------------------------------------------------------------------------------------------------------------------------
-- sha2.lua (Minimal version for HMAC-SHA256)
-- AUTHOR:  Egor Skriptunoff
-- LICENSE: MIT (the same license as Lua itself)
-- URL:     https://github.com/Egor-Skriptunoff/pure_lua_SHA
-- Only contains sha256 and hmac functions for use with hmac.lua
-- Optimized for LuaJIT 5.1
--------------------------------------------------------------------------------------------------------------------------

local unpack, table_concat, byte, char, string_rep, sub, gsub, string_format, floor =
   table.unpack or unpack, table.concat, string.byte, string.char, string.rep, string.sub, string.gsub, string.format, math.floor

--------------------------------------------------------------------------------
-- BRANCH DETECTION (LuaJIT)
--------------------------------------------------------------------------------

local is_LuaJIT = jit and jit.version
local branch = is_LuaJIT and "LJ" or "EMUL"

--------------------------------------------------------------------------------
-- BITWISE OPERATORS (LJ branch)
--------------------------------------------------------------------------------

local AND, OR, XOR, SHL, SHR, ROL, ROR, NOT, NORM, HEX, XOR_BYTE

if branch == "LJ" then
   local b = bit or bit32
   local library_name = b and (b.bit32 and "bit32" or "bit")
   AND  = b.band
   OR   = b.bor
   XOR  = b.bxor
   SHL  = b.lshift
   SHR  = b.rshift
   ROL  = b.rol or b.lrotate
   ROR  = b.ror or b.rrotate
   NOT  = b.bnot
   NORM = b.tobit
   HEX  = b.tohex
   XOR_BYTE = XOR
else
   error("This minimal sha2.lua only supports LuaJIT with bit library")
end

--------------------------------------------------------------------------------
-- DATA TABLES
--------------------------------------------------------------------------------

local sha2_K_hi, sha2_H_hi = {}, {}
local sha2_H_ext256 = {[224] = {}, [256] = sha2_H_hi}
local common_W = {}
local K_lo_modulo = 4294967296

--------------------------------------------------------------------------------
-- MAGIC NUMBERS CALCULATOR (for SHA-256 constants)
--------------------------------------------------------------------------------

do
   local function mul(src1, src2, factor, result_length)
      local result, carry, value, weight = {}, 0.0, 0.0, 1.0
      for j = 1, result_length do
         for k = math.max(1, j + 1 - #src2), math.min(j, #src1) do
            carry = carry + factor * src1[k] * src2[j + 1 - k]
         end
         local digit = carry % 2^24
         result[j] = floor(digit)
         carry = (carry - digit) / 2^24
         value = value + digit * weight
         weight = weight * 2^24
      end
      return result, value
   end

   local idx, step, p, one, sqrt_hi = 0, {4, 1, 2, -2, 2}, 4, {1}, sha2_H_hi
   repeat
      p = p + step[p % 6]
      local d = 1
      repeat
         d = d + step[d % 6]
         if d*d > p then
            local root = p^(1/3)
            local R = root * 2^40
            R = mul({R - R % 1}, one, 1.0, 2)
            local _, delta = mul(R, mul(R, R, 1.0, 4), -1.0, 4)
            local hi = R[2] % 65536 * 65536 + floor(R[1] / 256)
            local lo = R[1] % 256 * 16777216 + floor(delta * (2^-56 / 3) * root / p)
            if idx < 8 then
               root = p^(1/2)
               R = root * 2^40
               R = mul({R - R % 1}, one, 1.0, 2)
               _, delta = mul(R, R, -1.0, 2)
               local hi = R[2] % 65536 * 65536 + floor(R[1] / 256)
               local lo = R[1] % 256 * 16777216 + floor(delta * 2^-17 / root)
               local idx = idx % 8 + 1
               sha2_H_ext256[224][idx] = lo
               sqrt_hi[idx] = hi
            end
            idx = idx + 1
            sha2_K_hi[idx] = hi
            break
         end
      until p % d == 0
   until idx > 63
end

--------------------------------------------------------------------------------
-- SHA256 FEED FUNCTION (LJ branch)
--------------------------------------------------------------------------------

function sha256_feed_64(H, str, offs, size)
   local W, K = common_W, sha2_K_hi
   for pos = offs, offs + size - 1, 64 do
      for j = 1, 16 do
         pos = pos + 4
         local a, b, c, d = byte(str, pos - 3, pos)
         W[j] = OR(SHL(a, 24), SHL(b, 16), SHL(c, 8), d)
      end
      for j = 17, 64 do
         local a, b = W[j-15], W[j-2]
         W[j] = NORM( NORM( XOR(ROR(a, 7), ROL(a, 14), SHR(a, 3)) + XOR(ROL(b, 15), ROL(b, 13), SHR(b, 10)) ) + NORM( W[j-7] + W[j-16] ) )
      end
      local a, b, c, d, e, f, g, h = H[1], H[2], H[3], H[4], H[5], H[6], H[7], H[8]
      for j = 1, 64, 8 do
         local z = NORM( XOR(ROR(e, 6), ROR(e, 11), ROL(e, 7)) + XOR(g, AND(e, XOR(f, g))) + (K[j] + W[j] + h) )
         h, g, f, e = g, f, e, NORM(d + z)
         d, c, b, a = c, b, a, NORM( XOR(AND(a, XOR(b, c)), AND(b, c)) + XOR(ROR(a, 2), ROR(a, 13), ROL(a, 10)) + z )
         z = NORM( XOR(ROR(e, 6), ROR(e, 11), ROL(e, 7)) + XOR(g, AND(e, XOR(f, g))) + (K[j+1] + W[j+1] + h) )
         h, g, f, e = g, f, e, NORM(d + z)
         d, c, b, a = c, b, a, NORM( XOR(AND(a, XOR(b, c)), AND(b, c)) + XOR(ROR(a, 2), ROR(a, 13), ROL(a, 10)) + z )
         z = NORM( XOR(ROR(e, 6), ROR(e, 11), ROL(e, 7)) + XOR(g, AND(e, XOR(f, g))) + (K[j+2] + W[j+2] + h) )
         h, g, f, e = g, f, e, NORM(d + z)
         d, c, b, a = c, b, a, NORM( XOR(AND(a, XOR(b, c)), AND(b, c)) + XOR(ROR(a, 2), ROR(a, 13), ROL(a, 10)) + z )
         z = NORM( XOR(ROR(e, 6), ROR(e, 11), ROL(e, 7)) + XOR(g, AND(e, XOR(f, g))) + (K[j+3] + W[j+3] + h) )
         h, g, f, e = g, f, e, NORM(d + z)
         d, c, b, a = c, b, a, NORM( XOR(AND(a, XOR(b, c)), AND(b, c)) + XOR(ROR(a, 2), ROR(a, 13), ROL(a, 10)) + z )
         z = NORM( XOR(ROR(e, 6), ROR(e, 11), ROL(e, 7)) + XOR(g, AND(e, XOR(f, g))) + (K[j+4] + W[j+4] + h) )
         h, g, f, e = g, f, e, NORM(d + z)
         d, c, b, a = c, b, a, NORM( XOR(AND(a, XOR(b, c)), AND(b, c)) + XOR(ROR(a, 2), ROR(a, 13), ROL(a, 10)) + z )
         z = NORM( XOR(ROR(e, 6), ROR(e, 11), ROL(e, 7)) + XOR(g, AND(e, XOR(f, g))) + (K[j+5] + W[j+5] + h) )
         h, g, f, e = g, f, e, NORM(d + z)
         d, c, b, a = c, b, a, NORM( XOR(AND(a, XOR(b, c)), AND(b, c)) + XOR(ROR(a, 2), ROR(a, 13), ROL(a, 10)) + z )
         z = NORM( XOR(ROR(e, 6), ROR(e, 11), ROL(e, 7)) + XOR(g, AND(e, XOR(f, g))) + (K[j+6] + W[j+6] + h) )
         h, g, f, e = g, f, e, NORM(d + z)
         d, c, b, a = c, b, a, NORM( XOR(AND(a, XOR(b, c)), AND(b, c)) + XOR(ROR(a, 2), ROR(a, 13), ROL(a, 10)) + z )
         z = NORM( XOR(ROR(e, 6), ROR(e, 11), ROL(e, 7)) + XOR(g, AND(e, XOR(f, g))) + (K[j+7] + W[j+7] + h) )
         h, g, f, e = g, f, e, NORM(d + z)
         d, c, b, a = c, b, a, NORM( XOR(AND(a, XOR(b, c)), AND(b, c)) + XOR(ROR(a, 2), ROR(a, 13), ROL(a, 10)) + z )
      end
      H[1], H[2], H[3], H[4] = NORM(a + H[1]), NORM(b + H[2]), NORM(c + H[3]), NORM(d + H[4])
      H[5], H[6], H[7], H[8] = NORM(e + H[5]), NORM(f + H[6]), NORM(g + H[7]), NORM(h + H[8])
   end
end

--------------------------------------------------------------------------------
-- MAIN FUNCTIONS
--------------------------------------------------------------------------------

local function sha256ext(width, message)
   local H, length, tail = {unpack(sha2_H_ext256[width])}, 0.0, ""

   local function partial(message_part)
      if message_part then
         if tail then
            length = length + #message_part
            local offs = 0
            if tail ~= "" and #tail + #message_part >= 64 then
               offs = 64 - #tail
               sha256_feed_64(H, tail..sub(message_part, 1, offs), 0, 64)
               tail = ""
            end
            local size = #message_part - offs
            local size_tail = size % 64
            sha256_feed_64(H, message_part, offs, size - size_tail)
            tail = tail..sub(message_part, #message_part + 1 - size_tail)
            return partial
         else
            error("Adding more chunks is not allowed after receiving the result", 2)
         end
      else
         if tail then
            local final_blocks = {tail, "\128", string_rep("\0", (-9 - length) % 64 + 1)}
            tail = nil
            length = length * (8 / 256^7)
            for j = 4, 10 do
               length = length % 1 * 256
               final_blocks[j] = char(floor(length))
            end
            final_blocks = table_concat(final_blocks)
            sha256_feed_64(H, final_blocks, 0, #final_blocks)
            local max_reg = width / 32
            for j = 1, max_reg do
               H[j] = HEX(H[j])
            end
            H = table_concat(H, "", 1, max_reg)
         end
         return H
      end
   end

   if message then
      return partial(message)()
   else
      return partial
   end
end

--------------------------------------------------------------------------------
-- HELPER FUNCTIONS
--------------------------------------------------------------------------------

local hex_to_bin
do
   function hex_to_bin(hex_string)
      return (gsub(hex_string, "%x%x",
         function (hh)
            return char(tonumber(hh, 16))
         end
      ))
   end
end

local function pad_and_xor(str, result_length, byte_for_xor)
   return gsub(str, ".",
      function(c)
         return char(XOR_BYTE(byte(c), byte_for_xor))
      end
   )..string_rep(char(byte_for_xor), result_length - #str)
end

local block_size_for_HMAC

---@return string
local function hmac(hash_func, key, message)
   local block_size = block_size_for_HMAC[hash_func]
   if not block_size then
      error("Unknown hash function", 2)
   end
   if #key > block_size then
      key = hex_to_bin(hash_func(key))
   end
   local append = hash_func()(pad_and_xor(key, block_size, 0x36))
   local result

   local function partial(message_part)
      if not message_part then
         result = result or hash_func(pad_and_xor(key, block_size, 0x5C)..hex_to_bin(append()))
         return result
      elseif result then
         error("Adding more chunks is not allowed after receiving the result", 2)
      else
         append(message_part)
         return partial
      end
   end

   if message then
      return partial(message)()
   else
      return partial
   end
end

--------------------------------------------------------------------------------
-- MODULE EXPORT
--------------------------------------------------------------------------------

local sha = {
   sha256 = function (message) return sha256ext(256, message) end,
   hmac = hmac,
   hex_to_bin = hex_to_bin,
}

block_size_for_HMAC = {
   [sha.sha256] = 64,
}

return sha
