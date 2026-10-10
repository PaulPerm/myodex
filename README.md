# Myodex

![Tests](https://github.com/PaulPerm/myodex/actions/workflows/tests.yml/badge.svg)

**Live demo:** https://myodex.vercel.app

An interactive muscle map for exploring exercises and building workouts. Click a muscle on the front or back view to see ranked exercises, or select multiple muscles to generate a full workout tailored to your goal and equipment.

## Features

**Exercise Map**
- Clickable front/back body map covering 17 muscle groups
- 112 exercises, each with a target muscle, secondary muscles, difficulty, and category
- Search and category filters (Bodyweight, Free Weight, Machine)
- Recruitment index showing primary and secondary muscles

**Workout Builder**
- Multi-select muscles directly on the body map
- Goal presets: Strength, Hypertrophy, Endurance (sets, reps, rest)
- Filter by equipment and choose exercises per muscle
- Compound movements ordered first
- Regenerate the whole workout or shuffle individual exercises

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, react-body-highlighter, lucide-react
- **Backend:** FastAPI (Python 3.11)
- **Database:** PostgreSQL with SQLAlchemy 2.0 and Alembic migrations
- **Infra:** Docker Compose, GitHub Actions CI, Vercel (frontend), Railway (backend + database)

## Running Locally

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up -d --build
```

On startup, the backend applies any pending migrations and seeds the database if it's empty.

- Frontend: http://localhost:5173
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Running Tests

```bash
docker compose exec backend pytest -v
```

CI runs the backend tests against a fresh Postgres instance and builds the frontend on every push.

## API

| Endpoint | Description |
|---|---|
| `GET /muscles` | List all muscle groups |
| `GET /muscles/{slug}/exercises?goal=&category=` | Primary and secondary exercises for a muscle |
| `GET /exercises?category=&difficulty=` | All exercises, filterable |
| `GET /goals` | Sets/reps/rest presets |
| `POST /workouts/generate` | Generate a workout from muscles, goal, equipment, and count |
| `POST /workouts/swap` | Get a replacement exercise, excluding ones already used |

## Roadmap

- [x] Exercise Map: browse muscles and see exercises
- [x] Deployment (Vercel + Railway)
- [x] Backend tests + CI
- [x] Workout Builder: generate workouts by muscle, goal, and equipment
- [x] PostgreSQL connected and seeded
- [ ] User accounts and saved workouts
- [ ] Workout Log: PRs, progress graphs, weekly muscle heatmap
- [ ] Mobile layout