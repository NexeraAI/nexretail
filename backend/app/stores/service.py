"""stores 商業邏輯 — DB 查詢、30 天人流統計、layout 與 overview 聚合。"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.areas.model import Area
from app.areas.schema import AreaOut
from app.behavior_events.const import (
    BEHAVIOR_BROWSE,
    BEHAVIOR_QR_SCAN,
    BEHAVIOR_TALK,
    BEHAVIOR_TEST_RIDE,
    BEHAVIOR_TOUCH,
)
from app.behavior_events.model import BehaviorEvent
from app.entrances.model import Entrance
from app.entrances.schema import EntranceOut
from app.products.model import Product
from app.products.schema import ProductOut
from app.stores.const import COUNTRY_NAMES
from app.stores.model import Store
from app.stores.schema import (
    AgeGenderRowOut,
    AreaTimeRowOut,
    BehaviorTypeRowOut,
    CompanionRowOut,
    CountryOut,
    FlowPointOut,
    FunnelRowOut,
    GenderSplitOut,
    OverviewKpiOut,
    StoreLayoutOut,
    StoreOut,
    StoreOverviewOut,
    WeekFlowOut,
)
from app.visitor_sessions.const import GENDER_FEMALE, GENDER_MALE
from app.visitor_sessions.model import VisitorSession


def _to_out(s: Store, *, traffic: int = 0) -> StoreOut:
    """把 ORM Store 轉成 StoreOut，並注入計算好的 month_traffic。"""
    return StoreOut(
        id=s.id,
        country_code=s.country_code,
        name=s.name,
        address=s.address,
        tax_id=s.tax_id,
        phone=s.phone,
        timezone=s.timezone,
        manager_name=s.manager_name,
        month_traffic=traffic,
    )


class StoresService:
    """stores 業務邏輯集合；controller 呼叫這裡的靜態方法。"""

    @staticmethod
    def month_traffic(db: Session, store_id: int) -> int:
        """回傳該店近 30 天的 visitor_sessions 筆數（每次到店一筆）。"""
        since = datetime.now(UTC) - timedelta(days=30)
        return (
            db.scalar(
                select(func.count(VisitorSession.id)).where(
                    VisitorSession.store_id == store_id,
                    VisitorSession.entered_at >= since,
                )
            )
            or 0
        )

    @staticmethod
    def list_stores(db: Session, country: str | None = None) -> list[StoreOut]:
        """列出所有店；可用 `country=TW` 過濾國家。"""
        q = select(Store)
        if country:
            q = q.where(Store.country_code == country)
        return [
            _to_out(s, traffic=StoresService.month_traffic(db, s.id))
            for s in db.scalars(q.order_by(Store.id)).all()
        ]

    @staticmethod
    def list_countries(db: Session) -> list[CountryOut]:
        """從 stores 表 group by country_code 算出每國店數，沒有獨立 countries 表。"""
        rows = db.execute(
            select(Store.country_code, func.count(Store.id))
            .group_by(Store.country_code)
            .order_by(Store.country_code)
        ).all()
        return [
            CountryOut(
                code=code,
                name=COUNTRY_NAMES.get(code, code),
                store_count=n,
            )
            for code, n in rows
        ]

    @staticmethod
    def get_store(db: Session, store_id: int) -> StoreOut | None:
        """取單店；不存在回 None 由 controller 轉 404。"""
        s = db.get(Store, store_id)
        if not s:
            return None
        return _to_out(s, traffic=StoresService.month_traffic(db, store_id))

    @staticmethod
    def get_layout(db: Session, store_id: int) -> StoreLayoutOut | None:
        """
        取單店完整 layout — store + areas + entrances + products。

        前端 main 頁呼叫一次即可畫出整個場景，不必打多隻 API。
        """
        s = db.get(Store, store_id)
        if not s:
            return None
        areas = db.scalars(
            select(Area).where(Area.store_id == store_id).order_by(Area.display_order, Area.id)
        ).all()
        entrances = db.scalars(select(Entrance).where(Entrance.store_id == store_id)).all()
        products = db.scalars(select(Product).where(Product.store_id == store_id)).all()
        return StoreLayoutOut(
            store=_to_out(s),
            areas=[AreaOut.model_validate(a) for a in areas],
            entrances=[EntranceOut.model_validate(e) for e in entrances],
            products=[ProductOut.model_validate(p) for p in products],
        )

    @staticmethod
    def get_overview(db: Session, store_id: int) -> StoreOverviewOut | None:
        """
        近 30 天的 overview 聚合 — 一次回傳前端 dashboard 所有圖表用的數字。

        SQLite 為 dev 預設 DB；日期分桶用 `strftime`，未來換 Postgres 時要改 `date_trunc` /
        `extract`。Sales 目前無資料來源，KPI 的 `sales` 永遠回 None。
        """
        s = db.get(Store, store_id)
        if not s:
            return None

        since = datetime.now(UTC) - timedelta(days=30)
        sess_filter = (
            VisitorSession.store_id == store_id,
            VisitorSession.entered_at >= since,
        )

        total_visitors = db.scalar(
            select(func.count(VisitorSession.id)).where(*sess_filter)
        ) or 0
        avg_stay_seconds = int(
            db.scalar(select(func.avg(VisitorSession.stay_seconds)).where(*sess_filter)) or 0
        )

        flow_30d = _query_flow_30d(db, store_id, since)
        week_flow = _query_week_flow(db, store_id, since)
        age_gender, gender_split = _query_demographics(db, store_id, since)
        top_behaviors = _query_top_behaviors(db, store_id, since)
        area_time = _query_area_time(db, store_id, since)
        funnel = _query_funnel(db, store_id, since, total_visitors)
        companions = _query_companions(db, store_id, since)

        return StoreOverviewOut(
            period="近 30 天",
            kpi=OverviewKpiOut(
                total_visitors=total_visitors,
                avg_stay_seconds=avg_stay_seconds,
                sales=None,
            ),
            flow_30d=flow_30d,
            week_flow=week_flow,
            age_gender=age_gender,
            gender_split=gender_split,
            top_behaviors=top_behaviors,
            area_time=area_time,
            funnel=funnel,
            companions=companions,
        )


def _query_flow_30d(db: Session, store_id: int, since: datetime) -> list[FlowPointOut]:
    """
    30 天每日人流；缺資料的日期補 0，UI 才能正確顯示「冷清日」。

    用 since 作為起始日，往後產 30 天的 MM/DD label 列表，再把 DB 結果填入。
    """
    rows = db.execute(
        select(
            func.strftime("%m/%d", VisitorSession.entered_at).label("d"),
            func.count(VisitorSession.id),
        )
        .where(VisitorSession.store_id == store_id, VisitorSession.entered_at >= since)
        .group_by("d")
    ).all()
    counts = {d: n for d, n in rows}

    out: list[FlowPointOut] = []
    start = since.date()
    for i in range(30):
        day = start + timedelta(days=i)
        label = day.strftime("%m/%d")
        out.append(FlowPointOut(date=label, visitors=counts.get(label, 0)))
    return out


def _query_week_flow(db: Session, store_id: int, since: datetime) -> list[WeekFlowOut]:
    """
    週一～週日每日平均人流（近 30 天）。

    SQL 算出每個 weekday 在窗內的「總人數」，再除以該 weekday 在 30 天視窗中
    出現的天數（5 個 weekday 各 4 次、2 個 weekday 各 5 次）才是日均；
    若直接回傳總和，週間日均會被高估約 4 倍。
    """
    rows = db.execute(
        select(
            func.strftime("%w", VisitorSession.entered_at).label("w"),
            func.count(VisitorSession.id),
        )
        .where(VisitorSession.store_id == store_id, VisitorSession.entered_at >= since)
        .group_by("w")
    ).all()
    # SQLite 的 %w：0=Sun..6=Sat → 轉成 0=Mon..6=Sun
    sun_to_mon = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}
    totals = [0] * 7
    for raw_w, n in rows:
        totals[sun_to_mon[int(raw_w)]] = n

    # Python weekday(): Mon=0..Sun=6，與輸出索引一致
    occurrences = [0] * 7
    start = since.date()
    for i in range(30):
        occurrences[(start + timedelta(days=i)).weekday()] += 1

    return [
        WeekFlowOut(
            weekday=i,
            visitors=round(totals[i] / occurrences[i]) if occurrences[i] else 0,
        )
        for i in range(7)
    ]


def _query_demographics(
    db: Session, store_id: int, since: datetime
) -> tuple[list[AgeGenderRowOut], GenderSplitOut]:
    """age_group × gender 矩陣 + 男女佔比百分比；gender 合法值只有 M / F。"""
    rows = db.execute(
        select(
            VisitorSession.age_group,
            VisitorSession.gender,
            func.count(VisitorSession.id),
        )
        .where(VisitorSession.store_id == store_id, VisitorSession.entered_at >= since)
        .group_by(VisitorSession.age_group, VisitorSession.gender)
    ).all()

    matrix: dict[str, dict[str, int]] = {}
    male_total = female_total = 0
    for age, gender, n in rows:
        cell = matrix.setdefault(age, {"M": 0, "F": 0})
        cell[gender] = n
        if gender == GENDER_MALE:
            male_total += n
        else:
            female_total += n

    age_gender = [
        AgeGenderRowOut(age_group=age, male=v["M"], female=v["F"])
        for age, v in sorted(matrix.items())
    ]
    mf_total = male_total + female_total
    if mf_total > 0:
        male_pct = round(male_total * 100 / mf_total, 1)
        female_pct = round(100 - male_pct, 1)
    else:
        male_pct = female_pct = 0.0
    return age_gender, GenderSplitOut(male_pct=male_pct, female_pct=female_pct)


def _query_top_behaviors(
    db: Session, store_id: int, since: datetime
) -> list[BehaviorTypeRowOut]:
    """behavior_events 按 behavior_type 分組計數，取前 5。"""
    rows = db.execute(
        select(BehaviorEvent.behavior_type, func.count(BehaviorEvent.id))
        .join(VisitorSession, BehaviorEvent.session_id == VisitorSession.id)
        .where(
            VisitorSession.store_id == store_id,
            BehaviorEvent.started_at >= since,
        )
        .group_by(BehaviorEvent.behavior_type)
        .order_by(func.count(BehaviorEvent.id).desc())
        .limit(5)
    ).all()
    total = sum(n for _, n in rows)
    return [
        BehaviorTypeRowOut(
            behavior_type=bt,
            count=n,
            pct=round(n * 100 / total, 1) if total else 0.0,
        )
        for bt, n in rows
    ]


def _query_area_time(db: Session, store_id: int, since: datetime) -> list[AreaTimeRowOut]:
    """各區域累計停留秒數佔比 — 從 behavior_events.duration_seconds 加總。"""
    rows = db.execute(
        select(
            Area.id,
            Area.name,
            func.sum(BehaviorEvent.duration_seconds),
        )
        .join(VisitorSession, BehaviorEvent.session_id == VisitorSession.id)
        .join(Area, BehaviorEvent.area_id == Area.id)
        .where(
            VisitorSession.store_id == store_id,
            BehaviorEvent.started_at >= since,
        )
        .group_by(Area.id, Area.name)
        .order_by(func.sum(BehaviorEvent.duration_seconds).desc())
    ).all()
    total = sum(int(s or 0) for _, _, s in rows)
    return [
        AreaTimeRowOut(
            area_id=aid,
            area_name=name,
            seconds=int(s or 0),
            pct=round(int(s or 0) * 100 / total, 1) if total else 0.0,
        )
        for aid, name, s in rows
    ]


def _query_funnel(
    db: Session, store_id: int, since: datetime, total_visitors: int
) -> list[FunnelRowOut]:
    """
    漏斗：進店 → 賞車 → 觸摸 → 商談/試乘；每層是「至少做過該層或更深行為」的累積去重。

    之所以用累積：實務上進到「商談」階段的客人一定先有「觸摸」「賞車」過，
    若每層只算當層 behavior_type 會出現後段大於前段的反邏輯。
    """

    # 用 VisitorSession.entered_at 過濾，跟 total_visitors 同口徑；若改用
    # BehaviorEvent.started_at 會把窗外進店、窗內才有事件的 session 算進來，
    # 造成漏斗層數 > 進店總人流（>100%）。
    def _distinct_session_count(behavior_types: list[str]) -> int:
        return db.scalar(
            select(func.count(func.distinct(BehaviorEvent.session_id)))
            .join(VisitorSession, BehaviorEvent.session_id == VisitorSession.id)
            .where(
                VisitorSession.store_id == store_id,
                VisitorSession.entered_at >= since,
                BehaviorEvent.behavior_type.in_(behavior_types),
            )
        ) or 0

    # 賞車及更深 ⊇ 觸摸及更深 ⊇ 商談/試乘。
    # QR_SCAN 是平行的低投入訊號（掃 QR ≠ 在現場賞車），不算 funnel 階段。
    browse_or_deeper = _distinct_session_count(
        [BEHAVIOR_BROWSE, BEHAVIOR_TOUCH, BEHAVIOR_TALK, BEHAVIOR_TEST_RIDE]
    )
    touch_or_deeper = _distinct_session_count(
        [BEHAVIOR_TOUCH, BEHAVIOR_TALK, BEHAVIOR_TEST_RIDE]
    )
    talk_or_deeper = _distinct_session_count([BEHAVIOR_TALK, BEHAVIOR_TEST_RIDE])

    def _row(label: str, value: int) -> FunnelRowOut:
        pct = round(value * 100 / total_visitors, 1) if total_visitors else 0.0
        return FunnelRowOut(label=label, value=value, pct=pct)

    return [
        _row("進店總人流", total_visitors),
        _row("賞車行為人數", browse_or_deeper),
        _row("觸摸商品人數", touch_or_deeper),
        _row("商談/試乘人數", talk_or_deeper),
    ]


def _query_companions(
    db: Session, store_id: int, since: datetime
) -> list[CompanionRowOut]:
    """同行人數分桶（0/1/2/3+）+ 每桶平均停留秒數。"""
    rows = db.execute(
        select(
            VisitorSession.companion_count,
            func.count(VisitorSession.id),
            func.avg(VisitorSession.stay_seconds),
        )
        .where(VisitorSession.store_id == store_id, VisitorSession.entered_at >= since)
        .group_by(VisitorSession.companion_count)
        .order_by(VisitorSession.companion_count)
    ).all()

    buckets = {
        "獨自一人": [0, 0],
        "2 人同行": [0, 0],
        "3 人同行": [0, 0],
        "4 人以上": [0, 0],
    }
    for cc, n, avg in rows:
        if cc <= 0:
            key = "獨自一人"
        elif cc == 1:
            key = "2 人同行"
        elif cc == 2:
            key = "3 人同行"
        else:
            key = "4 人以上"
        buckets[key][0] += n
        buckets[key][1] += int(avg or 0) * n

    out: list[CompanionRowOut] = []
    for label, (count, weighted) in buckets.items():
        avg_stay = int(weighted / count) if count else 0
        out.append(CompanionRowOut(label=label, count=count, avg_stay_seconds=avg_stay))
    return out
