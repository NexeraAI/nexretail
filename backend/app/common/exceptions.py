"""跨模組共用的 HTTP 例外 — service 層直接 raise，由 main.py 的 handler 包成統一 envelope。"""

from fastapi import HTTPException


class NotFoundException(HTTPException):
    """404 — 對應錯誤 envelope 的 `code: not_found`。"""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            status_code=404,
            detail={"code": "not_found", "message": message},
        )
