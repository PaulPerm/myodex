# Myodex

![Tests](https://github.com/PaulPerm/myodex/actions/workflows/tests.yml/badge.svg)

**Live demo:** https://myodex.vercel.app

An interactive muscle map for exploring exercises. Click a muscle on the front or back view to see ranked exercises (primary and secondary), search and filter by category, and view sets/reps/rest presets for strength, hypertrophy, or endurance goals.

## Features

- Clickable front/back body map covering 17 muscle groups
- 112 exercises, each with a target muscle, secondary muscles, difficulty, and category
- Search and category filters (Bodyweight, Free Weight, Machine)
- Goal presets: Strength, Hypertrophy, Endurance
- Recruitment index showing primary and secondary muscles

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, react-body-highlighter
- **Backend:** FastAPI (Python 3.11)
- **Database:** PostgreSQL (in progress, exercise data is currently served in-memory)
- **Infra:** Docker Compose, GitHub Actions CI, Vercel (frontend), Railway (backend)

## Running Locally

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Running Tests

```bash
docker compose exec backend pytest -v
```

## API

| Endpoint | Description |
|---|---|
| `GET /muscles` | List all muscle groups |
| `GET /muscles/{slug}/exercises?goal=&category=` | Primary and secondary exercises for a muscle |
| `GET /exercises?category=&difficulty=` | All exercises, filterable |
| `GET /goals` | Sets/reps/rest presets |

## Roadmap

- [x] Exercise Map: browse muscles and see exercises
- [x] Deployment (Vercel + Railway)
- [x] Backend tests + CI
- [ ] PostgreSQL connected and seeded
- [ ] User accounts and saved workouts
- [ ] Workout Builder: generate workouts by muscle, goal, and equipment
- [ ] Workout Log: PRs, progress graphs, weekly muscle heatmap