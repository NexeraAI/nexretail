"""edge ingest 端的輸入 schema — 給地端設備上傳資料用。

讀取側（前端 GET）的 schema 留在 `visitor_sessions` / `behavior_events` 自己的
folder；這裡只放寫入側 payload，避免兩邊互相影響。
"""

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.behavior_events.const import BEHAVIOR_CODES
from app.visitor_sessions.const import AGE_GROUPS, GENDERS


class VisitIn(BaseModel):
    """建立 visitor_session — 顧客進店時地端呼叫一次。

    `entered_at` 由地端帶上來而非 server 取現在時間，因為地端可能離線
    暫存後才回灌，server now() 會失真。
    """

    store_id: int
    anon_id: str
    entered_at: datetime
    gender: str
    age_group: str
    companion_count: int = 0
    entrance_id: int | None = None
    thumbnail_url: str | None = None
    full_body_url: str | None = None

    @field_validator("gender")
    @classmethod
    def _check_gender(cls, v: str) -> str:
        if v not in GENDERS:
            raise ValueError(f"gender must be one of {GENDERS}")
        return v

    @field_validator("age_group")
    @classmethod
    def _check_age_group(cls, v: str) -> str:
        if v not in AGE_GROUPS:
            raise ValueError(f"age_group must be one of {AGE_GROUPS}")
        return v


class VisitOut(BaseModel):
    """建立 / 結束 session 後回給地端的最小資訊（拿 id 給後續呼叫帶在 URL）。"""

    id: int


class VisitExitIn(BaseModel):
    """離店時補 `exited_at`；server 會自動回算 `stay_seconds` 並把 status 設 left。"""

    exited_at: datetime


class PositionIn(BaseModel):
    """單一軌跡點 — 地端以 1~2 Hz 取樣，多點以 array 一次上傳。

    `store_id` 不在 payload — server 從 session 反查（地端送錯沒意義）。
    """

    t: datetime
    x: float
    y: float
    area_id: int | None = None


class BehaviorIn(BaseModel):
    """單一行為事件 — 觸摸 / 商談 / 試乘等。

    `duration_seconds` 沒帶但有 `ended_at` 時，server 會以差值回算。
    """

    behavior_type: str
    area_id: int | None = None
    product_id: int | None = None
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)

    @field_validator("behavior_type")
    @classmethod
    def _check_type(cls, v: str) -> str:
        if v not in BEHAVIOR_CODES:
            raise ValueError(f"behavior_type must be one of {BEHAVIOR_CODES}")
        return v


class IngestResult(BaseModel):
    """批次寫入後的回應 — 只回傳成功筆數，地端用以對帳。"""

    inserted: int
