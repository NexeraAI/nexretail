"""products 商業邏輯 — 商品 CRUD + 平均觀看 / 觸摸次數統計。"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.behavior_events.const import BEHAVIOR_TOUCH
from app.behavior_events.model import BehaviorEvent
from app.products.model import Product
from app.products.schema import ProductOut


def _to_out(p: Product, *, avg_view: int, touches: int) -> ProductOut:
    """把 ORM Product 轉成 ProductOut，注入兩個計算欄位。"""
    return ProductOut(
        id=p.id,
        sku=p.sku,
        name=p.name,
        model=p.model,
        category=p.category,
        image_url=p.image_url,
        area_id=p.area_id,
        placement_x=p.placement_x,
        placement_y=p.placement_y,
        avg_view_seconds=avg_view,
        interaction_count=touches,
    )


class ProductsService:
    """products 業務邏輯集合。"""

    @staticmethod
    def stats(db: Session, pid: int) -> tuple[int, int]:
        """
        回傳 `(平均觀看秒數, 觸摸次數)`。

        觸摸次數只算 `behavior_type == "touch"`；平均觀看取所有該商品相關事件
        的 duration_seconds 平均，含 touch / talk / test_ride 等。
        """
        avg_view = (
            db.scalar(
                select(func.coalesce(func.avg(BehaviorEvent.duration_seconds), 0)).where(
                    BehaviorEvent.product_id == pid
                )
            )
            or 0
        )
        touches = (
            db.scalar(
                select(func.count(BehaviorEvent.id)).where(
                    BehaviorEvent.product_id == pid,
                    BehaviorEvent.behavior_type == BEHAVIOR_TOUCH,
                )
            )
            or 0
        )
        return int(avg_view), int(touches)

    @staticmethod
    def list_products(db: Session, store_id: int) -> list[ProductOut]:
        """列出指定店的所有商品（每品附統計）。"""
        rows = db.scalars(select(Product).where(Product.store_id == store_id)).all()
        return [
            _to_out(p, avg_view=avg, touches=touches)
            for p in rows
            for avg, touches in [ProductsService.stats(db, p.id)]
        ]

    @staticmethod
    def get_product(db: Session, pid: int) -> ProductOut | None:
        """取單品 + 統計；不存在回 None 由 controller 轉 404。"""
        p = db.get(Product, pid)
        if not p:
            return None
        avg_view, touches = ProductsService.stats(db, pid)
        return _to_out(p, avg_view=avg_view, touches=touches)
