"""edge 模組 — 地端設備上傳 visitor_sessions / positions / behaviors 的 API 入口。"""

from fastapi import FastAPI


def init_app(app: FastAPI) -> None:
    """將 /api/v1/edge router 掛載到 FastAPI app。"""
    from app.edge.controller import router

    app.include_router(router, prefix="/api/v1")
