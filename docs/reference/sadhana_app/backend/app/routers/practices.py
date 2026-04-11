import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models import Practice
from app.schemas import PracticeCreate, PracticeResponse, PracticeUpdate

router = APIRouter(prefix="/practices", tags=["practices"])


@router.get("", response_model=list[PracticeResponse])
def list_practices(
    active_only: bool = True, db: DBSession = Depends(get_db)
) -> list[PracticeResponse]:
    stmt = select(Practice).order_by(Practice.created_at)
    if active_only:
        stmt = stmt.where(Practice.active.is_(True))
    return [PracticeResponse.model_validate(p) for p in db.scalars(stmt).all()]


@router.get("/{practice_id}", response_model=PracticeResponse)
def get_practice(practice_id: uuid.UUID, db: DBSession = Depends(get_db)) -> PracticeResponse:
    practice = db.get(Practice, practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    return PracticeResponse.model_validate(practice)


@router.post("", response_model=PracticeResponse, status_code=201)
def create_practice(body: PracticeCreate, db: DBSession = Depends(get_db)) -> PracticeResponse:
    practice = Practice(**body.model_dump())
    db.add(practice)
    db.commit()
    db.refresh(practice)
    return PracticeResponse.model_validate(practice)


@router.put("/{practice_id}", response_model=PracticeResponse)
def update_practice(
    practice_id: uuid.UUID, body: PracticeUpdate, db: DBSession = Depends(get_db)
) -> PracticeResponse:
    practice = db.get(Practice, practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(practice, field, value)
    db.commit()
    db.refresh(practice)
    return PracticeResponse.model_validate(practice)


@router.delete("/{practice_id}", status_code=204)
def delete_practice(practice_id: uuid.UUID, db: DBSession = Depends(get_db)) -> None:
    practice = db.get(Practice, practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    db.delete(practice)
    db.commit()
