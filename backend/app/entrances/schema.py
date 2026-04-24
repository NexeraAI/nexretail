"""entrances API 回應 schema。"""

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
