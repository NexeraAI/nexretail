"""entrances 表 ORM model — 店的出入口座標，給前端 main 頁做進場標記。"""

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import BaseModel


class Entrance(BaseModel):
    """
    出入口（E1 大門、E2 停車場、E3 後門…）。

    `position_x` / `position_y` 對應前端 SVG 座標（非地理經緯度）。
    """

    __tablename__ = "entrances"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), index=True)
    code: Mapped[str] = mapped_column(String(16))
    name: Mapped[str] = mapped_column(String(64))
    type: Mapped[str] = mapped_column(String(16), default="main")
    position_x: Mapped[float] = mapped_column(Float, default=0.0)
    position_y: Mapped[float] = mapped_column(Float, default=0.0)
