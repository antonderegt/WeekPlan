# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript frontend.
- `src/components/`: UI components (`WeekView.tsx`, `RecipeList.tsx`, modals, editors).
- `src/store/`: shared state/context (`DataContext.tsx`).
- `src/api/`: HTTP client for backend endpoints.
- `src/utils/`: pure helpers (date, meal logic, ID generation).
- `server/index.js`: Express API + SQLite schema/bootstrap.
- `dist/`: production build output (generated).
- Root config: `vite.config.ts`, `tsconfig*.json`, `Dockerfile`, `docker-compose.yml`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server for frontend.
- `npm run server`: run Express API locally on `PORT` (default `3000`).
- `npm run build`: type-check (`tsc -b`) and create production bundle in `dist/`.
- `npm run preview`: serve built frontend locally.
- `docker compose up --build`: run containerized app with persistent SQLite volume.

## Coding Style & Naming Conventions
- Use TypeScript for frontend modules and modern ES modules in backend.
- Follow existing style: 2-space indentation, semicolons, single quotes.
- Components/context/hooks: PascalCase files and exports (example: `DataContext.tsx`).
- Utilities/API modules: lowercase filenames (example: `date.ts`, `client.ts`).
- Keep helper logic in `src/utils/` and keep components focused on rendering/interaction.

## Testing Guidelines
- There is currently no automated test framework configured.
- Minimum validation before opening a PR:
  - `npm run build` succeeds.
  - Manual smoke test of key flows (ingredients, recipes, patterns, settings).
  - Backend health check responds at `/api/health`.
- If adding tests, colocate as `*.test.ts` / `*.test.tsx` near implementation.

## Commit & Pull Request Guidelines
- Match existing commit style: short, imperative subject lines (example: `Update recipe editor modal`).
- Keep commits focused to a single change area.
- PRs should include:
  - What changed and why.
  - How to verify (commands + manual steps).
  - Screenshots/GIFs for UI changes.
  - Notes on data/schema/API changes.

## Security & Configuration Tips
- Use `DB_PATH` to control SQLite location (default `/data/weekplan.db`).
- Use `PORT` to override server port.
- Never commit real database files or secrets.
