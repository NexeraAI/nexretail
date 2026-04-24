"""products HTTP 端點 — /products, /products/{id}。"""

from fastapi import APIRouter, HTTPException, Query

from app.deps import DbSession
from app.products.schema import ProductOut
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
    out = ProductsService.get_product(db, pid)
    if out is None:
        raise HTTPException(404, {"code": "not_found", "message": "Product not found"})
    return out
