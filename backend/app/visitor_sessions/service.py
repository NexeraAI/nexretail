"""visitor_sessions 商業邏輯 — 顧客列表、詳情、行為時序、區停留、軌跡。"""

from datetime import UTC, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.areas.model import Area
from app.behavior_events.model import BehaviorEvent
from app.behavior_events.schema import BehaviorEventOut
from app.common.exceptions import NotFoundException
from app.common.schema import Page as PageSchema
from app.entrances.model import Entrance
from app.visitor_positions.model import VisitorPosition
from app.visitor_sessions.const import (
    DATE_SCOPE_MONTH,
    DATE_SCOPE_TODAY,
    STATUS_ACTIVE,
)
from app.visitor_sessions.model import VisitorSession
from app.visitor_sessions.schema import (
    AreaDwellOut,
    EntranceRef,
    PathPoint,
    VisitorDetail,
    VisitorPath,
    VisitorSummary,
)


class VisitorSessionsService:
    """visitor_sessions 業務邏輯集合。"""

    @staticmethod
    def list_visitors(
        db: Session,
        *,
        store_id: int,
        status_: str | None,
        date_scope: str,
        page: int,
        size: int,
        offset: int,
    ) -> PageSchema[VisitorSummary]:
        """
        顧客列表 + 分頁。

        過濾條件：
        - `date_scope="today"`：只看今天進店
        - `date_scope="month"`：近 30 天
        - `status="active"`：只看目前還在店內（未離店）
        """
        q = select(VisitorSession).where(VisitorSession.store_id == store_id)

        if date_scope == DATE_SCOPE_TODAY:
            start = datetime.combine(datetime.now(UTC).date(), time.min, tzinfo=UTC)
            q = q.where(VisitorSession.entered_at >= start)
        elif date_scope == DATE_SCOPE_MONTH:
            since = datetime.now(UTC) - timedelta(days=30)
            q = q.where(VisitorSession.entered_at >= since)

        if status_ == STATUS_ACTIVE:
            q = q.where(VisitorSession.status == STATUS_ACTIVE)

        total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
        rows = db.scalars(
            q.order_by(VisitorSession.entered_at.desc()).offset(offset).limit(size)
        ).all()

        return PageSchema[VisitorSummary](
            data=[VisitorSummary.model_validate(r) for r in rows],
            page=page,
            size=size,
            total=int(total),
            has_more=offset + len(rows) < int(total),
        )

    @staticmethod
    def get_visitor(db: Session, vid: int) -> VisitorDetail:
        """取單客詳情（含 entrance 關聯）；不存在 raise NotFoundException。"""
        v = db.get(VisitorSession, vid)
        if not v:
            raise NotFoundException("Visitor session not found")
        entrance = db.get(Entrance, v.entrance_id) if v.entrance_id else None
        return VisitorDetail(
            **VisitorSummary.model_validate(v).model_dump(),
            full_body_url=v.full_body_url,
            entrance=EntranceRef(id=entrance.id, code=entrance.code, name=entrance.name)
            if entrance
            else None,
        )

    @staticmethod
    def list_behaviors(db: Session, vid: int) -> list[BehaviorEventOut]:
        """顧客行為時序（進店→駐足→觸摸→商談…），按 started_at 排序；vid 不存在 raise NotFoundException。"""
        if not db.get(VisitorSession, vid):
            raise NotFoundException("Visitor session not found")
        rows = db.scalars(
            select(BehaviorEvent)
            .where(BehaviorEvent.session_id == vid)
            .order_by(BehaviorEvent.started_at)
        ).all()
        return [
            BehaviorEventOut(
                id=e.id,
                behavior_type=e.behavior_type,
                area_id=e.area_id,
                product_id=e.product_id,
                started_at=e.started_at,
                duration_seconds=e.duration_seconds,
            )
            for e in rows
        ]

    @staticmethod
    def get_area_dwell(db: Session, vid: int) -> list[AreaDwellOut]:
        """
        顧客在各區的總停留秒數；vid 不存在 raise NotFoundException。

        用 outer join 確保未停留的區域仍出現在結果中（dwell_seconds=0）；
        `.where(Area.store_id == v.store_id)` 避免列出其他店的區域。
        """
        v = db.get(VisitorSession, vid)
        if not v:
            raise NotFoundException("Visitor session not found")
        rows = db.execute(
            select(
                Area.id,
                Area.name,
                func.coalesce(func.sum(BehaviorEvent.duration_seconds), 0).label("s"),
            )
            .select_from(Area)
            .outerjoin(
                BehaviorEvent,
                (BehaviorEvent.area_id == Area.id) & (BehaviorEvent.session_id == vid),
            )
            .where(Area.store_id == v.store_id)
            .group_by(Area.id, Area.name, Area.display_order)
            .order_by(Area.display_order)
        ).all()
        return [
            AreaDwellOut(area_id=r.id, area_name=r.name, dwell_seconds=int(r.s)) for r in rows
        ]

    @staticmethod
    def get_path(db: Session, vid: int) -> VisitorPath:
        """回傳顧客完整軌跡點（按 t 升冪）供 main 頁重播；vid 不存在 raise NotFoundException。"""
        if not db.get(VisitorSession, vid):
            raise NotFoundException("Visitor session not found")
        rows = db.scalars(
            select(VisitorPosition)
            .where(VisitorPosition.session_id == vid)
            .order_by(VisitorPosition.t)
        ).all()
        return VisitorPath(
            session_id=vid,
            points=[PathPoint(t=r.t, x=r.x, y=r.y) for r in rows],
        )
