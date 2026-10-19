from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_user
from db import get_db
from models import SavedWorkout, User

router = APIRouter(prefix="/saved-workouts", tags=["saved workouts"])


class SaveWorkoutIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    goal: str
    preset: dict[str, Any]
    blocks: List[dict[str, Any]]


class SavedWorkoutOut(SaveWorkoutIn):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


def get_owned(db: Session, workout_id: int, user: User) -> SavedWorkout:
    w = db.get(SavedWorkout, workout_id)
    if not w or w.user_id != user.id:
        raise HTTPException(404, "Workout not found")
    return w


@router.post("", response_model=SavedWorkoutOut, status_code=201)
def save_workout(data: SaveWorkoutIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    w = SavedWorkout(user_id=user.id, **data.model_dump())
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@router.get("", response_model=List[SavedWorkoutOut])
def list_workouts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(SavedWorkout)
        .where(SavedWorkout.user_id == user.id)
        .order_by(SavedWorkout.created_at.desc())
    ).all()


@router.get("/{workout_id}", response_model=SavedWorkoutOut)
def get_workout(workout_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_owned(db, workout_id, user)


@router.delete("/{workout_id}", status_code=204)
def delete_workout(workout_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(get_owned(db, workout_id, user))
    db.commit()