"""stores API 回應 schema — 包含單店欄位、layout 聚合、overview 聚合、countries 摘要。"""

from pydantic import BaseModel

from app.areas.schema import AreaOut
from app.common.schema import OrmModel
from app.entrances.schema import EntranceOut
from app.products.schema import ProductOut


class StoreOut(OrmModel):
    """
    單店基本資訊 + 30 天流量統計。

    `month_traffic` 由 service 端從 visitor_sessions 計算後注入；直接從 ORM 映射
    時會是預設值 0。
    """

    id: int
    country_code: str
    name: str
    address: str | None = None
    tax_id: str | None = None
    phone: str | None = None
    timezone: str
    manager_name: str | None = None
    month_traffic: int = 0


class StoreLayoutOut(OrmModel):
    """單店 layout 聚合 — 給前端 main 頁一次拿到所有場景元件。"""

    store: StoreOut
    areas: list[AreaOut]
    entrances: list[EntranceOut]
    products: list[ProductOut]


class CountryOut(BaseModel):
    """國家摘要 — 從 stores 表 group by 算出，沒有獨立的 countries 表。"""

    code: str
    name: str
    store_count: int


class OverviewKpiOut(BaseModel):
    """overview 上方三個 KPI；sales 目前無資料，回 None。"""

    total_visitors: int
    avg_stay_seconds: int
    sales: int | None = None


class FlowPointOut(BaseModel):
    """30 天每日人流。"""

    date: str
    visitors: int


class WeekFlowOut(BaseModel):
    """週一～週日的每日平均人流（近 30 天該 weekday 的人數總和 ÷ 出現天數）。"""

    weekday: int
    visitors: int


class AgeGenderRowOut(BaseModel):
    """age_group × gender 的人數矩陣，一個 age_group 一筆。"""

    age_group: str
    male: int
    female: int


class GenderSplitOut(BaseModel):
    """男 / 女佔比百分比（0–100）。"""

    male_pct: float
    female_pct: float


class BehaviorTypeRowOut(BaseModel):
    """top behavior_type 佔比；pct 是百分比。"""

    behavior_type: str
    count: int
    pct: float


class AreaTimeRowOut(BaseModel):
    """各區域累計停留秒數佔比。"""

    area_id: int
    area_name: str
    seconds: int
    pct: float


class FunnelRowOut(BaseModel):
    """進店 → 賞車 → 觸摸 → 商談/試乘 漏斗一層。"""

    label: str
    value: int
    pct: float


class CompanionRowOut(BaseModel):
    """同行人數分桶 + 平均停留。"""

    label: str
    count: int
    avg_stay_seconds: int


class StoreOverviewOut(BaseModel):
    """overview 頁聚合資料 — 一次回傳所有圖表所需數字。"""

    period: str
    kpi: OverviewKpiOut
    flow_30d: list[FlowPointOut]
    week_flow: list[WeekFlowOut]
    age_gender: list[AgeGenderRowOut]
    gender_split: GenderSplitOut
    top_behaviors: list[BehaviorTypeRowOut]
    area_time: list[AreaTimeRowOut]
    funnel: list[FunnelRowOut]
    companions: list[CompanionRowOut]
