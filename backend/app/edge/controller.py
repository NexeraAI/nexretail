"""edge ingest HTTP 端點 — /edge 系列，地端設備呼叫。"""

from fastapi import APIRouter

from app.deps import DbSession
from app.edge.schema import (
    BehaviorIn,
    IngestResult,
    PositionIn,
    VisitExitIn,
    VisitIn,
    VisitOut,
)
from app.edge.service import EdgeIngestService

router = APIRouter(prefix="/edge", tags=["edge"])


@router.post("/visits", response_model=VisitOut, status_code=201)
def create_visit(payload: VisitIn, db: DbSession) -> VisitOut:
    """顧客進店 — 建立一筆 visitor_session，status 預設 active。"""
    v = EdgeIngestService.create_visit(db, payload)
    return VisitOut(id=v.id)


@router.patch("/visits/{vid}/exit", response_model=VisitOut)
def end_visit(vid: int, payload: VisitExitIn, db: DbSession) -> VisitOut:
    """顧客離店 — server 回算 stay_seconds、status 改 left。"""
    v = EdgeIngestService.end_visit(db, vid, payload)
    return VisitOut(id=v.id)


@router.post("/visits/{vid}/positions", response_model=IngestResult, status_code=201)
def upload_positions(
    vid: int, payload: list[PositionIn], db: DbSession
) -> IngestResult:
    """軌跡點批次上傳；store_id 由 server 從 session 反查。"""
    n = EdgeIngestService.insert_positions(db, vid, payload)
    return IngestResult(inserted=n)


@router.post("/visits/{vid}/behaviors", response_model=IngestResult, status_code=201)
def upload_behaviors(
    vid: int, payload: list[BehaviorIn], db: DbSession
) -> IngestResult:
    """行為事件批次上傳；behavior_type 必須是 BEHAVIOR_CODES 之一。"""
    n = EdgeIngestService.insert_behaviors(db, vid, payload)
    return IngestResult(inserted=n)
