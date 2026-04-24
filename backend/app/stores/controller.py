"""stores HTTP 端點 — /stores, /stores/{id}, /stores/{id}/layout。"""

from fastapi import APIRouter, HTTPException

from app.deps import DbSession
from app.stores.schema import StoreLayoutOut, StoreOut
from app.stores.service import StoresService

router = APIRouter(prefix="/stores", tags=["stores"])


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
