"""visitor_positions 表 ORM model — 高頻軌跡點，heatmap / 單客重播共用。"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import BaseModel


class VisitorPosition(BaseModel):
    """
    顧客位置取樣點（1–2 Hz），一筆對應一瞬間的 (x, y)。

    `store_id` 是非正規化欄位（也能從 session_id join 拿到），放在這裡是為了
    heatmap 查整店某時段全部點位時不必 join，速度明顯較快。

    索引策略：
    - `(store_id, t)` 供 heatmap 時段聚合
    - `(session_id, t)` 供單客軌跡重播

    `id` 型別：PostgreSQL 使用 BigInteger（量大會超過 INT 上限），SQLite 退回
    Integer（SQLite 的 INTEGER PRIMARY KEY 才支援 autoincrement）。
    """

    __tablename__ = "visitor_positions"
    __table_args__ = (
        Index("ix_visitor_positions_store_t", "store_id", "t"),
        Index("ix_visitor_positions_session_t", "session_id", "t"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer(), "sqlite"), primary_key=True, autoincrement=True
    )
    session_id: Mapped[int] = mapped_column(ForeignKey("visitor_sessions.id"))
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"))
    t: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    x: Mapped[float] = mapped_column(Float)
    y: Mapped[float] = mapped_column(Float)
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id"))
