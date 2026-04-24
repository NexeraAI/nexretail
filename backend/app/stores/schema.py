"""stores API 回應 schema — 包含單店欄位與 layout 聚合結果。"""

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
