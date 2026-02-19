# WeekPlan

Meal planning app — React + TypeScript frontend, SQLite backend via `server/index.js`.

## Dev Commands
- `npm run dev` — start dev server
- `npx tsc --noEmit` — TypeScript check (no build output)

## Key Files
- `src/styles.css` — single CSS file; breakpoints at 1000px and 700px
- `src/types.ts` — all shared types (Recipe, MealBlock, Pattern, Settings)
- `src/store/DataContext.tsx` — data access hook (`useData()`)
- `docs/plans/` — design docs and implementation plans

## Architecture
- CSS-only responsive layout; desktop untouched by mobile overrides
- No CSS modules or Tailwind — plain classes in styles.css
- react-router-dom v6 NavLink for navigation (use `end` prop on root route)
- Bottom tab bar on mobile (≤700px), top nav on desktop
