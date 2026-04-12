-- Utility helpers for extension installation

local M = {}

-- Helper to create empty arrays that serialize as [] not {}
-- cjson treats tables with no elements ambiguously, this ensures array serialization
function M.empty_array()
    local arr = {}
    setmetatable(arr, { __jsontype = "array" })
    return arr
end

-- Ensure nested table path exists, creating tables as needed
-- Usage: ensure_nested(t, "a", "b", "c") ensures t.a.b.c exists
function M.ensure_nested(t, ...)
    local current = t
    for _, key in ipairs({...}) do
        if not current[key] then current[key] = {} end
        current = current[key]
    end
    return current
end

return M
