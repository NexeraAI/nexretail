"""應用程式設定 — 從環境變數 / .env 讀取，透過 `get_settings()` 取單例。"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """集中管理所有環境變數；缺省值適用本機開發。"""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = Field(default="sqlite:///./dev.db", alias="DATABASE_URL")
    secret_key: str = Field(default="dev-secret-change-me", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3321", alias="CORS_ORIGINS"
    )
    env: str = Field(default="dev", alias="ENV")

    @property
    def cors_origins_list(self) -> list[str]:
        """把逗號分隔的 CORS_ORIGINS 字串切成 list 供 CORSMiddleware 使用。"""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """取 Settings 單例；`lru_cache` 確保整個 process 只讀一次 .env。"""
    return Settings()
