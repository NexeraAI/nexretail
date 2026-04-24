"""areas 商業邏輯 — 每區搭配今日 / 30 天統計。"""

from datetime import UTC, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.areas.model import Area
from app.areas.schema import AreaOut
from app.behavior_events.model import BehaviorEvent


class AreasService:
    """areas 業務邏輯集合。"""

    @staticmethod
    def list_areas(db: Session, store_id: int) -> list[AreaOut]:
        """
        列出指定店的所有區域，並附上今日進入人數與近 30 天日均。

        統計方式：對每個 area 用 `behavior_events.area_id` 去 distinct session_id。
        N+1 query — MVP 階段資料量小可接受，真實上線可改 single-query group by。
        """
        today_start = datetime.combine(datetime.now(UTC).date(), time.min, tzinfo=UTC)
        month_start = today_start - timedelta(days=30)

        rows = db.scalars(
            select(Area).where(Area.store_id == store_id).order_by(Area.display_order, Area.id)
        ).all()
        out: list[AreaOut] = []
        for a in rows:
            today_count = (
                db.scalar(
                    select(func.count(func.distinct(BehaviorEvent.session_id))).where(
                        BehaviorEvent.area_id == a.id,
                        BehaviorEvent.started_at >= today_start,
                    )
                )
                or 0
            )
            month_count = (
                db.scalar(
                    select(func.count(func.distinct(BehaviorEvent.session_id))).where(
                        BehaviorEvent.area_id == a.id,
                        BehaviorEvent.started_at >= month_start,
                    )
                )
                or 0
            )
            out.append(
                AreaOut(
                    id=a.id,
                    code=a.code,
                    name=a.name,
                    type=a.type,
                    polygon=a.polygon,
                    color=a.color,
                    today_count=today_count,
                    month_avg=round(month_count / 30),
                )
            )
        return out
