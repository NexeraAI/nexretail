"""products 商業邏輯 — 商品 CRUD + 平均觀看 / 觸摸次數統計。"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.behavior_events.const import BEHAVIOR_TOUCH
from app.behavior_events.model import BehaviorEvent
from app.products.model import Product
from app.products.schema import (
    ProductInsightAgeRow,
    ProductInsightBehaviorRow,
    ProductInsightGenderSplit,
    ProductInsightOut,
    ProductInsightVisitor,
    ProductOut,
)
from app.visitor_sessions.const import GENDER_FEMALE, GENDER_MALE
from app.visitor_sessions.model import VisitorSession


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

    @staticmethod
    def get_insights(db: Session, pid: int, recent_limit: int = 12) -> ProductInsightOut | None:
        """
        該商品的細節分析 — 互動者人口統計、行為分佈、最近互動顧客。

        `interaction_visitors` 是「至少對該商品產生過 1 個事件」的去重 session 數，
        因此前端拿來當「人數」比直接用 events 數量更合理。

        商品從未被互動時不視為錯誤：仍回 ProductInsightOut，但全 0 / 空陣列；
        product 本身不存在才回 None 由 controller 轉 404。
        """
        if not db.get(Product, pid):
            return None

        avg_view, _ = ProductsService.stats(db, pid)
        total_seconds = int(
            db.scalar(
                select(func.coalesce(func.sum(BehaviorEvent.duration_seconds), 0)).where(
                    BehaviorEvent.product_id == pid
                )
            )
            or 0
        )
        interaction_visitors = int(
            db.scalar(
                select(func.count(func.distinct(BehaviorEvent.session_id))).where(
                    BehaviorEvent.product_id == pid
                )
            )
            or 0
        )

        age_gender, gender_split, top_age = _query_product_demographics(db, pid)
        behaviors = _query_product_behaviors(db, pid)
        visitors = _query_product_recent_visitors(db, pid, recent_limit)

        return ProductInsightOut(
            interaction_visitors=interaction_visitors,
            total_seconds=total_seconds,
            avg_view_seconds=avg_view,
            top_age_group=top_age,
            age_gender=age_gender,
            gender_split=gender_split,
            behaviors=behaviors,
            visitors=visitors,
        )


def _query_product_demographics(
    db: Session, pid: int
) -> tuple[list[ProductInsightAgeRow], ProductInsightGenderSplit, str | None]:
    """互動該商品的去重 session 之 age_group × gender 矩陣 + 男女佔比 + 最大年齡層。"""
    rows = db.execute(
        select(
            VisitorSession.age_group,
            VisitorSession.gender,
            func.count(func.distinct(VisitorSession.id)),
        )
        .join(BehaviorEvent, BehaviorEvent.session_id == VisitorSession.id)
        .where(BehaviorEvent.product_id == pid)
        .group_by(VisitorSession.age_group, VisitorSession.gender)
    ).all()

    matrix: dict[str, dict[str, int]] = {}
    male_total = female_total = 0
    for age, gender, n in rows:
        cell = matrix.setdefault(age, {"M": 0, "F": 0})
        if gender == GENDER_MALE:
            cell["M"] = n
            male_total += n
        elif gender == GENDER_FEMALE:
            cell["F"] = n
            female_total += n

    age_gender = [
        ProductInsightAgeRow(age_group=age, male=v["M"], female=v["F"])
        for age, v in sorted(matrix.items())
    ]
    mf_total = male_total + female_total
    if mf_total > 0:
        male_pct = round(male_total * 100 / mf_total, 1)
        female_pct = round(100 - male_pct, 1)
    else:
        male_pct = female_pct = 0.0

    top_age: str | None = None
    if age_gender:
        top_age = max(age_gender, key=lambda r: r.male + r.female).age_group

    return (
        age_gender,
        ProductInsightGenderSplit(male_pct=male_pct, female_pct=female_pct),
        top_age,
    )


def _query_product_behaviors(db: Session, pid: int) -> list[ProductInsightBehaviorRow]:
    """該商品事件依 behavior_type 分組，依 count 倒序輸出。"""
    rows = db.execute(
        select(BehaviorEvent.behavior_type, func.count(BehaviorEvent.id))
        .where(BehaviorEvent.product_id == pid)
        .group_by(BehaviorEvent.behavior_type)
        .order_by(func.count(BehaviorEvent.id).desc())
    ).all()
    total = sum(n for _, n in rows)
    return [
        ProductInsightBehaviorRow(
            behavior_type=bt,
            count=n,
            pct=round(n * 100 / total, 1) if total else 0.0,
        )
        for bt, n in rows
    ]


def _query_product_recent_visitors(
    db: Session, pid: int, limit: int
) -> list[ProductInsightVisitor]:
    """最近與該商品互動過的去重顧客（依 session.entered_at 倒序）。"""
    rows = db.execute(
        select(
            VisitorSession.id,
            VisitorSession.gender,
            VisitorSession.age_group,
            VisitorSession.entered_at,
            VisitorSession.stay_seconds,
        )
        .join(BehaviorEvent, BehaviorEvent.session_id == VisitorSession.id)
        .where(BehaviorEvent.product_id == pid)
        .group_by(VisitorSession.id)
        .order_by(VisitorSession.entered_at.desc())
        .limit(limit)
    ).all()
    return [
        ProductInsightVisitor(
            id=vid,
            gender=gender,
            age_group=age,
            entered_at=entered,
            stay_seconds=stay,
        )
        for vid, gender, age, entered, stay in rows
    ]
