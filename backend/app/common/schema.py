"""跨模組共用的 Pydantic schema — 分頁容器、錯誤 envelope、ORM 轉 Pydantic 基底。"""

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """
    泛型分頁回應。

    `data` 是本頁資料列；`total` 是過濾後的總筆數（非總頁數）；`has_more`
    用於前端 infinite scroll 不必自己算尾頁。
    """

    data: list[T]
    page: int
    size: int
    total: int
    has_more: bool


class ErrorBody(BaseModel):
    """錯誤 envelope 的內容體，搭配 `ErrorEnvelope` 使用。"""

    code: str
    message: str
    trace_id: str | None = None
    details: dict | None = None


class ErrorEnvelope(BaseModel):
    """所有錯誤回應的 top-level 外層，只有 `error` 一個 key。"""

    error: ErrorBody


class OrmModel(BaseModel):
    """
    讓 Pydantic 可以從 SQLAlchemy ORM 物件直接驗證欄位的基底。

    所有回傳 ORM 映射結果的 schema（如 `StoreOut`）都繼承這個。
    """

    model_config = ConfigDict(from_attributes=True)
