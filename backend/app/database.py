"""DB engine / Session / ORM Base — 整個後端唯一的資料庫進入點。"""

from collections.abc import Iterator
from datetime import datetime

from sqlalchemy import DateTime, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.config import get_settings

settings = get_settings()

# SQLite 在同一 connection 被多 thread 共用時需 `check_same_thread=False`；PostgreSQL 不需要。
_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy 2 宣告式 Base — Alembic 用它的 metadata 偵測 schema 變化。"""


class BaseModel(Base):
    """
    所有業務表共用的抽象基底，自動加上 `created_at` / `updated_at` 兩個 audit 欄位。

    子類別不必重複定義時間欄位；`updated_at` 會在每次 UPDATE 時由 SQLAlchemy
    透過 `onupdate=func.now()` 自動更新。
    """

    __abstract__ = True

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


def get_db() -> Iterator[Session]:
    """FastAPI 依賴注入用：每個 request 產生一個 Session，request 結束自動 close。"""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
