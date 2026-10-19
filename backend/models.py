from sqlalchemy import String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
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

    
