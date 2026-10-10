from sqlalchemy import select, text
from db import SessionLocal
from models import Muscle, Exercise, GoalPreset
from seed_data import MUSCLES, EXERCISES, GOAL_PRESETS


def seed_if_empty():
    with SessionLocal() as db:
        if db.scalar(select(Muscle.id).limit(1)) is not None:
            return  # already seeded

        db.add_all([Muscle(**m) for m in MUSCLES])
        db.flush()  # muscles must exist before exercises reference them via FK
        db.add_all([Exercise(**e) for e in EXERCISES])
        db.add_all([GoalPreset(key=k, **v) for k, v in GOAL_PRESETS.items()])

        # We inserted explicit ids, so move the auto-increment counters past them
        for table in ("muscles", "exercises"):
            db.execute(text(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), (SELECT MAX(id) FROM {table}))"
            ))

        db.commit()