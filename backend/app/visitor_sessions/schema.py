"""visitor_sessions API 回應 schema — summary / detail / 軌跡 / 區停留。"""

from datetime import datetime

from pydantic import BaseModel

from app.common.schema import OrmModel


class EntranceRef(BaseModel):
    """VisitorDetail 內的精簡 entrance 引用，避免回傳整個 Entrance 物件。"""

    id: int
    code: str
    name: str


class VisitorSummary(OrmModel):
    """顧客列表每筆的精簡欄位（列表頁用）。"""

    id: int
    anon_id: str
    gender: str
    age_group: str
    entered_at: datetime
    exited_at: datetime | None
    stay_seconds: int
    companion_count: int
    status: str
    interested_flag: bool
    thumbnail_url: str | None


class VisitorDetail(VisitorSummary):
    """顧客詳情頁 — 在 Summary 基礎上加上 entrance 關聯與全身照。"""

    entrance: EntranceRef | None = None
    full_body_url: str | None = None


class AreaDwellOut(BaseModel):
    """單位：秒；某位顧客在某區總共停留多久。"""

    area_id: int
    area_name: str
    dwell_seconds: int


class PathPoint(BaseModel):
    """軌跡中的一個點（時間 + SVG 座標）。"""

    t: datetime
    x: float
    y: float


class VisitorPath(BaseModel):
    """顧客整條行走軌跡，用於前端 main 頁重播。"""

    session_id: int
    points: list[PathPoint]
