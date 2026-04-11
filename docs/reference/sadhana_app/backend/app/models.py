from __future__ import annotations

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GoalType(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"


class PracticeType(str, enum.Enum):
    mantra_japa = "mantra_japa"
    parayana = "parayana"
    other = "other"


class ItemUnit(str, enum.Enum):
    malas = "malas"
    count = "count"


class Practice(Base):
    __tablename__ = "practices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[PracticeType] = mapped_column(Enum(PracticeType), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    items: Mapped[list[SessionItem]] = relationship(back_populates="practice")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    date: Mapped[date] = mapped_column(nullable=False, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    items: Mapped[list[SessionItem]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class SessionItem(Base):
    __tablename__ = "session_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    practice_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("practices.id"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit: Mapped[ItemUnit] = mapped_column(Enum(ItemUnit), nullable=False, default=ItemUnit.malas)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session: Mapped[Session] = relationship(back_populates="items")
    practice: Mapped[Practice] = relationship(back_populates="items")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    type: Mapped[GoalType] = mapped_column(Enum(GoalType), nullable=False)
    target_malas: Mapped[int] = mapped_column(Integer, nullable=False)
    target_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
