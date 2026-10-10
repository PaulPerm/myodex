from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import random
from typing import List
from pydantic import BaseModel, Field
from seed_data import GOAL_PRESETS as goal_presets, EXERCISES as exercises, MUSCLES


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_exercises_for_muscle(muscle_name: str):
    muscle = muscle_name.lower()
    primary = [e for e in exercises if e["target"] == muscle]
    secondary = [e for e in exercises if muscle in e["secondary"]]
    return primary, secondary


class WorkoutRequest(BaseModel):
    muscles: List[str] = Field(min_length=1)
    goal: str = "hypertrophy"
    categories: List[str] = []  # empty = any equipment
    exercises_per_muscle: int = Field(default=2, ge=1, le=5)


def filter_pool(muscle: str, categories: List[str], exclude: set):
    primary, _ = get_exercises_for_muscle(muscle)
    return [
        e for e in primary
        if (not categories or e["category"] in categories)
        and e["name"] not in exclude
    ]


@app.post("/workouts/generate")
def generate_workout(req: WorkoutRequest):
    preset = goal_presets.get(req.goal, goal_presets["hypertrophy"])
    used = set()
    blocks = []

    for muscle in req.muscles:
        pool = filter_pool(muscle, req.categories, used)
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
def swap_exercise(req: SwapRequest):
    pool = filter_pool(req.muscle, req.categories, set(req.exclude))
    if not pool:
        raise HTTPException(status_code=404, detail="No alternative exercises available")
    return random.choice(pool)


@app.get("/")
def root():
    return {"message": "Myodex API is running"}


@app.get("/goals")
def get_goals():
    return goal_presets


@app.get("/muscles")
def get_muscles():
    return MUSCLES


@app.get("/muscles/{muscle_name}/exercises")
def get_exercises_by_muscle(muscle_name: str, goal: str = "hypertrophy", category: str = None):
    primary, secondary = get_exercises_for_muscle(muscle_name)

    if category:
        primary = [e for e in primary if e["category"] == category]
        secondary = [e for e in secondary if e["category"] == category]

    preset = goal_presets.get(goal, goal_presets["hypertrophy"])

    return {
        "muscle": muscle_name,
        "goal": goal,
        "preset": preset,
        "primary": primary,
        "secondary": secondary,
    }


@app.get("/exercises")
def get_all_exercises(category: str = None, difficulty: str = None):
    result = exercises
    if category:
        result = [e for e in result if e["category"] == category]
    if difficulty:
        result = [e for e in result if e["difficulty"] == difficulty]
    return result