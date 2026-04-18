# Design Check

Check a screen in `src/screens/` against its design reference in `frontend_claude_design/uploads/`.

## How to use
`/design-check <screen-name>`  
Example: `/design-check Home` or `/design-check Quiz`

## What I will do
1. Read `src/screens/<screen-name>.jsx`
2. Find and read the matching design file in `frontend_claude_design/uploads/` (e.g. `dashboard.jsx` for Home, `quiz_results.jsx` for Quiz, etc.)
3. Compare:
   - Layout structure and spacing
   - Color usage (should use `C.` tokens from `src/theme.js`, not hardcoded)
   - Typography (DM Sans for body, Lora serif for headings)
   - Interactive states (hover, active, loading)
   - Dark mode support via `useTheme()` hook
   - Mascot integration if the design shows it
4. List specific gaps as actionable items
5. Ask before making changes

## Rules
- Never introduce Tailwind classes into `src/screens/` — inline styles only
- All colors from `C` object or `useTheme()` theme token (`t.bg`, `t.text`, etc.)
- No hardcoded hex values except where `C` has no equivalent
