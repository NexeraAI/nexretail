"""products API 回應 schema。"""

from datetime import datetime

from pydantic import BaseModel

from app.common.schema import OrmModel


class ProductOut(OrmModel):
    """
    商品回應欄位。

    `avg_view_seconds`：該商品被駐足 / 觸摸事件的平均持續秒數。
    `interaction_count`：被 `behavior_type == touch` 事件觸發的次數。
    兩者由 service 端計算並注入。
    """

    id: int
    sku: str
    name: str
    model: str | None
    category: str | None
    image_url: str | None
    area_id: int | None
    placement_x: float
    placement_y: float
    avg_view_seconds: int = 0
    interaction_count: int = 0


class ProductInsightAgeRow(BaseModel):
    age_group: str
    male: int
    female: int


class ProductInsightGenderSplit(BaseModel):
    """互動者男女佔比百分比（合計 100，全 0 表示無互動）。"""

    male_pct: float
    female_pct: float


class ProductInsightBehaviorRow(BaseModel):
    behavior_type: str
    count: int
    pct: float


class ProductInsightVisitor(BaseModel):
    id: int
    gender: str
    age_group: str
    entered_at: datetime
    stay_seconds: int


class ProductInsightOut(BaseModel):
    """
    單一商品的細節分析 — 由 `behavior_events` JOIN `visitor_sessions` 算出。

    所有欄位皆 per-product；當該商品從未被互動，回傳全 0 / 空陣列。
    """

    interaction_visitors: int
    total_seconds: int
    avg_view_seconds: int
    top_age_group: str | None
    age_gender: list[ProductInsightAgeRow]
    gender_split: ProductInsightGenderSplit
    behaviors: list[ProductInsightBehaviorRow]
    visitors: list[ProductInsightVisitor]
