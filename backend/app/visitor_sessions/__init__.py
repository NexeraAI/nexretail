"""visitor_sessions 模組 — 顧客到店 session 相關 API 的註冊入口。"""

from fastapi import FastAPI


def init_app(app: FastAPI) -> None:
    """將 /api/v1/visitors router 掛載到 FastAPI app。"""
    from app.visitor_sessions.controller import router

    app.include_router(router, prefix="/api/v1")
