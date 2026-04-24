"""entrances HTTP 端點 — GET /entrances?storeId=..."""

from fastapi import APIRouter, Query

from app.deps import DbSession
from app.entrances.schema import EntranceOut
from app.entrances.service import EntrancesService

router = APIRouter(prefix="/entrances", tags=["entrances"])


@router.get("", response_model=list[EntranceOut])
def list_entrances(
    db: DbSession, store_id: int = Query(..., alias="storeId")
) -> list[EntranceOut]:
    """列出指定店的出入口（含今日進店人數）。"""
    return EntrancesService.list_entrances(db, store_id)
