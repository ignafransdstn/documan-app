# Development: run frontend + backend together

This project contains `backend/` (Express + Sequelize) and `frontend/` (React + Vite).

Quick steps to run both services concurrently on your machine (macOS/zsh):

1. At repository root, install `concurrently` (dev dependency) and install subproject dependencies:

```zsh
# from repo root
npm install
npm run install:all
```

2. Start both dev servers (backend on port 5001, frontend on 5173):

```zsh
npm run dev
```

Notes:
- The root `dev` script uses `concurrently` to run the backend and frontend dev scripts:
  - backend: `cd backend && npm run dev` (nodemon starts `src/app.js`) — listens on the PORT set in `backend/.env` (default in this workspace is 5001)
  - frontend: `cd frontend && npm run dev -- --host` (Vite dev server) — Vite host option allows access from localhost/other local interfaces.
- If you prefer to install dependencies separately:
  - `cd backend && npm install`
  - `cd frontend && npm install`
- To run only backend or only frontend from root:
  - `npm run start:backend` (production start for backend)
  - `npm run start:frontend` (runs `vite preview` for the frontend build)

E2E tests (backend):

```zsh
cd backend
npm run test:e2e
```

If you want, I can also:
- Add a small `make` file or `scripts/start.sh` wrapper to simplify start/stop.
- Run a smoke-check after installing `concurrently` to confirm both servers come up.
