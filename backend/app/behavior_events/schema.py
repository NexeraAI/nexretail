"""behavior_events API 回應 schema — 用於 /visitors/{id}/behaviors。"""

from datetime import datetime

from pydantic import BaseModel


class BehaviorEventOut(BaseModel):
    """
    行為事件回應欄位。

    `behavior_type` 是字串（見 const.BEHAVIOR_CODES），前端依此決定顯示 icon / 顏色。
    """

    id: int
    behavior_type: str
    area_id: int | None
    product_id: int | None
    started_at: datetime
    duration_seconds: int
