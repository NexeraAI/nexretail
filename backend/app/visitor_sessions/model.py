"""visitor_sessions 表 ORM model — 顧客一次到店一筆。"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import BaseModel


class VisitorSession(BaseModel):
    """
    顧客到店 session — 每次進店產生一筆，離店時補上 exited_at 與 stay_seconds。

    `anon_id` 是辨識同一人的匿名 hash（通常為 face embedding 的 SHA-256）；
    跨 session 相同 `anon_id` 即可判斷是回頭客。
    `interested_flag` 由後端推論是否為高意願顧客。
    """

    __tablename__ = "visitor_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), index=True)
    anon_id: Mapped[str] = mapped_column(String(64), index=True)
    entered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    exited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    stay_seconds: Mapped[int] = mapped_column(Integer, default=0)
    gender: Mapped[str] = mapped_column(String(1))
    age_group: Mapped[str] = mapped_column(String(8))
    companion_count: Mapped[int] = mapped_column(Integer, default=0)
    entrance_id: Mapped[int | None] = mapped_column(ForeignKey("entrances.id"))
    thumbnail_url: Mapped[str | None] = mapped_column(String(256))
    full_body_url: Mapped[str | None] = mapped_column(String(256))
    status: Mapped[str] = mapped_column(String(16), default="left")
    interested_flag: Mapped[bool] = mapped_column(Boolean, default=False)
