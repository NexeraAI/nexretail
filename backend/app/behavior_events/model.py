"""behavior_events 表 ORM model — 顧客單一行為事件（進店 / 觸摸 / 商談…）。"""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import BaseModel


class BehaviorEvent(BaseModel):
    """
    顧客行為事件 — 一筆對應一次具體動作（商品互動即 `behavior_type == "touch"`）。

    `behavior_type` 是字串 enum，允許值見 `const.BEHAVIOR_CODES`；
    `duration_seconds` = ended_at - started_at（冗餘欄位，方便直接 SUM）。
    """

    __tablename__ = "behavior_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("visitor_sessions.id"), index=True)
    behavior_type: Mapped[str] = mapped_column(String(32))
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id"))
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
