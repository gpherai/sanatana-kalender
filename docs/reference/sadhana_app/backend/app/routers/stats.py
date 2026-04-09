import datetime
from collections import OrderedDict
from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Goal, GoalType, ItemUnit, Practice, PracticeType, Session, SessionItem
from app.schemas import (
    CalendarDay,
    OverviewStats,
    PracticeStat,
    StreakStats,
    TodayStats,
)

router = APIRouter(prefix="/stats", tags=["stats"])


def _active_daily_goal(db: DBSession) -> Goal | None:
    return db.scalars(
        select(Goal).where(Goal.type == GoalType.daily, Goal.active.is_(True))
    ).first()


def _practice_stats(db: DBSession, from_date: datetime.date | None = None) -> list[PracticeStat]:
    stmt = (
        select(
            Practice.id,
            Practice.name,
            Practice.type,
            SessionItem.unit,
            func.sum(SessionItem.quantity).label("qty"),
        )
        .join(SessionItem, SessionItem.practice_id == Practice.id)
        .join(Session, Session.id == SessionItem.session_id)
        .group_by(Practice.id, Practice.name, Practice.type, SessionItem.unit)
    )
    if from_date:
        stmt = stmt.where(Session.date >= from_date)

    rows = db.execute(stmt).all()

    # Merge rows per practice (may have both unit=malas and unit=count rows)
    data: dict = OrderedDict()
    for r in rows:
        if r.id not in data:
            data[r.id] = {"id": r.id, "name": r.name, "type": r.type, "malas": 0, "count_qty": 0}
        if r.unit == ItemUnit.malas:
            data[r.id]["malas"] += r.qty
        else:
            data[r.id]["count_qty"] += r.qty

    result = []
    for d in data.values():
        if d["type"] == PracticeType.mantra_japa:
            total_mantras = d["malas"] * 108 + d["count_qty"]
            total_quantity = d["malas"]
        else:
            total_mantras = None
            total_quantity = d["count_qty"]
        result.append(PracticeStat(
            practice_id=d["id"],
            practice_name=d["name"],
            practice_type=d["type"],
            total_quantity=total_quantity,
            total_mantras=total_mantras,
        ))

    return sorted(result, key=lambda x: -(x.total_quantity or 0))


@router.get("/today", response_model=TodayStats)
def today_stats(db: DBSession = Depends(get_db)) -> TodayStats:
    today = datetime.date.today()

    row = db.execute(
        select(
            func.coalesce(
                func.sum(case(
                    (
                        (Practice.type == PracticeType.mantra_japa) & (SessionItem.unit == ItemUnit.malas),
                        SessionItem.quantity,
                    ),
                    else_=0,
                )), 0
            ).label("total_malas"),
            func.coalesce(
                func.sum(case(
                    (
                        (Practice.type == PracticeType.mantra_japa) & (SessionItem.unit == ItemUnit.count),
                        SessionItem.quantity,
                    ),
                    else_=0,
                )), 0
            ).label("total_individual"),
            func.coalesce(func.sum(Session.duration_minutes), 0).label("total_minutes"),
        )
        .join(SessionItem, SessionItem.session_id == Session.id)
        .join(Practice, Practice.id == SessionItem.practice_id)
        .where(Session.date == today)
    ).one()

    total_malas = int(row.total_malas)
    total_minutes = int(row.total_minutes)
    total_mantras = total_malas * 108 + int(row.total_individual)
    goal = _active_daily_goal(db)
    practices = _practice_stats(db, from_date=today)

    return TodayStats(
        date=today,
        total_malas=total_malas,
        total_minutes=total_minutes,
        total_mantras=total_mantras,
        goal_malas_target=goal.target_malas if goal else None,
        goal_malas_progress=(total_malas / goal.target_malas) if goal and goal.target_malas else None,
        goal_minutes_target=goal.target_minutes if goal else None,
        goal_minutes_progress=(
            (total_minutes / goal.target_minutes) if goal and goal.target_minutes else None
        ),
        practices=practices,
    )


@router.get("/streak", response_model=StreakStats)
def streak_stats(db: DBSession = Depends(get_db)) -> StreakStats:
    dates: list[datetime.date] = list(
        db.scalars(
            select(Session.date).distinct().order_by(Session.date.desc())
        ).all()
    )

    if not dates:
        return StreakStats(current_streak=0, longest_streak=0, last_session_date=None)

    today = datetime.date.today()
    last = dates[0]

    current_streak = 0
    if last >= today - timedelta(days=1):
        cursor = last
        for d in dates:
            if d == cursor:
                current_streak += 1
                cursor -= timedelta(days=1)
            else:
                break

    longest = 1
    run = 1
    for i in range(1, len(dates)):
        if dates[i - 1] - dates[i] == timedelta(days=1):
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    return StreakStats(
        current_streak=current_streak,
        longest_streak=longest,
        last_session_date=last,
    )


@router.get("/calendar", response_model=list[CalendarDay])
def calendar_stats(db: DBSession = Depends(get_db)) -> list[CalendarDay]:
    since = datetime.date.today() - timedelta(days=364)

    rows = db.execute(
        select(
            Session.date,
            func.coalesce(
                func.sum(case(
                    (
                        (Practice.type == PracticeType.mantra_japa) & (SessionItem.unit == ItemUnit.malas),
                        SessionItem.quantity,
                    ),
                    else_=0,
                )), 0
            ).label("total_malas"),
            func.coalesce(func.sum(Session.duration_minutes), 0).label("total_minutes"),
            func.count(Session.id.distinct()).label("session_count"),
        )
        .outerjoin(SessionItem, SessionItem.session_id == Session.id)
        .outerjoin(Practice, Practice.id == SessionItem.practice_id)
        .where(Session.date >= since)
        .group_by(Session.date)
        .order_by(Session.date)
    ).all()

    return [
        CalendarDay(
            date=r.date,
            total_malas=int(r.total_malas),
            total_minutes=int(r.total_minutes),
            session_count=r.session_count,
        )
        for r in rows
    ]


@router.get("/overview", response_model=OverviewStats)
def overview_stats(db: DBSession = Depends(get_db)) -> OverviewStats:
    today = datetime.date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    def agg(from_date: datetime.date | None = None) -> tuple[int, int, int]:
        stmt = select(
            func.coalesce(
                func.sum(case(
                    (
                        (Practice.type == PracticeType.mantra_japa) & (SessionItem.unit == ItemUnit.malas),
                        SessionItem.quantity,
                    ),
                    else_=0,
                )), 0
            ).label("malas"),
            func.coalesce(func.sum(Session.duration_minutes), 0).label("minutes"),
            func.count(Session.id.distinct()).label("sessions"),
        ).outerjoin(SessionItem, SessionItem.session_id == Session.id).outerjoin(
            Practice, Practice.id == SessionItem.practice_id
        )
        if from_date:
            stmt = stmt.where(Session.date >= from_date)
        row = db.execute(stmt).one()
        return int(row.malas), int(row.minutes), int(row.sessions)

    total_malas, total_minutes, total_sessions = agg()
    week_malas, week_minutes, week_sessions = agg(week_start)
    month_malas, month_minutes, month_sessions = agg(month_start)

    return OverviewStats(
        total_sessions=total_sessions,
        total_malas_all_time=total_malas,
        total_minutes_all_time=total_minutes,
        total_sessions_this_week=week_sessions,
        total_sessions_this_month=month_sessions,
        total_malas_this_week=week_malas,
        total_malas_this_month=month_malas,
        total_minutes_this_week=week_minutes,
        total_minutes_this_month=month_minutes,
        avg_malas_per_session=round(total_malas / total_sessions, 1) if total_sessions else 0.0,
        avg_minutes_per_session=round(total_minutes / total_sessions, 1) if total_sessions else 0.0,
        practices=_practice_stats(db),
    )
