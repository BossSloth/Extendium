-- JSON helpers for HMAC computation

local json = require("json")

local M = {}

-- Encode JSON with sorted keys (critical for HMAC - must match JS JSON.stringify order)
function M.encode_sorted(value)
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
                parts[i] = M.encode_sorted(value[i])
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
                    table.insert(parts, json.encode(k) .. ":" .. M.encode_sorted(v))
                end
            end
            return "{" .. table.concat(parts, ",") .. "}"
        end
    else
        return "null"
    end
end

-- Remove empty tables and arrays (Chromium's DeepCopyWithoutEmptyChildren)
function M.remove_empty_children(obj)
    if type(obj) ~= "table" then return obj end
    if next(obj) == nil then return nil end

    local cleaned = {}
    for k, v in pairs(obj) do
        local cleaned_v = M.remove_empty_children(v)
        if cleaned_v ~= nil and (type(cleaned_v) ~= "table" or next(cleaned_v) ~= nil) then
            cleaned[k] = cleaned_v
        end
    end

    return next(cleaned) ~= nil and cleaned or nil
end

-- Escape '<' in JSON string (Chromium requirement)
function M.escape_for_hmac(json_str)
    return json_str:gsub("<", "\\u003C")
end

return M
