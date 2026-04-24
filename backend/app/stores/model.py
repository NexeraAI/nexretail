"""stores 表 ORM model — 一間實體展間一筆。"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import BaseModel


class Store(BaseModel):
    """
    商場（car showroom）。

    `country_code` / `manager_name` 皆為字串，非外鍵（刻意不做 lookup 表）。
    """

    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(primary_key=True)
    country_code: Mapped[str] = mapped_column(String(2))
    name: Mapped[str] = mapped_column(String(128))
    address: Mapped[str | None] = mapped_column(String(256))
    tax_id: Mapped[str | None] = mapped_column(String(32))
    phone: Mapped[str | None] = mapped_column(String(32))
    manager_name: Mapped[str | None] = mapped_column(String(64))
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Taipei")
