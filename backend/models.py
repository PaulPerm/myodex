from sqlalchemy import String, ForeignKey, DateTime, func, Numeric, SmallInteger, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal
from db import Base
from datetime import datetime

class Muscle(Base):
    __tablename__ = "muscles"

    id: Mapped[int] = mapped_column(primary_key = True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))

class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key = True)
    name: Mapped[str] = mapped_column(String(100))
    difficulty: Mapped[str] = mapped_column(String(20))
    category: Mapped[str] = mapped_column(String(20), index=True)
    target: Mapped[str] = mapped_column(ForeignKey("muscles.slug"), index = True) 
    secondary: Mapped[list[str]] = mapped_column(ARRAY(String(50)), default = list) 

class GoalPreset(Base):
    __tablename__ = "goal_presets"

    key: Mapped[str] = mapped_column(String(30), primary_key=True)
    sets: Mapped[str] = mapped_column(String(10))
    reps: Mapped[str] = mapped_column(String(20))
    rest: Mapped[str] = mapped_column(String(20))

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class SavedWorkout(Base):
    __tablename__ = "saved_workouts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    goal: Mapped[str] = mapped_column(String(50))
    preset: Mapped[dict] = mapped_column(JSONB)
    blocks: Mapped[list] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    saved_workout_id: Mapped[int | None] = mapped_column(
        ForeignKey("saved_workouts.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100))
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    sets: Mapped[list["SessionSet"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="SessionSet.id"
    )


class SessionSet(Base):
    __tablename__ = "session_sets"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("workout_sessions.id", ondelete="CASCADE"), index=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), index=True)
    set_number: Mapped[int] = mapped_column(SmallInteger)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(7, 3), nullable=True)
    reps: Mapped[int] = mapped_column(SmallInteger)
    rpe: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    note: Mapped[str | None] = mapped_column(String(200), nullable=True)

    session: Mapped[WorkoutSession] = relationship(back_populates="sets")
    exercise: Mapped["Exercise"] = relationship()
