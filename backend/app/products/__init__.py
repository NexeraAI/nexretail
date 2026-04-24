"""products 模組 — 展車 / 商品 API 的註冊入口。"""

from fastapi import FastAPI


def init_app(app: FastAPI) -> None:
    """將 /api/v1/products router 掛載到 FastAPI app。"""
    from app.products.controller import router

    app.include_router(router, prefix="/api/v1")
