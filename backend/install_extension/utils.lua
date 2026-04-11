-- Utility helpers for extension installation

local M = {}

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
