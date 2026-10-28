from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from auth import get_current_user
from db import get_db
from models import WorkoutSession, SessionSet, SavedWorkout, Exercise, User

router = APIRouter(prefix="/sessions", tags=["workout log"])


class SetIn(BaseModel):
    exercise_id: int
    set_number: int = Field(ge=1, le=50)
    weight_kg: Optional[Decimal] = Field(default=None, ge=0, le=2000)
    reps: int = Field(ge=0, le=1000)
    rpe: Optional[Decimal] = Field(default=None, ge=1, le=10)
    note: Optional[str] = Field(default=None, max_length=200)


class SessionIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    saved_workout_id: Optional[int] = None
    performed_at: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    sets: List[SetIn] = Field(min_length=1)


class SetOut(BaseModel):
    id: int
    exercise_id: int
    exercise_name: str
    set_number: int
    weight_kg: Optional[Decimal]
    reps: int
    rpe: Optional[Decimal]
    note: Optional[str]


class SessionOut(BaseModel):
    id: int
    name: str
    saved_workout_id: Optional[int]
    performed_at: datetime
    notes: Optional[str]
    sets: List[SetOut]


class SessionSummary(BaseModel):
    id: int
    name: str
    performed_at: datetime
    set_count: int
    exercise_count: int


def session_out(s: WorkoutSession) -> SessionOut:
    return SessionOut(
        id=s.id,
        name=s.name,
        saved_workout_id=s.saved_workout_id,
        performed_at=s.performed_at,
        notes=s.notes,
        sets=[
            SetOut(
                id=x.id,
                exercise_id=x.exercise_id,
                exercise_name=x.exercise.name,
                set_number=x.set_number,
                weight_kg=x.weight_kg,
                reps=x.reps,
                rpe=x.rpe,
                note=x.note,
            )
            for x in s.sets
        ],
    )


def load_owned(db: Session, session_id: int, user: User) -> WorkoutSession:
    s = db.scalar(
        select(WorkoutSession)
        .where(WorkoutSession.id == session_id, WorkoutSession.user_id == user.id)
        .options(selectinload(WorkoutSession.sets).selectinload(SessionSet.exercise))
    )
    if not s:
        raise HTTPException(404, "Session not found")
    return s


@router.post("", response_model=SessionOut, status_code=201)
def create_session(data: SessionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if data.saved_workout_id is not None:
        sw = db.get(SavedWorkout, data.saved_workout_id)
        if not sw or sw.user_id != user.id:
            raise HTTPException(400, "Invalid saved workout")

    ids = {s.exercise_id for s in data.sets}
    found = set(db.scalars(select(Exercise.id).where(Exercise.id.in_(ids))))
    if missing := ids - found:
        raise HTTPException(400, f"Unknown exercise ids: {sorted(missing)}")

    session = WorkoutSession(
        user_id=user.id,
        saved_workout_id=data.saved_workout_id,
        name=data.name,
        notes=data.notes,
        **({"performed_at": data.performed_at} if data.performed_at else {}),
        sets=[SessionSet(**s.model_dump()) for s in data.sets],
    )
    db.add(session)
    db.commit()
    return session_out(load_owned(db, session.id, user))


@router.get("", response_model=List[SessionSummary])
def list_sessions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(
        select(
            WorkoutSession.id,
            WorkoutSession.name,
            WorkoutSession.performed_at,
            func.count(SessionSet.id),
            func.count(func.distinct(SessionSet.exercise_id)),
        )
        .join(SessionSet, SessionSet.session_id == WorkoutSession.id, isouter=True)
        .where(WorkoutSession.user_id == user.id)
        .group_by(WorkoutSession.id)
        .order_by(WorkoutSession.performed_at.desc())
    ).all()
    return [
        SessionSummary(id=r[0], name=r[1], performed_at=r[2], set_count=r[3], exercise_count=r[4])
        for r in rows
    ]


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return session_out(load_owned(db, session_id, user))


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(load_owned(db, session_id, user))
    db.commit()