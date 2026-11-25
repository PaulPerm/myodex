from contextlib import asynccontextmanager
import random
from typing import List

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import get_db
from models import Muscle, Exercise, GoalPreset
from seed import seed_if_empty
from auth import router as auth_router
from saved_workouts import router as saved_workouts_router
from sessions import router as sessions_router
from import_exercises import import_free_exercise_db

CURATED = "myodex"  # source tag for the hand-picked 112


@asynccontextmanager
async def lifespan(app):
    seed_if_empty()  # runs once on startup
    import_free_exercise_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(saved_workouts_router)
app.include_router(sessions_router)

# ── Helpers ─────────────────────────────────────────────────────────────

def exercise_dict(e: Exercise, full: bool = False):
    d = {
        "id": e.id,
        "name": e.name,
        "difficulty": e.difficulty,
        "category": e.category,
        "target": e.target,
        "secondary": list(e.secondary),
        "equipment": e.equipment,
        "mechanic": e.mechanic,
        "curated": e.source == CURATED,
    }
    if full:  # heavy fields only on the single-exercise endpoint
        d["force"] = e.force
        d["instructions"] = list(e.instructions or [])
        d["images"] = list(e.images or [])
    return d


def preset_dict(p: GoalPreset):
    return {"sets": p.sets, "reps": p.reps, "rest": p.rest}


def get_preset(db: Session, goal: str):
    preset = db.get(GoalPreset, goal) or db.get(GoalPreset, "hypertrophy")
    return preset_dict(preset)


def base_query(curated_only: bool):
    # curated exercises first, then the rest
    q = select(Exercise).order_by(Exercise.source != CURATED, Exercise.id)
    if curated_only:
        q = q.where(Exercise.source == CURATED)
    return q


def get_exercises_for_muscle(db: Session, muscle_name: str, curated_only: bool = False):
    muscle = muscle_name.lower()
    q = base_query(curated_only)
    primary = db.scalars(q.where(Exercise.target == muscle)).all()
    secondary = db.scalars(q.where(Exercise.secondary.any(muscle))).all()
    return [exercise_dict(e) for e in primary], [exercise_dict(e) for e in secondary]


def filter_pool(db: Session, muscle: str, categories: List[str], exclude: set):
    # generator + swap stick to the curated list so random picks stay sensible
    primary, _ = get_exercises_for_muscle(db, muscle, curated_only=True)
    return [
        e for e in primary
        if (not categories or e["category"] in categories)
        and e["name"] not in exclude
    ]


# ── Workouts ────────────────────────────────────────────────────────────

class WorkoutRequest(BaseModel):
    muscles: List[str] = Field(min_length=1)
    goal: str = "hypertrophy"
    categories: List[str] = []  # empty = any equipment
    exercises_per_muscle: int = Field(default=2, ge=1, le=5)


@app.post("/workouts/generate")
def generate_workout(req: WorkoutRequest, db: Session = Depends(get_db)):
    preset = get_preset(db, req.goal)
    used = set()
    blocks = []

    for muscle in req.muscles:
        pool = filter_pool(db, muscle, req.categories, used)
        picks = random.sample(pool, min(req.exercises_per_muscle, len(pool)))
        picks.sort(key=lambda e: len(e["secondary"]), reverse=True)  # compounds first
        used.update(e["name"] for e in picks)
        blocks.append({"muscle": muscle, "exercises": picks})

    return {"goal": req.goal, "preset": preset, "blocks": blocks}


class SwapRequest(BaseModel):
    muscle: str
    exclude: List[str] = []  # names already in the workout, incl. the one being swapped
    categories: List[str] = []


@app.post("/workouts/swap")
def swap_exercise(req: SwapRequest, db: Session = Depends(get_db)):
    pool = filter_pool(db, req.muscle, req.categories, set(req.exclude))
    if not pool:
        raise HTTPException(status_code=404, detail="No alternative exercises available")
    return random.choice(pool)


# ── Read endpoints ──────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Myodex API is running"}


@app.get("/goals")
def get_goals(db: Session = Depends(get_db)):
    return {p.key: preset_dict(p) for p in db.scalars(select(GoalPreset))}


@app.get("/muscles")
def get_muscles(db: Session = Depends(get_db)):
    muscles = db.scalars(select(Muscle).order_by(Muscle.id))
    return [{"id": m.id, "slug": m.slug, "name": m.name} for m in muscles]


@app.get("/muscles/{muscle_name}/exercises")
def get_exercises_by_muscle(
    muscle_name: str,
    goal: str = "hypertrophy",
    category: str | None = None,
    curated: bool = False,
    db: Session = Depends(get_db),
):
    primary, secondary = get_exercises_for_muscle(db, muscle_name, curated_only=curated)

    if category:
        primary = [e for e in primary if e["category"] == category]
        secondary = [e for e in secondary if e["category"] == category]

    return {
        "muscle": muscle_name,
        "goal": goal,
        "preset": get_preset(db, goal),
        "primary": primary,
        "secondary": secondary,
    }


@app.get("/exercises")
def get_all_exercises(
    category: str | None = None,
    difficulty: str | None = None,
    curated: bool = False,
    db: Session = Depends(get_db),
):
    query = base_query(curated)
    if category:
        query = query.where(Exercise.category == category)
    if difficulty:
        query = query.where(Exercise.difficulty == difficulty)
    return [exercise_dict(e) for e in db.scalars(query)]


@app.get("/exercises/{exercise_id}")
def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    e = db.get(Exercise, exercise_id)
    if not e:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise_dict(e, full=True)