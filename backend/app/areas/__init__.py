"""areas 模組 — 區域（展車區 / 商談區等）API 的註冊入口。"""

from fastapi import FastAPI


def init_app(app: FastAPI) -> None:
    """將 /api/v1/areas router 掛載到 FastAPI app。"""
    from app.areas.controller import router

    app.include_router(router, prefix="/api/v1")
