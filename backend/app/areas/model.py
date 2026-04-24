"""areas 表 ORM model — 店內劃分的邏輯區域，含 polygon 給前端畫格。"""

from sqlalchemy import JSON, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import BaseModel


class Area(BaseModel):
    """
    店內的邏輯區域（A 展車區、B 配件區…）。

    `polygon` 是 JSON，通常是 `{"rect": [x, y, w, h]}`，也可以是
    `{"points": [[x, y], ...]}` 給不規則形狀；前端 main 頁依此畫出範圍框。

    `(store_id, code)` 唯一確保同店不會有兩個代碼相同的區域。
    """

    __tablename__ = "areas"
    __table_args__ = (UniqueConstraint("store_id", "code", name="uq_area_store_code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), index=True)
    code: Mapped[str] = mapped_column(String(16))
    name: Mapped[str] = mapped_column(String(64))
    type: Mapped[str] = mapped_column(String(32))
    polygon: Mapped[dict | None] = mapped_column(JSON)
    color: Mapped[str | None] = mapped_column(String(16))
    display_order: Mapped[int] = mapped_column(Integer, default=0)
