"""products API 回應 schema。"""

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
