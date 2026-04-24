"""visitor_sessions HTTP 端點 — /visitors 系列。"""

from fastapi import APIRouter, HTTPException, Query

from app.behavior_events.schema import BehaviorEventOut
from app.common.schema import Page as PageSchema
from app.deps import DbSession, Page
from app.visitor_sessions.const import DATE_SCOPE_TODAY
from app.visitor_sessions.schema import (
    AreaDwellOut,
    VisitorDetail,
    VisitorPath,
    VisitorSummary,
)
from app.visitor_sessions.service import VisitorSessionsService

router = APIRouter(prefix="/visitors", tags=["visitors"])


def _not_found() -> HTTPException:
    """共用的 404 例外產生器 — 四個 /visitors/{vid}/* 端點都用這個訊息。"""
    return HTTPException(404, {"code": "not_found", "message": "Visitor session not found"})


@router.get("", response_model=PageSchema[VisitorSummary])
def list_visitors(
    db: DbSession,
    pg: Page,
    store_id: int = Query(..., alias="storeId"),
    status_: str | None = Query(None, alias="status"),
    date_scope: str = Query(DATE_SCOPE_TODAY, alias="date"),
) -> PageSchema[VisitorSummary]:
    """顧客列表（分頁、可依日期範圍 / status 過濾）。"""
    return VisitorSessionsService.list_visitors(
        db,
        store_id=store_id,
        status_=status_,
        date_scope=date_scope,
        page=pg.page,
        size=pg.size,
        offset=pg.offset,
    )


@router.get("/{vid}", response_model=VisitorDetail)
def get_visitor(vid: int, db: DbSession) -> VisitorDetail:
    """取單客詳情（含進場 entrance 資訊）。"""
    out = VisitorSessionsService.get_visitor(db, vid)
    if out is None:
        raise _not_found()
    return out


@router.get("/{vid}/behaviors", response_model=list[BehaviorEventOut])
def get_behaviors(vid: int, db: DbSession) -> list[BehaviorEventOut]:
    """顧客行為時序 — 進店 / 駐足 / 觸摸 / 商談 依時間排序。"""
    out = VisitorSessionsService.list_behaviors(db, vid)
    if out is None:
        raise _not_found()
    return out


@router.get("/{vid}/area-dwell", response_model=list[AreaDwellOut])
def get_area_dwell(vid: int, db: DbSession) -> list[AreaDwellOut]:
    """顧客在各區的總停留秒數（含停留 0 秒的區域）。"""
    out = VisitorSessionsService.get_area_dwell(db, vid)
    if out is None:
        raise _not_found()
    return out


@router.get("/{vid}/path", response_model=VisitorPath)
def get_path(vid: int, db: DbSession) -> VisitorPath:
    """顧客完整移動軌跡（給前端 main 頁重播）。"""
    out = VisitorSessionsService.get_path(db, vid)
    if out is None:
        raise _not_found()
    return out
