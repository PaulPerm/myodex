from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import random
from typing import List
from pydantic import BaseModel, Field


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

goal_presets = {
    "strength":    {"sets": "5", "reps": "3-5",  "rest": "3-5 min"},
    "hypertrophy": {"sets": "4", "reps": "8-12", "rest": "60-90 sec"},
    "endurance":   {"sets": "3", "reps": "15-20", "rest": "30-45 sec"},
}

exercises = [

    # ── CHEST ──────────────────────────────────────────────────────────────
    {"id": 1,  "name": "Barbell Bench Press",       "difficulty": "intermediate", "category": "free_weight", "target": "chest", "secondary": ["triceps", "front-deltoids"]},
    {"id": 2,  "name": "Incline Dumbbell Press",    "difficulty": "intermediate", "category": "free_weight", "target": "chest", "secondary": ["front-deltoids", "triceps"]},
    {"id": 3,  "name": "Decline Bench Press",       "difficulty": "intermediate", "category": "free_weight", "target": "chest", "secondary": ["triceps", "front-deltoids"]},
    {"id": 4,  "name": "Dumbbell Fly",              "difficulty": "beginner",     "category": "free_weight", "target": "chest", "secondary": ["front-deltoids"]},
    {"id": 5,  "name": "Cable Crossover",           "difficulty": "intermediate", "category": "machine",     "target": "chest", "secondary": ["front-deltoids"]},
    {"id": 6,  "name": "Chest Press Machine",       "difficulty": "beginner",     "category": "machine",     "target": "chest", "secondary": ["triceps", "front-deltoids"]},
    {"id": 7,  "name": "Pec Deck Machine",          "difficulty": "beginner",     "category": "machine",     "target": "chest", "secondary": []},
    {"id": 8,  "name": "Push Up",                   "difficulty": "beginner",     "category": "bodyweight",  "target": "chest", "secondary": ["triceps", "front-deltoids", "abs"]},
    {"id": 9,  "name": "Wide Push Up",              "difficulty": "beginner",     "category": "bodyweight",  "target": "chest", "secondary": ["front-deltoids"]},
    {"id": 10, "name": "Chest Dips",                "difficulty": "intermediate", "category": "bodyweight",  "target": "chest", "secondary": ["triceps", "front-deltoids"]},

    # ── FRONT DELTOIDS ─────────────────────────────────────────────────────
    {"id": 11, "name": "Overhead Press",            "difficulty": "intermediate", "category": "free_weight", "target": "front-deltoids", "secondary": ["triceps", "trapezius", "upper-back"]},
    {"id": 12, "name": "Dumbbell Shoulder Press",   "difficulty": "beginner",     "category": "free_weight", "target": "front-deltoids", "secondary": ["triceps", "trapezius"]},
    {"id": 13, "name": "Front Raise",               "difficulty": "beginner",     "category": "free_weight", "target": "front-deltoids", "secondary": []},
    {"id": 14, "name": "Arnold Press",              "difficulty": "intermediate", "category": "free_weight", "target": "front-deltoids", "secondary": ["back-deltoids", "triceps"]},
    {"id": 15, "name": "Machine Shoulder Press",    "difficulty": "beginner",     "category": "machine",     "target": "front-deltoids", "secondary": ["triceps"]},
    {"id": 16, "name": "Pike Push Up",              "difficulty": "intermediate", "category": "bodyweight",  "target": "front-deltoids", "secondary": ["triceps", "upper-back"]},
    {"id": 17, "name": "Handstand Push Up",         "difficulty": "advanced",     "category": "bodyweight",  "target": "front-deltoids", "secondary": ["triceps", "trapezius"]},

    # ── BACK DELTOIDS ──────────────────────────────────────────────────────
    {"id": 18, "name": "Rear Delt Fly",             "difficulty": "beginner",     "category": "free_weight", "target": "back-deltoids", "secondary": ["trapezius", "upper-back"]},
    {"id": 19, "name": "Bent Over Lateral Raise",   "difficulty": "beginner",     "category": "free_weight", "target": "back-deltoids", "secondary": ["trapezius"]},
    {"id": 20, "name": "Face Pull",                 "difficulty": "beginner",     "category": "machine",     "target": "back-deltoids", "secondary": ["trapezius", "upper-back"]},
    {"id": 21, "name": "Reverse Pec Deck",          "difficulty": "beginner",     "category": "machine",     "target": "back-deltoids", "secondary": ["trapezius"]},
    {"id": 22, "name": "Band Pull Apart",           "difficulty": "beginner",     "category": "bodyweight",  "target": "back-deltoids", "secondary": ["trapezius"]},

    # ── TRICEPS ────────────────────────────────────────────────────────────
    {"id": 23, "name": "Skull Crushers",            "difficulty": "intermediate", "category": "free_weight", "target": "triceps", "secondary": []},
    {"id": 24, "name": "Overhead Tricep Extension", "difficulty": "beginner",     "category": "free_weight", "target": "triceps", "secondary": []},
    {"id": 25, "name": "Close Grip Bench Press",    "difficulty": "intermediate", "category": "free_weight", "target": "triceps", "secondary": ["chest", "front-deltoids"]},
    {"id": 26, "name": "Tricep Pushdown",           "difficulty": "beginner",     "category": "machine",     "target": "triceps", "secondary": []},
    {"id": 27, "name": "Cable Overhead Extension",  "difficulty": "beginner",     "category": "machine",     "target": "triceps", "secondary": []},
    {"id": 28, "name": "Tricep Dips",               "difficulty": "beginner",     "category": "bodyweight",  "target": "triceps", "secondary": ["chest", "front-deltoids"]},
    {"id": 29, "name": "Diamond Push Up",           "difficulty": "intermediate", "category": "bodyweight",  "target": "triceps", "secondary": ["chest"]},

    # ── BICEPS ─────────────────────────────────────────────────────────────
    {"id": 30, "name": "Barbell Curl",              "difficulty": "beginner",     "category": "free_weight", "target": "biceps", "secondary": ["forearm"]},
    {"id": 31, "name": "Dumbbell Curl",             "difficulty": "beginner",     "category": "free_weight", "target": "biceps", "secondary": ["forearm"]},
    {"id": 32, "name": "Hammer Curl",               "difficulty": "beginner",     "category": "free_weight", "target": "biceps", "secondary": ["forearm"]},
    {"id": 33, "name": "Incline Dumbbell Curl",     "difficulty": "intermediate", "category": "free_weight", "target": "biceps", "secondary": []},
    {"id": 34, "name": "Preacher Curl",             "difficulty": "intermediate", "category": "machine",     "target": "biceps", "secondary": []},
    {"id": 35, "name": "Cable Curl",                "difficulty": "beginner",     "category": "machine",     "target": "biceps", "secondary": ["forearm"]},
    {"id": 36, "name": "Chin Up",                   "difficulty": "intermediate", "category": "bodyweight",  "target": "biceps", "secondary": ["upper-back", "forearm"]},
    {"id": 37, "name": "Inverted Row",              "difficulty": "beginner",     "category": "bodyweight",  "target": "biceps", "secondary": ["upper-back", "forearm"]},

    # ── FOREARM ────────────────────────────────────────────────────────────
    {"id": 38, "name": "Wrist Curl",                "difficulty": "beginner",     "category": "free_weight", "target": "forearm", "secondary": []},
    {"id": 39, "name": "Reverse Wrist Curl",        "difficulty": "beginner",     "category": "free_weight", "target": "forearm", "secondary": []},
    {"id": 40, "name": "Farmer's Carry",            "difficulty": "intermediate", "category": "free_weight", "target": "forearm", "secondary": ["trapezius", "abs"]},
    {"id": 41, "name": "Cable Wrist Curl",          "difficulty": "beginner",     "category": "machine",     "target": "forearm", "secondary": []},
    {"id": 42, "name": "Dead Hang",                 "difficulty": "beginner",     "category": "bodyweight",  "target": "forearm", "secondary": ["upper-back", "biceps"]},
    {"id": 43, "name": "Pull Up",                   "difficulty": "intermediate", "category": "bodyweight",  "target": "upper-back", "secondary": ["biceps", "forearm", "lower-back"]},

    # ── UPPER BACK ─────────────────────────────────────────────────────────
    {"id": 44, "name": "Barbell Row",               "difficulty": "intermediate", "category": "free_weight", "target": "upper-back", "secondary": ["biceps", "forearm", "lower-back"]},
    {"id": 45, "name": "Dumbbell Row",              "difficulty": "beginner",     "category": "free_weight", "target": "upper-back", "secondary": ["biceps", "forearm"]},
    {"id": 46, "name": "Seated Cable Row",          "difficulty": "beginner",     "category": "machine",     "target": "upper-back", "secondary": ["biceps", "forearm"]},
    {"id": 47, "name": "Lat Pulldown",              "difficulty": "beginner",     "category": "machine",     "target": "upper-back", "secondary": ["biceps", "forearm"]},
    {"id": 48, "name": "T-Bar Row",                 "difficulty": "intermediate", "category": "free_weight", "target": "upper-back", "secondary": ["biceps", "lower-back"]},
    {"id": 49, "name": "Chest Supported Row",       "difficulty": "beginner",     "category": "machine",     "target": "upper-back", "secondary": ["back-deltoids", "biceps"]},

    # ── LOWER BACK ─────────────────────────────────────────────────────────
    {"id": 50, "name": "Deadlift",                  "difficulty": "advanced",     "category": "free_weight", "target": "lower-back", "secondary": ["hamstring", "gluteal", "quadriceps", "forearm", "trapezius"]},
    {"id": 51, "name": "Romanian Deadlift",         "difficulty": "intermediate", "category": "free_weight", "target": "lower-back", "secondary": ["hamstring", "gluteal", "forearm"]},
    {"id": 52, "name": "Good Morning",              "difficulty": "intermediate", "category": "free_weight", "target": "lower-back", "secondary": ["hamstring", "gluteal"]},
    {"id": 53, "name": "Back Extension",            "difficulty": "beginner",     "category": "machine",     "target": "lower-back", "secondary": ["gluteal", "hamstring"]},
    {"id": 54, "name": "Superman Hold",             "difficulty": "beginner",     "category": "bodyweight",  "target": "lower-back", "secondary": ["gluteal"]},
    {"id": 55, "name": "Bird Dog",                  "difficulty": "beginner",     "category": "bodyweight",  "target": "lower-back", "secondary": ["abs", "gluteal"]},

    # ── TRAPEZIUS ──────────────────────────────────────────────────────────
    {"id": 56, "name": "Barbell Shrug",             "difficulty": "beginner",     "category": "free_weight", "target": "trapezius", "secondary": ["forearm"]},
    {"id": 57, "name": "Dumbbell Shrug",            "difficulty": "beginner",     "category": "free_weight", "target": "trapezius", "secondary": ["forearm"]},
    {"id": 58, "name": "Cable Shrug",               "difficulty": "beginner",     "category": "machine",     "target": "trapezius", "secondary": []},
    {"id": 59, "name": "Rack Pull",                 "difficulty": "intermediate", "category": "free_weight", "target": "trapezius", "secondary": ["lower-back", "forearm"]},
    {"id": 60, "name": "Upright Row",               "difficulty": "intermediate", "category": "free_weight", "target": "trapezius", "secondary": ["front-deltoids", "biceps"]},

    # ── ABS ────────────────────────────────────────────────────────────────
    {"id": 61, "name": "Crunch",                    "difficulty": "beginner",     "category": "bodyweight",  "target": "abs", "secondary": []},
    {"id": 62, "name": "Plank",                     "difficulty": "beginner",     "category": "bodyweight",  "target": "abs", "secondary": ["lower-back", "obliques"]},
    {"id": 63, "name": "Hanging Leg Raise",         "difficulty": "intermediate", "category": "bodyweight",  "target": "abs", "secondary": ["forearm", "obliques"]},
    {"id": 64, "name": "Ab Wheel Rollout",          "difficulty": "advanced",     "category": "free_weight", "target": "abs", "secondary": ["lower-back", "obliques"]},
    {"id": 65, "name": "Cable Crunch",              "difficulty": "beginner",     "category": "machine",     "target": "abs", "secondary": ["obliques"]},
    {"id": 66, "name": "Sit Up",                    "difficulty": "beginner",     "category": "bodyweight",  "target": "abs", "secondary": ["obliques"]},
    {"id": 67, "name": "Dragon Flag",               "difficulty": "advanced",     "category": "bodyweight",  "target": "abs", "secondary": ["lower-back", "obliques"]},

    # ── OBLIQUES ───────────────────────────────────────────────────────────
    {"id": 68, "name": "Russian Twist",             "difficulty": "beginner",     "category": "bodyweight",  "target": "obliques", "secondary": ["abs"]},
    {"id": 69, "name": "Side Plank",                "difficulty": "beginner",     "category": "bodyweight",  "target": "obliques", "secondary": ["abs"]},
    {"id": 70, "name": "Bicycle Crunch",            "difficulty": "beginner",     "category": "bodyweight",  "target": "obliques", "secondary": ["abs"]},
    {"id": 71, "name": "Cable Wood Chop",           "difficulty": "intermediate", "category": "machine",     "target": "obliques", "secondary": ["abs"]},
    {"id": 72, "name": "Dumbbell Side Bend",        "difficulty": "beginner",     "category": "free_weight", "target": "obliques", "secondary": []},
    {"id": 73, "name": "Landmine Rotation",         "difficulty": "intermediate", "category": "free_weight", "target": "obliques", "secondary": ["abs", "front-deltoids"]},

    # ── QUADRICEPS ─────────────────────────────────────────────────────────
    {"id": 74, "name": "Barbell Squat",             "difficulty": "intermediate", "category": "free_weight", "target": "quadriceps", "secondary": ["gluteal", "hamstring", "lower-back", "adductor"]},
    {"id": 75, "name": "Front Squat",               "difficulty": "advanced",     "category": "free_weight", "target": "quadriceps", "secondary": ["gluteal", "upper-back"]},
    {"id": 76, "name": "Lunges",                    "difficulty": "beginner",     "category": "free_weight", "target": "quadriceps", "secondary": ["gluteal", "hamstring", "adductor"]},
    {"id": 77, "name": "Leg Press",                 "difficulty": "beginner",     "category": "machine",     "target": "quadriceps", "secondary": ["gluteal", "hamstring"]},
    {"id": 78, "name": "Leg Extension",             "difficulty": "beginner",     "category": "machine",     "target": "quadriceps", "secondary": []},
    {"id": 79, "name": "Hack Squat",                "difficulty": "intermediate", "category": "machine",     "target": "quadriceps", "secondary": ["gluteal", "hamstring"]},
    {"id": 80, "name": "Bulgarian Split Squat",     "difficulty": "intermediate", "category": "free_weight", "target": "quadriceps", "secondary": ["gluteal", "hamstring", "adductor"]},
    {"id": 81, "name": "Pistol Squat",              "difficulty": "advanced",     "category": "bodyweight",  "target": "quadriceps", "secondary": ["gluteal", "adductor"]},
    {"id": 82, "name": "Jump Squat",                "difficulty": "intermediate", "category": "bodyweight",  "target": "quadriceps", "secondary": ["gluteal", "calves"]},

    # ── HAMSTRING ──────────────────────────────────────────────────────────
    {"id": 83, "name": "Romanian Deadlift",         "difficulty": "intermediate", "category": "free_weight", "target": "hamstring", "secondary": ["lower-back", "gluteal"]},
    {"id": 84, "name": "Lying Leg Curl",            "difficulty": "beginner",     "category": "machine",     "target": "hamstring", "secondary": []},
    {"id": 85, "name": "Seated Leg Curl",           "difficulty": "beginner",     "category": "machine",     "target": "hamstring", "secondary": []},
    {"id": 86, "name": "Nordic Curl",               "difficulty": "advanced",     "category": "bodyweight",  "target": "hamstring", "secondary": ["gluteal"]},
    {"id": 87, "name": "Good Morning",              "difficulty": "intermediate", "category": "free_weight", "target": "hamstring", "secondary": ["lower-back", "gluteal"]},
    {"id": 88, "name": "Glute Ham Raise",           "difficulty": "advanced",     "category": "bodyweight",  "target": "hamstring", "secondary": ["gluteal", "lower-back"]},
    {"id": 89, "name": "Single Leg Deadlift",       "difficulty": "intermediate", "category": "free_weight", "target": "hamstring", "secondary": ["gluteal", "lower-back"]},

    # ── GLUTEAL ────────────────────────────────────────────────────────────
    {"id": 90, "name": "Hip Thrust",                "difficulty": "intermediate", "category": "free_weight", "target": "gluteal", "secondary": ["hamstring", "quadriceps"]},
    {"id": 91, "name": "Glute Bridge",              "difficulty": "beginner",     "category": "bodyweight",  "target": "gluteal", "secondary": ["hamstring"]},
    {"id": 92, "name": "Cable Kickback",            "difficulty": "beginner",     "category": "machine",     "target": "gluteal", "secondary": ["hamstring"]},
    {"id": 93, "name": "Donkey Kick",               "difficulty": "beginner",     "category": "bodyweight",  "target": "gluteal", "secondary": ["lower-back"]},
    {"id": 94, "name": "Step Up",                   "difficulty": "beginner",     "category": "bodyweight",  "target": "gluteal", "secondary": ["quadriceps", "hamstring"]},
    {"id": 95, "name": "Sumo Deadlift",             "difficulty": "intermediate", "category": "free_weight", "target": "gluteal", "secondary": ["hamstring", "adductor", "lower-back"]},
    {"id": 96, "name": "Smith Machine Hip Thrust",  "difficulty": "beginner",     "category": "machine",     "target": "gluteal", "secondary": ["hamstring"]},

    # ── ADDUCTOR ───────────────────────────────────────────────────────────
    {"id": 97,  "name": "Sumo Squat",               "difficulty": "beginner",     "category": "free_weight", "target": "adductor", "secondary": ["gluteal", "quadriceps"]},
    {"id": 98,  "name": "Cable Hip Adduction",      "difficulty": "beginner",     "category": "machine",     "target": "adductor", "secondary": []},
    {"id": 99,  "name": "Adductor Machine",         "difficulty": "beginner",     "category": "machine",     "target": "adductor", "secondary": []},
    {"id": 100, "name": "Copenhagen Plank",         "difficulty": "advanced",     "category": "bodyweight",  "target": "adductor", "secondary": ["abs", "obliques"]},
    {"id": 101, "name": "Lateral Lunge",            "difficulty": "beginner",     "category": "bodyweight",  "target": "adductor", "secondary": ["gluteal", "quadriceps"]},

    # ── ABDUCTORS ──────────────────────────────────────────────────────────
    {"id": 102, "name": "Abductor Machine",         "difficulty": "beginner",     "category": "machine",     "target": "abductors", "secondary": []},
    {"id": 103, "name": "Cable Hip Abduction",      "difficulty": "beginner",     "category": "machine",     "target": "abductors", "secondary": []},
    {"id": 104, "name": "Clamshell",                "difficulty": "beginner",     "category": "bodyweight",  "target": "abductors", "secondary": ["gluteal"]},
    {"id": 105, "name": "Side Lying Leg Raise",     "difficulty": "beginner",     "category": "bodyweight",  "target": "abductors", "secondary": []},
    {"id": 106, "name": "Lateral Band Walk",        "difficulty": "beginner",     "category": "bodyweight",  "target": "abductors", "secondary": ["gluteal"]},

    # ── CALVES ─────────────────────────────────────────────────────────────
    {"id": 107, "name": "Standing Calf Raise",      "difficulty": "beginner",     "category": "free_weight", "target": "calves", "secondary": []},
    {"id": 108, "name": "Seated Calf Raise",        "difficulty": "beginner",     "category": "machine",     "target": "calves", "secondary": []},
    {"id": 109, "name": "Leg Press Calf Raise",     "difficulty": "beginner",     "category": "machine",     "target": "calves", "secondary": []},
    {"id": 110, "name": "Single Leg Calf Raise",    "difficulty": "intermediate", "category": "bodyweight",  "target": "calves", "secondary": []},
    {"id": 111, "name": "Jump Rope",                "difficulty": "beginner",     "category": "bodyweight",  "target": "calves", "secondary": ["quadriceps"]},
    {"id": 112, "name": "Box Jump",                 "difficulty": "intermediate", "category": "bodyweight",  "target": "calves", "secondary": ["quadriceps", "gluteal"]},
]


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
    return [
        {"id": 1,  "slug": "chest",          "name": "Chest"},
        {"id": 2,  "slug": "front-deltoids", "name": "Front Deltoids"},
        {"id": 3,  "slug": "back-deltoids",  "name": "Rear Deltoids"},
        {"id": 4,  "slug": "triceps",        "name": "Triceps"},
        {"id": 5,  "slug": "biceps",         "name": "Biceps"},
        {"id": 6,  "slug": "forearm",        "name": "Forearms"},
        {"id": 7,  "slug": "upper-back",     "name": "Upper Back"},
        {"id": 8,  "slug": "lower-back",     "name": "Lower Back"},
        {"id": 9,  "slug": "trapezius",      "name": "Trapezius"},
        {"id": 10, "slug": "abs",            "name": "Abs"},
        {"id": 11, "slug": "obliques",       "name": "Obliques"},
        {"id": 12, "slug": "quadriceps",     "name": "Quadriceps"},
        {"id": 13, "slug": "hamstring",      "name": "Hamstrings"},
        {"id": 14, "slug": "gluteal",        "name": "Glutes"},
        {"id": 15, "slug": "adductor",       "name": "Adductors"},
        {"id": 16, "slug": "abductors",      "name": "Abductors"},
        {"id": 17, "slug": "calves",         "name": "Calves"},
    ]


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