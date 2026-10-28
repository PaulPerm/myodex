# MYODEX

An interactive muscle map for browsing exercises, building workouts, and logging training.

**Live:** [myodex.vercel.app](https://myodex.vercel.app)

> *Myo* (Greek: muscle) + *Dex* (index)

## Features

- **Exercise Map** — tap a muscle on the body map to see ranked primary and secondary exercises, filterable by equipment
- **Workout Builder** — select muscles, goal (strength / hypertrophy / endurance), and equipment to generate a workout; shuffle individual exercises
- **Accounts** — register / sign in with JWT auth
- **My Workouts** — save generated workouts, view, expand, and delete them
- **Workout Log** — start a session blank or from a saved workout; log weight, reps, RPE, and notes per set; lbs/kg toggle; in-progress session survives refresh; browse and delete past sessions
- **Mobile layout** — responsive pages with a bottom tab bar
- **Analytics** — Vercel Analytics for visitor tracking

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React (Vite), Tailwind CSS, react-body-highlighter, lucide-react, Vercel Analytics |
| Backend  | FastAPI, SQLAlchemy 2.0, Alembic, PyJWT, bcrypt |
| Database | PostgreSQL |
| Infra    | Docker Compose (local), Vercel (frontend), Railway (backend + Postgres), GitHub Actions (tests) |

## Running Locally

**Requirements:** Docker Desktop, Node.js

1. Create `backend/.env`:
   ```
   JWT_SECRET=<random string>
   ```
   Generate one with:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

2. Start the backend and database:
   ```bash
   docker compose up --build -d backend db
   ```
   Migrations run automatically on startup, and exercise data seeds if the tables are empty.

3. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

- App: http://localhost:5173
- API docs: http://localhost:8000/docs

## Database Migrations

```bash
docker compose exec backend alembic revision --autogenerate -m "describe change"
docker compose exec backend alembic upgrade head
```

## Environment Variables

| Variable       | Where              | Purpose |
|----------------|--------------------|---------|
| `DATABASE_URL` | backend            | Postgres connection string |
| `JWT_SECRET`   | backend            | Signs auth tokens |
| `VITE_API_URL` | frontend (Vercel)  | Backend URL; defaults to `http://localhost:8000` |

## API Overview

| Method | Route | Auth |
|--------|-------|------|
| GET    | `/muscles`, `/exercises`, `/goals` | — |
| GET    | `/muscles/{muscle}/exercises` | — |
| POST   | `/workouts/generate`, `/workouts/swap` | — |
| POST   | `/auth/register`, `/auth/login` | — |
| GET    | `/auth/me` | ✓ |
| GET/POST/DELETE | `/saved-workouts` | ✓ |
| GET/POST/DELETE | `/sessions` | ✓ |

## Roadmap

- [x] Exercise Map
- [x] Workout Builder
- [x] Postgres + Alembic
- [x] Auth
- [x] Saved workouts
- [x] Mobile layout MVP
- [x] Workout Log
- [ ] "Terminal" UI redesign
- [ ] PR tracking + progress graphs
- [ ] Weekly muscle heatmap