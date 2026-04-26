"""stores HTTP 端點 — /stores, /stores/countries, /stores/{id}, /stores/{id}/layout, /stores/{id}/overview, /stores/{id}/entrances/insights。"""

from fastapi import APIRouter, HTTPException

from app.deps import DbSession
from app.entrances.schema import EntranceInsightsOut
from app.entrances.service import EntrancesService
from app.stores.schema import (
    CountryOut,
    StoreLayoutOut,
    StoreOut,
    StoreOverviewOut,
)
from app.stores.service import StoresService

router = APIRouter(prefix="/stores", tags=["stores"])


# /stores/countries 必須宣告在 /stores/{store_id} 之前，否則會被吃掉
@router.get("/countries", response_model=list[CountryOut])
def list_countries(db: DbSession) -> list[CountryOut]:
    """從 stores 表 group by 算出國家清單與每國店數。"""
    return StoresService.list_countries(db)


@router.get("", response_model=list[StoreOut])
def list_stores(db: DbSession, country: str | None = None) -> list[StoreOut]:
    """列出店鋪，可用 ?country=TW 過濾。"""
    return StoresService.list_stores(db, country)


@router.get("/{store_id}", response_model=StoreOut)
def get_store(store_id: int, db: DbSession) -> StoreOut:
    """取單店；找不到回 404。"""
    out = StoresService.get_store(db, store_id)
    if out is None:
        raise HTTPException(404, {"code": "not_found", "message": "Store not found"})
    return out


@router.get("/{store_id}/layout", response_model=StoreLayoutOut)
def get_layout(store_id: int, db: DbSession) -> StoreLayoutOut:
    """取單店 layout（store + areas + entrances + products）；找不到回 404。"""
    out = StoresService.get_layout(db, store_id)
    if out is None:
        raise HTTPException(404, {"code": "not_found", "message": "Store not found"})
    return out


@router.get("/{store_id}/overview", response_model=StoreOverviewOut)
def get_overview(store_id: int, db: DbSession) -> StoreOverviewOut:
    """取單店近 30 天 overview 聚合（KPI、flow、漏斗、各圖表）；找不到回 404。"""
    out = StoresService.get_overview(db, store_id)
    if out is None:
        raise HTTPException(404, {"code": "not_found", "message": "Store not found"})
    return out


@router.get("/{store_id}/entrances/insights", response_model=EntranceInsightsOut)
def get_entrance_insights(store_id: int, db: DbSession) -> EntranceInsightsOut:
    """取單店近 30 天每入口聚合（每口指標 + 30 天 daily series）；找不到回 404。"""
    out = EntrancesService.get_insights(db, store_id)
    if out is None:
        raise HTTPException(404, {"code": "not_found", "message": "Store not found"})
    return out
