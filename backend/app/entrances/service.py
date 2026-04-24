"""entrances 商業邏輯 — 每個入口搭配今日進店人數統計。"""

from datetime import UTC, datetime, time

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.entrances.model import Entrance
from app.entrances.schema import EntranceOut
from app.visitor_sessions.model import VisitorSession


class EntrancesService:
    """entrances 業務邏輯集合。"""

    @staticmethod
    def list_entrances(db: Session, store_id: int) -> list[EntranceOut]:
        """
        列出指定店的入口 + 今日進店人數。

        今日人數：用 `visitor_sessions.entrance_id` 過濾 entered_at >= 今天 0 時。
        """
        today_start = datetime.combine(datetime.now(UTC).date(), time.min, tzinfo=UTC)
        rows = db.scalars(
            select(Entrance).where(Entrance.store_id == store_id).order_by(Entrance.code)
        ).all()
        out: list[EntranceOut] = []
        for e in rows:
            today = (
                db.scalar(
                    select(func.count(VisitorSession.id)).where(
                        VisitorSession.entrance_id == e.id,
                        VisitorSession.entered_at >= today_start,
                    )
                )
                or 0
            )
            out.append(
                EntranceOut(
                    id=e.id,
                    code=e.code,
                    name=e.name,
                    type=e.type,
                    position_x=e.position_x,
                    position_y=e.position_y,
                    today_count=today,
                )
            )
        return out
