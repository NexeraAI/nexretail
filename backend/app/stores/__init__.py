"""stores 模組 — 商場資料 + layout 聚合 API 的註冊入口。"""

from fastapi import FastAPI


def init_app(app: FastAPI) -> None:
    """將 /api/v1/stores router 掛載到 FastAPI app。"""
    from app.stores.controller import router

    app.include_router(router, prefix="/api/v1")
