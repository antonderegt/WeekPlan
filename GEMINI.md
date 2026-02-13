# WeekPlan Project Overview

This is a web application named "WeekPlan" designed for managing meal plans. It allows users to define and organize ingredients, create recipes, establish weekly meal patterns, and assign these patterns to specific weeks. The application also supports data export and import functionalities for backup and migration.

## Technologies Used

*   **Frontend:** React, TypeScript, Vite, React Router DOM
*   **Backend:** Node.js, Express.js, better-sqlite3 (SQLite database)
*   **Styling:** Custom CSS
*   **Containerization:** Docker, Docker Compose

## Architecture

The application follows a client-server architecture:

*   **Backend (`server/index.js`):** A Node.js and Express.js server that provides a RESTful API. It manages data for ingredients, recipes, meal patterns, and application settings. Data is persisted in an SQLite database file (`weekplan.db`) located in the `/data` directory. The backend also serves the static frontend assets.
*   **Frontend (`src/`):** A React application built with TypeScript and Vite. It provides the user interface for interacting with the backend API. Key features include:
    *   Global state management via `DataContext`.
    *   Client-side routing using `react-router-dom`.
    *   Components for managing different aspects of meal planning (e.g., `WeekView`, `RecipeList`, `IngredientList`, `SettingsView`).

## Building and Running

### Development Mode

To run the frontend and backend separately in development mode:

1.  **Start the Backend Server:**
    ```bash
    npm run server
    ```
    This will start the Express server, typically on `http://localhost:3000`.

2.  **Start the Frontend Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server. The `vite.config.ts` is configured to proxy API requests from `/api` to the backend server running on `http://localhost:3000`.

### Production Build

To build the frontend for production:

```bash
npm run build
```
This command compiles the TypeScript code and bundles the frontend assets into the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

### Running with Docker Compose

The application can be built and run using Docker Compose, which sets up both the frontend (served by the backend) and the backend services in containers.

```bash
docker-compose up --build
```
The application will be accessible via `http://localhost:3000`.
Data for the SQLite database will be stored in a Docker volume named `weekplan-data`.

## Development Conventions

*   **Language:** TypeScript for both frontend and backend (where applicable for the server, though `server/index.js` is plain JavaScript, the `tsconfig.json` implies a TypeScript context for the project overall).
*   **Frontend Framework:** React with JSX.
*   **State Management:** `DataContext` (React Context API) for global state.
*   **Routing:** React Router DOM.
*   **Code Formatting/Linting:** Not explicitly defined in `package.json` scripts, but `tsconfig.json` enforces strict TypeScript checks. Adherence to consistent code style is expected.
*   **UUID Generation:** Custom `uuid.ts` utility for generating unique IDs.
*   **Date Utilities:** Custom `date.ts` utility for date manipulations.
