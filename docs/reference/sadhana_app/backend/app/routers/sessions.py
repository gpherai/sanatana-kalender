import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession, selectinload

from app.database import get_db
from app.models import Practice, Session, SessionItem
from app.schemas import (
    SessionCreate,
    SessionItemCreate,
    SessionItemResponse,
    SessionItemUpdate,
    SessionResponse,
    SessionUpdate,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])

_load_items = selectinload(Session.items).selectinload(SessionItem.practice)


def _get_or_404(db: DBSession, session_id: uuid.UUID) -> Session:
    session = db.scalars(
        select(Session).where(Session.id == session_id).options(_load_items)
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("", response_model=SessionResponse, status_code=201)
def create_session(body: SessionCreate, db: DBSession = Depends(get_db)) -> SessionResponse:
    session = Session(
        date=body.date,
        started_at=body.started_at,
        duration_minutes=body.duration_minutes,
        notes=body.notes,
    )
    db.add(session)
    db.flush()  # get session.id before adding items

    for item_data in body.items:
        practice = db.get(Practice, item_data.practice_id)
        if not practice:
            raise HTTPException(
                status_code=422, detail=f"Practice {item_data.practice_id} not found"
            )
        db.add(SessionItem(session_id=session.id, **item_data.model_dump()))

    db.commit()
    session = _get_or_404(db, session.id)
    return SessionResponse.from_orm(session)


@router.get("", response_model=list[SessionResponse])
def list_sessions(
    from_date: datetime.date | None = Query(default=None, alias="from"),
    to_date: datetime.date | None = Query(default=None, alias="to"),
    db: DBSession = Depends(get_db),
) -> list[SessionResponse]:
    stmt = (
        select(Session)
        .options(_load_items)
        .order_by(Session.date.desc(), Session.created_at.desc())
    )
    if from_date:
        stmt = stmt.where(Session.date >= from_date)
    if to_date:
        stmt = stmt.where(Session.date <= to_date)
    return [SessionResponse.from_orm(s) for s in db.scalars(stmt).all()]


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: uuid.UUID, db: DBSession = Depends(get_db)) -> SessionResponse:
    return SessionResponse.from_orm(_get_or_404(db, session_id))


@router.put("/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: uuid.UUID, body: SessionUpdate, db: DBSession = Depends(get_db)
) -> SessionResponse:
    session = _get_or_404(db, session_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    return SessionResponse.from_orm(_get_or_404(db, session_id))


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: uuid.UUID, db: DBSession = Depends(get_db)) -> None:
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()


# --- Session Items ---

@router.post("/{session_id}/items", response_model=SessionItemResponse, status_code=201)
def add_item(
    session_id: uuid.UUID, body: SessionItemCreate, db: DBSession = Depends(get_db)
) -> SessionItemResponse:
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    practice = db.get(Practice, body.practice_id)
    if not practice:
        raise HTTPException(status_code=422, detail="Practice not found")
    item = SessionItem(session_id=session_id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    # load practice for response
    item.practice  # noqa: B018 — triggers lazy load before session closes
    return SessionItemResponse.from_orm(item)


@router.put("/{session_id}/items/{item_id}", response_model=SessionItemResponse)
def update_item(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    body: SessionItemUpdate,
    db: DBSession = Depends(get_db),
) -> SessionItemResponse:
    item = db.scalars(
        select(SessionItem)
        .where(SessionItem.id == item_id, SessionItem.session_id == session_id)
        .options(selectinload(SessionItem.practice))
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    item.practice  # noqa: B018
    return SessionItemResponse.from_orm(item)


@router.delete("/{session_id}/items/{item_id}", status_code=204)
def delete_item(
    session_id: uuid.UUID, item_id: uuid.UUID, db: DBSession = Depends(get_db)
) -> None:
    item = db.scalars(
        select(SessionItem).where(
            SessionItem.id == item_id, SessionItem.session_id == session_id
        )
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
