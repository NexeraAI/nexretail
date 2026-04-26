"""entrances API 回應 schema。"""

from pydantic import BaseModel

from app.common.schema import OrmModel


class EntranceOut(OrmModel):
    """
    出入口回應欄位。

    `today_count` 為今天由此口入店的 session 數；`conversion_rate` 是轉換率
    placeholder（0.0），等之後有 area stays 資料時再計算。
    """

    id: int
    code: str
    name: str
    type: str
    position_x: float
    position_y: float
    today_count: int = 0
    conversion_rate: float = 0.0


class EntranceMetricsOut(BaseModel):
    """單口近 30 天指標 — entrance 頁的 KPI 與長條圖直接讀。"""

    id: int
    code: str
    name: str
    type: str
    position_x: float
    position_y: float
    today_count: int
    weekday_avg: int
    weekend_avg: int
    conversion_rate: float
    weekday_conv: float
    weekend_conv: float


class EntranceDailyPointOut(BaseModel):
    """30 天每日 series 的一個點;`counts` 以 entrance code 為 key。"""

    date: str
    counts: dict[str, int]


class EntranceInsightsOut(BaseModel):
    """`/stores/{id}/entrances/insights` 聚合回應。"""

    period: str
    entrances: list[EntranceMetricsOut]
    daily_series: list[EntranceDailyPointOut]
