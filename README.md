# Myodex

![Tests](https://github.com/PaulPerm/myodex/actions/workflows/tests.yml/badge.svg)

An interactive muscle map for exploring exercises. Click a muscle group to see ranked exercises (primary and secondary), filter by category and difficulty, and view sets/reps/rest presets for strength, hypertrophy, or endurance goals.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, react-body-highlighter
- **Backend:** FastAPI (Python 3.11)
- **Database:** PostgreSQL
- **Infra:** Docker Compose, GitHub Actions CI

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

## Roadmap

- [x] Exercise Map: browse muscles and see exercises
- [ ] Deployment
- [ ] User accounts and saved workouts
- [ ] Workout Builder: generate workouts by muscle, goal, and equipment
- [ ] Workout Log: PRs, progress graphs, weekly muscle heatmap