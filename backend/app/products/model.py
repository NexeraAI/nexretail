"""products 表 ORM model — 店內展示的車款或配件。"""

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import BaseModel


class Product(BaseModel):
    """
    展示商品（展車、配件…）。

    `category` 為字串，非外鍵（刻意不做 lookup 表）。
    `area_id` 指向它被放在哪一區；`placement_x/y` 是前端 SVG 座標用來畫 marker。
    `qr_code_id` 若有值，代表該商品支援 QR 掃描互動。
    """

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), index=True)
    sku: Mapped[str] = mapped_column(String(64))
    name: Mapped[str] = mapped_column(String(128))
    model: Mapped[str | None] = mapped_column(String(64))
    category: Mapped[str | None] = mapped_column(String(32))
    image_url: Mapped[str | None] = mapped_column(String(256))
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id"))
    placement_x: Mapped[float] = mapped_column(Float, default=0.0)
    placement_y: Mapped[float] = mapped_column(Float, default=0.0)
    qr_code_id: Mapped[str | None] = mapped_column(String(64))
