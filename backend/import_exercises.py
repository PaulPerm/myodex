"""Import free-exercise-db (public domain, https://github.com/yuhonas/free-exercise-db).
Runs on startup. Does nothing if the import has already happened.
Only adds exercises; never changes or deletes the original 112.
"""
import json
import re
from pathlib import Path

from sqlalchemy import select, text 

from db import SessionLocal
from models import Exercise, Muscle

DATA_FILE = Path(__file__).parent / "data" / "free-exercise-db.json"
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"
SOURCE = "free-exercise-db"

KEEP_CATEGORIES = {"strength", "powerlifting", "olympic weightlifting", "strongman"}
LEVELS = {"beginner": "beginner", "intermediate": "intermediate", "expert": "advanced"}

MUSCLES = {
    "chest": "chest",
    "quadriceps": "quadriceps",
    "hamstrings": "hamstring",
    "glutes": "gluteal",
    "calves": "calves",
    "lats": "upper-back",
    "middle back": "upper-back",
    "lower back": "lower-back",
    "traps": "trapezius",
    "biceps": "biceps",
    "triceps": "triceps",
    "forearms": "forearm",
    "adductors": "adductor",
    "abductors": "abductors",
    "neck": None,
}

REAR_DELT = re.compile(r"rear|reverse fly|reverse flye|face pull|bent.over (lateral|raise)|reverse pec", re.I)
OBLIQUE = re.compile(r"oblique|side bend|twist|woodchop|wood chop|russian|side plank|windmill", re.I)


def to_slug(muscle, name):
    if muscle == "shoulders":
        return "back-deltoids" if REAR_DELT.search(name) else "front-deltoids"
    if muscle == "abdominals":
        return "obliques" if OBLIQUE.search(name) else "abs"
    return MUSCLES.get(muscle)


def to_category(equipment):
    if equipment in (None, "body only"):
        return "bodyweight"
    if equipment in ("machine", "cable"):
        return "machine"
    return "free_weight"


def name_key(name):
    return re.sub(r"[^a-z0-9]", "", name.lower())


def import_free_exercise_db():
    if not DATA_FILE.exists():
        print(f"[import] {DATA_FILE} not found, skipping")
        return

    with SessionLocal() as db:
        if db.scalar(select(Exercise.id).where(Exercise.source == SOURCE).limit(1)) is not None:
            return
        db.execute(text(
            "SELECT setval(pg_get_serial_sequence('exercises', 'id'), "
            "(SELECT COALESCE(MAX(id), 1) FROM exercises))"
        ))
        valid_slugs = set(db.scalars(select(Muscle.slug)))
        existing = {name_key(n) for n in db.scalars(select(Exercise.name))}
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))

        added = skipped = 0
        for e in data:
            name = (e.get("name") or "").strip()[:100]
            key = name_key(name)
            if not name or key in existing or e.get("category") not in KEEP_CATEGORIES:
                skipped += 1
                continue

            primaries = [s for s in (to_slug(m, name) for m in e.get("primaryMuscles") or []) if s in valid_slugs]
            if not primaries:
                skipped += 1
                continue
            target = primaries[0]

            secondary = []
            for m in primaries[1:] + [to_slug(m, name) for m in e.get("secondaryMuscles") or []]:
                if m in valid_slugs and m != target and m not in secondary:
                    secondary.append(m)

            db.add(Exercise(
                name=name,
                difficulty=LEVELS.get(e.get("level"), "intermediate"),
                category=to_category(e.get("equipment")),
                target=target,
                secondary=secondary,
                mechanic=e.get("mechanic"),
                force=e.get("force"),
                equipment=e.get("equipment"),
                instructions=e.get("instructions") or [],
                images=[IMAGE_BASE + p for p in e.get("images") or []],
                source=SOURCE,
                external_id=e.get("id"),
            ))
            existing.add(key)
            added += 1

        db.commit()
        print(f"[import] free-exercise-db: added {added}, skipped {skipped}")