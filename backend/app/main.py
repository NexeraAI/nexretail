"""FastAPI 應用程式入口 — 裝 CORS、統一錯誤 envelope、呼叫各模組的 init_app 註冊路由。"""

import logging
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import (
    areas,
    entrances,
    products,
    stores,
    visitor_sessions,
)
from app.config import get_settings

settings = get_settings()
log = logging.getLogger("nexretail")

app = FastAPI(
    title="Retail AI Backend",
    description="7-table MVP (stores / areas / entrances / products / visitor_sessions / visitor_positions / behavior_events)",
    version="0.2.0",
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _envelope(code: str, message: str, status_code: int, details: dict | None = None):
    """
    產生統一格式的錯誤回應 body：

        { "error": { "code", "message", "traceId", "details" } }

    前端收到錯誤時只要看這個結構即可，不用區分 400 / 404 / 500 各家格式。
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "traceId": uuid.uuid4().hex[:12],
                "details": details,
            }
        },
    )


@app.exception_handler(HTTPException)
async def http_exc_handler(_: Request, exc: HTTPException):
    """
    攔截 controller 拋出的 HTTPException。

    若 `exc.detail` 是 dict 且帶 `code` 欄位，直接使用；否則依 status_code 給一個
    合理的預設 error code。
    """
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        return _envelope(
            code=detail["code"],
            message=detail.get("message", str(exc.detail)),
            status_code=exc.status_code,
            details=detail.get("details"),
        )
    return _envelope(
        code={404: "not_found", 422: "validation_error"}.get(exc.status_code, "http_error"),
        message=str(detail),
        status_code=exc.status_code,
    )


@app.exception_handler(RequestValidationError)
async def validation_exc_handler(_: Request, exc: RequestValidationError):
    """將 pydantic / FastAPI 的 422 validation error 包進統一 envelope。"""
    return _envelope(
        code="validation_error",
        message="Request validation failed",
        status_code=422,
        details={"errors": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_handler(_: Request, exc: Exception):
    """最後一道防線：未處理的例外全部變成 500 + 記 log。"""
    log.exception("Unhandled exception")
    return _envelope(code="internal_error", message=str(exc), status_code=500)


# 每個模組自行把它的 router 掛到 app 上（init_app 模式，main.py 不碰 APIRouter 內部）。
stores.init_app(app)
areas.init_app(app)
entrances.init_app(app)
products.init_app(app)
visitor_sessions.init_app(app)


@app.get("/health", tags=["meta"])
def health():
    """健康檢查端點；沒有資料庫依賴，供 liveness probe 使用。"""
    return {"status": "ok", "version": app.version, "env": settings.env}
