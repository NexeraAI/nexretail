"""edge ingest 商業邏輯 — 建 session / 結束 session / 批次寫 positions / behaviors。

跨表寫入集中在這裡（例如 positions 要從 session 反查 store_id），避免污染
讀取側 `visitor_sessions/service.py` 的查詢邏輯。
"""

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.behavior_events.model import BehaviorEvent
from app.edge.schema import BehaviorIn, PositionIn, VisitExitIn, VisitIn
from app.visitor_positions.model import VisitorPosition
from app.visitor_sessions.const import STATUS_ACTIVE, STATUS_LEFT
from app.visitor_sessions.model import VisitorSession


def _aware_utc(dt: datetime) -> datetime:
    """SQLite 把 timezone-aware 寫進 DB 後讀回會變 naive，而 payload 一直是 aware；
    在做秒數差之前先補回 UTC tz，避免 naive vs aware 相減炸 TypeError。"""
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


class EdgeIngestService:
    """地端上傳資料的寫入邏輯集合。"""

    @staticmethod
    def create_visit(db: Session, payload: VisitIn) -> VisitorSession:
        """新建 visitor_session；status 預設 active，離店時再由 end_visit 改成 left。"""
        v = VisitorSession(
            store_id=payload.store_id,
            anon_id=payload.anon_id,
            entered_at=payload.entered_at,
            gender=payload.gender,
            age_group=payload.age_group,
            companion_count=payload.companion_count,
            entrance_id=payload.entrance_id,
            thumbnail_url=payload.thumbnail_url,
            full_body_url=payload.full_body_url,
            status=STATUS_ACTIVE,
        )
        db.add(v)
        db.commit()
        db.refresh(v)
        return v

    @staticmethod
    def end_visit(db: Session, vid: int, payload: VisitExitIn) -> VisitorSession | None:
        """補 `exited_at`、回算 `stay_seconds`、status 改為 left；vid 不存在回 None。"""
        v = db.get(VisitorSession, vid)
        if v is None:
            return None
        v.exited_at = payload.exited_at
        v.stay_seconds = max(
            int((_aware_utc(payload.exited_at) - _aware_utc(v.entered_at)).total_seconds()), 0
        )
        v.status = STATUS_LEFT
        db.commit()
        db.refresh(v)
        return v

    @staticmethod
    def insert_positions(
        db: Session, vid: int, points: list[PositionIn]
    ) -> int | None:
        """批次插入軌跡點；`store_id` 從 session 反查（地端不必送）。vid 不存在回 None。"""
        v = db.get(VisitorSession, vid)
        if v is None:
            return None
        if not points:
            return 0
        rows = [
            VisitorPosition(
                session_id=vid,
                store_id=v.store_id,
                t=p.t,
                x=p.x,
                y=p.y,
                area_id=p.area_id,
            )
            for p in points
        ]
        db.add_all(rows)
        db.commit()
        return len(rows)

    @staticmethod
    def insert_behaviors(
        db: Session, vid: int, events: list[BehaviorIn]
    ) -> int | None:
        """批次插入行為事件；duration_seconds 缺但有 ended_at 時自動回算。vid 不存在回 None。"""
        v = db.get(VisitorSession, vid)
        if v is None:
            return None
        if not events:
            return 0
        rows: list[BehaviorEvent] = []
        for e in events:
            duration = e.duration_seconds
            if duration is None and e.ended_at is not None:
                duration = max(
                    int((_aware_utc(e.ended_at) - _aware_utc(e.started_at)).total_seconds()), 0
                )
            rows.append(
                BehaviorEvent(
                    session_id=vid,
                    behavior_type=e.behavior_type,
                    area_id=e.area_id,
                    product_id=e.product_id,
                    started_at=e.started_at,
                    ended_at=e.ended_at,
                    duration_seconds=duration or 0,
                    confidence=e.confidence,
                )
            )
        db.add_all(rows)
        db.commit()
        return len(rows)
