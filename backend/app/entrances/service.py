"""entrances 商業邏輯 — 每個入口搭配今日進店人數統計。"""

from datetime import UTC, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.behavior_events.const import (
    BEHAVIOR_BROWSE,
    BEHAVIOR_TALK,
    BEHAVIOR_TEST_RIDE,
    BEHAVIOR_TOUCH,
)
from app.behavior_events.model import BehaviorEvent
from app.entrances.model import Entrance
from app.entrances.schema import (
    EntranceDailyPointOut,
    EntranceInsightsOut,
    EntranceMetricsOut,
    EntranceOut,
)
from app.stores.model import Store
from app.visitor_sessions.model import VisitorSession

# 算 conversion 用：QR_SCAN 是平行訊號（與 funnel 一致排除）。
_FUNNEL_BEHAVIORS = [BEHAVIOR_BROWSE, BEHAVIOR_TOUCH, BEHAVIOR_TALK, BEHAVIOR_TEST_RIDE]


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

    @staticmethod
    def get_insights(db: Session, store_id: int) -> EntranceInsightsOut | None:
        """
        近 30 天每入口聚合 — 給前端 entrance 頁。

        - `today_count`：今日 0 時起的 session 數。
        - `weekday_avg` / `weekend_avg`：30 天視窗內，週間/週末日均人流。
        - `conversion_rate`：該口進店且至少有 1 個 funnel 行為（browse/touch/talk/test_ride）的比例。
        - `daily_series`：30 天每日各口人流，以 entrance code 為 key。

        在 Python 端跑 group-by 而非 SQL 多次 group：30 天 × 每店 ~ 1500 筆 session
        規模下 round-trip 比 N 次 SQL 來得划算，且邏輯一目了然。
        """
        if db.get(Store, store_id) is None:
            return None

        # 30 天視窗對齊：含今日，往前回推 29 天。讓資料窗 (entered_at >= since)
        # 與分母 (range(30)) / daily_series 桶 (start_date..start_date+29) 同口徑，
        # 否則今天的 sessions 會進 avg 分子卻無對應分母 / 不在 series 桶裡。
        today_naive = datetime.now(UTC).date()
        # SQLite 不保留 tz，回讀的 entered_at 是 naive；Python 端比較用 naive 邊界。
        today_start_naive = datetime.combine(today_naive, time.min)
        start_date = today_naive - timedelta(days=29)
        since = datetime.combine(start_date, time.min, tzinfo=UTC)

        entrances = db.scalars(
            select(Entrance).where(Entrance.store_id == store_id).order_by(Entrance.code)
        ).all()
        if not entrances:
            return EntranceInsightsOut(period="近 30 天", entrances=[], daily_series=[])

        sessions = db.execute(
            select(
                VisitorSession.id,
                VisitorSession.entrance_id,
                VisitorSession.entered_at,
            ).where(
                VisitorSession.store_id == store_id,
                VisitorSession.entered_at >= since,
                VisitorSession.entrance_id.is_not(None),
            )
        ).all()

        converted_ids: set[int] = set(
            db.scalars(
                select(func.distinct(BehaviorEvent.session_id))
                .join(VisitorSession, BehaviorEvent.session_id == VisitorSession.id)
                .where(
                    VisitorSession.store_id == store_id,
                    VisitorSession.entered_at >= since,
                    BehaviorEvent.behavior_type.in_(_FUNNEL_BEHAVIORS),
                )
            ).all()
        )

        weekday_days = sum(
            1 for i in range(30) if (start_date + timedelta(days=i)).weekday() < 5
        )
        weekend_days = 30 - weekday_days

        ent_ids = {e.id for e in entrances}
        code_by_id = {e.id: e.code for e in entrances}

        today_per: dict[int, int] = dict.fromkeys(ent_ids, 0)
        wd_per: dict[int, int] = dict.fromkeys(ent_ids, 0)
        we_per: dict[int, int] = dict.fromkeys(ent_ids, 0)
        wd_conv_per: dict[int, int] = dict.fromkeys(ent_ids, 0)
        we_conv_per: dict[int, int] = dict.fromkeys(ent_ids, 0)

        daily: dict[str, dict[str, int]] = {}
        for i in range(30):
            label = (start_date + timedelta(days=i)).strftime("%m/%d")
            daily[label] = {e.code: 0 for e in entrances}

        for sid, eid, entered_at in sessions:
            if eid not in ent_ids:
                continue
            is_weekend = entered_at.weekday() >= 5
            converted = sid in converted_ids
            if entered_at >= today_start_naive:
                today_per[eid] += 1
            if is_weekend:
                we_per[eid] += 1
                if converted:
                    we_conv_per[eid] += 1
            else:
                wd_per[eid] += 1
                if converted:
                    wd_conv_per[eid] += 1
            label = entered_at.strftime("%m/%d")
            if label in daily:
                daily[label][code_by_id[eid]] += 1

        out_entrances = [
            EntranceMetricsOut(
                id=e.id,
                code=e.code,
                name=e.name,
                type=e.type,
                position_x=e.position_x,
                position_y=e.position_y,
                today_count=today_per[e.id],
                weekday_avg=round(wd_per[e.id] / weekday_days) if weekday_days else 0,
                weekend_avg=round(we_per[e.id] / weekend_days) if weekend_days else 0,
                conversion_rate=(
                    round((wd_conv_per[e.id] + we_conv_per[e.id]) / (wd_per[e.id] + we_per[e.id]), 4)
                    if wd_per[e.id] + we_per[e.id]
                    else 0.0
                ),
                weekday_conv=(
                    round(wd_conv_per[e.id] / wd_per[e.id], 4) if wd_per[e.id] else 0.0
                ),
                weekend_conv=(
                    round(we_conv_per[e.id] / we_per[e.id], 4) if we_per[e.id] else 0.0
                ),
            )
            for e in entrances
        ]

        daily_series = [
            EntranceDailyPointOut(date=label, counts=counts)
            for label, counts in daily.items()
        ]

        return EntranceInsightsOut(
            period="近 30 天",
            entrances=out_entrances,
            daily_series=daily_series,
        )
