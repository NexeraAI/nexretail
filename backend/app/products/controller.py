"""products HTTP 端點 — /products, /products/{id}, /products/{id}/insights。"""

from fastapi import APIRouter, Query

from app.deps import DbSession
from app.products.schema import ProductInsightOut, ProductOut
from app.products.service import ProductsService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
def list_products(
    db: DbSession, store_id: int = Query(..., alias="storeId")
) -> list[ProductOut]:
    """列出指定店的商品（含觀看 / 觸摸統計）。"""
    return ProductsService.list_products(db, store_id)


@router.get("/{pid}", response_model=ProductOut)
def get_product(pid: int, db: DbSession) -> ProductOut:
    """取單品；找不到回 404。"""
    return ProductsService.get_product(db, pid)


@router.get("/{pid}/insights", response_model=ProductInsightOut)
def get_product_insights(pid: int, db: DbSession) -> ProductInsightOut:
    return ProductsService.get_insights(db, pid)
