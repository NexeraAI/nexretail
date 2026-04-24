"""FastAPI 共用依賴注入 — DB session 型別別名與分頁參數。"""

from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db

# 在 controller 直接宣告 `db: DbSession` 取得 Session，不必重複寫 Depends(get_db)。
DbSession = Annotated[Session, Depends(get_db)]


class Pagination:
    """
    通用分頁參數：?page=1&size=20。

    搭配 `Page` type alias 一併注入，controller 內使用 `pg.offset` 給 SQL 的 OFFSET。
    """

    def __init__(
        self,
        page: Annotated[int, Query(ge=1)] = 1,
        size: Annotated[int, Query(ge=1, le=200)] = 20,
    ) -> None:
        self.page = page
        self.size = size

    @property
    def offset(self) -> int:
        """依 page / size 換算 SQL OFFSET。"""
        return (self.page - 1) * self.size


Page = Annotated[Pagination, Depends()]
