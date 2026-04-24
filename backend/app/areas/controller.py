"""areas HTTP 端點 — GET /areas?storeId=..."""

from fastapi import APIRouter, Query

from app.areas.schema import AreaOut
from app.areas.service import AreasService
from app.deps import DbSession

router = APIRouter(prefix="/areas", tags=["areas"])


@router.get("", response_model=list[AreaOut])
def list_areas(
    db: DbSession, store_id: int = Query(..., alias="storeId")
) -> list[AreaOut]:
    """列出指定店的區域清單（含 today_count / month_avg 統計）。"""
    return AreasService.list_areas(db, store_id)
