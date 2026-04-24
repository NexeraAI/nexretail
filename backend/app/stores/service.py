"""stores 商業邏輯 — DB 查詢、30 天人流統計、layout 聚合。"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.areas.model import Area
from app.areas.schema import AreaOut
from app.entrances.model import Entrance
from app.entrances.schema import EntranceOut
from app.products.model import Product
from app.products.schema import ProductOut
from app.stores.model import Store
from app.stores.schema import StoreLayoutOut, StoreOut
from app.visitor_sessions.model import VisitorSession


def _to_out(s: Store, *, traffic: int = 0) -> StoreOut:
    """把 ORM Store 轉成 StoreOut，並注入計算好的 month_traffic。"""
    return StoreOut(
        id=s.id,
        country_code=s.country_code,
        name=s.name,
        address=s.address,
        tax_id=s.tax_id,
        phone=s.phone,
        timezone=s.timezone,
        manager_name=s.manager_name,
        month_traffic=traffic,
    )


class StoresService:
    """stores 業務邏輯集合；controller 呼叫這裡的靜態方法。"""

    @staticmethod
    def month_traffic(db: Session, store_id: int) -> int:
        """回傳該店近 30 天的 visitor_sessions 筆數（每次到店一筆）。"""
        since = datetime.now(UTC) - timedelta(days=30)
        return (
            db.scalar(
                select(func.count(VisitorSession.id)).where(
                    VisitorSession.store_id == store_id,
                    VisitorSession.entered_at >= since,
                )
            )
            or 0
        )

    @staticmethod
    def list_stores(db: Session, country: str | None = None) -> list[StoreOut]:
        """列出所有店；可用 `country=TW` 過濾國家。"""
        q = select(Store)
        if country:
            q = q.where(Store.country_code == country)
        return [
            _to_out(s, traffic=StoresService.month_traffic(db, s.id))
            for s in db.scalars(q.order_by(Store.id)).all()
        ]

    @staticmethod
    def get_store(db: Session, store_id: int) -> StoreOut | None:
        """取單店；不存在回 None 由 controller 轉 404。"""
        s = db.get(Store, store_id)
        if not s:
            return None
        return _to_out(s, traffic=StoresService.month_traffic(db, store_id))

    @staticmethod
    def get_layout(db: Session, store_id: int) -> StoreLayoutOut | None:
        """
        取單店完整 layout — store + areas + entrances + products。

        前端 main 頁呼叫一次即可畫出整個場景，不必打多隻 API。
        """
        s = db.get(Store, store_id)
        if not s:
            return None
        areas = db.scalars(
            select(Area).where(Area.store_id == store_id).order_by(Area.display_order, Area.id)
        ).all()
        entrances = db.scalars(select(Entrance).where(Entrance.store_id == store_id)).all()
        products = db.scalars(select(Product).where(Product.store_id == store_id)).all()
        return StoreLayoutOut(
            store=_to_out(s),
            areas=[AreaOut.model_validate(a) for a in areas],
            entrances=[EntranceOut.model_validate(e) for e in entrances],
            products=[ProductOut.model_validate(p) for p in products],
        )
