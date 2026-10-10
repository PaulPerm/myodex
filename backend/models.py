from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from db import Base

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



