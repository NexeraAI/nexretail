"""areas API 回應 schema — 含區域基本資訊與即時統計欄位。"""

from app.common.schema import OrmModel


class AreaOut(OrmModel):
    """
    區域回應欄位。

    `today_count` 為今天進入過該區的獨立 session 數；`month_avg` 為近 30 天
    每日平均（由 service 端計算並注入，從 ORM 直接映射時是 0）。
    """

    id: int
    code: str
    name: str
    type: str
    polygon: dict | None = None
    color: str | None = None
    today_count: int = 0
    month_avg: int = 0
