import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models import GoalType, ItemUnit, PracticeType


# --- Practice schemas ---

class PracticeCreate(BaseModel):
    name: str
    type: PracticeType
    notes: str | None = None


class PracticeUpdate(BaseModel):
    name: str | None = None
    type: PracticeType | None = None
    notes: str | None = None
    active: bool | None = None


class PracticeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    type: PracticeType
    notes: str | None
    active: bool
    created_at: datetime.datetime


# --- Session Item schemas ---

class SessionItemCreate(BaseModel):
    practice_id: uuid.UUID
    quantity: int = Field(ge=1)
    unit: ItemUnit = ItemUnit.malas
    duration_minutes: int | None = Field(default=None, ge=1)
    notes: str | None = None


class SessionItemUpdate(BaseModel):
    quantity: int | None = Field(default=None, ge=1)
    unit: ItemUnit | None = None
    duration_minutes: int | None = Field(default=None, ge=1)
    notes: str | None = None


class SessionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    practice_id: uuid.UUID
    practice_name: str
    practice_type: PracticeType
    quantity: int
    unit: ItemUnit
    mantra_count: int | None  # voor mantra_japa: qty*108 als unit=malas, qty als unit=count
    duration_minutes: int | None
    notes: str | None
    created_at: datetime.datetime

    @classmethod
    def from_orm(cls, obj: object) -> "SessionItemResponse":
        practice = obj.practice  # type: ignore[attr-defined]
        unit: ItemUnit = obj.unit  # type: ignore[attr-defined]
        if practice.type == PracticeType.mantra_japa:
            mantra_count = obj.quantity * 108 if unit == ItemUnit.malas else obj.quantity  # type: ignore[attr-defined]
        else:
            mantra_count = None
        return cls(
            id=obj.id,  # type: ignore[attr-defined]
            practice_id=obj.practice_id,  # type: ignore[attr-defined]
            practice_name=practice.name,
            practice_type=practice.type,
            quantity=obj.quantity,  # type: ignore[attr-defined]
            unit=unit,
            mantra_count=mantra_count,
            duration_minutes=obj.duration_minutes,  # type: ignore[attr-defined]
            notes=obj.notes,  # type: ignore[attr-defined]
            created_at=obj.created_at,  # type: ignore[attr-defined]
        )


# --- Session schemas ---

class SessionCreate(BaseModel):
    date: datetime.date
    started_at: datetime.datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=1)
    notes: str | None = None
    items: list[SessionItemCreate] = []


class SessionUpdate(BaseModel):
    date: datetime.date | None = None
    started_at: datetime.datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=1)
    notes: str | None = None


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    date: datetime.date
    started_at: datetime.datetime | None
    duration_minutes: int | None
    total_malas: int
    total_mantras: int
    notes: str | None
    created_at: datetime.datetime
    items: list[SessionItemResponse]

    @classmethod
    def from_orm(cls, obj: object) -> "SessionResponse":
        items = [SessionItemResponse.from_orm(i) for i in obj.items]  # type: ignore[attr-defined]
        total_malas = sum(
            i.quantity for i in obj.items  # type: ignore[attr-defined]
            if i.practice.type == PracticeType.mantra_japa and i.unit == ItemUnit.malas
        )
        total_mantras = total_malas * 108 + sum(
            i.quantity for i in obj.items  # type: ignore[attr-defined]
            if i.practice.type == PracticeType.mantra_japa and i.unit == ItemUnit.count
        )
        return cls(
            id=obj.id,  # type: ignore[attr-defined]
            date=obj.date,  # type: ignore[attr-defined]
            started_at=obj.started_at,  # type: ignore[attr-defined]
            duration_minutes=obj.duration_minutes,  # type: ignore[attr-defined]
            total_malas=total_malas,
            total_mantras=total_mantras,
            notes=obj.notes,  # type: ignore[attr-defined]
            created_at=obj.created_at,  # type: ignore[attr-defined]
            items=items,
        )


# --- Stats schemas ---

class PracticeStat(BaseModel):
    practice_id: uuid.UUID
    practice_name: str
    practice_type: PracticeType
    total_quantity: int
    total_mantras: int | None  # alleen voor mantra_japa


class TodayStats(BaseModel):
    date: datetime.date
    total_malas: int
    total_minutes: int
    total_mantras: int
    goal_malas_target: int | None
    goal_malas_progress: float | None
    goal_minutes_target: int | None
    goal_minutes_progress: float | None
    practices: list[PracticeStat]


class StreakStats(BaseModel):
    current_streak: int
    longest_streak: int
    last_session_date: datetime.date | None


class CalendarDay(BaseModel):
    date: datetime.date
    total_malas: int
    total_minutes: int
    session_count: int


class OverviewStats(BaseModel):
    total_sessions: int
    total_malas_all_time: int
    total_minutes_all_time: int
    total_sessions_this_week: int
    total_sessions_this_month: int
    total_malas_this_week: int
    total_malas_this_month: int
    total_minutes_this_week: int
    total_minutes_this_month: int
    avg_malas_per_session: float
    avg_minutes_per_session: float
    practices: list[PracticeStat]


# --- Goal schemas ---

class GoalCreate(BaseModel):
    type: GoalType
    target_malas: int = Field(ge=1)
    target_minutes: int | None = Field(default=None, ge=1)


class GoalUpdate(BaseModel):
    target_malas: int | None = Field(default=None, ge=1)
    target_minutes: int | None = Field(default=None, ge=1)
    active: bool | None = None


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: GoalType
    target_malas: int
    target_minutes: int | None
    active: bool
    created_at: datetime.datetime
