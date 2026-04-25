"""visitor_sessions 常量 — session 狀態、性別、年齡區間、查詢 scope。"""

# session 即時狀態
STATUS_ACTIVE = "active"    # 目前還在店內
STATUS_LEFT = "left"        # 已離店

VISITOR_STATUSES = [STATUS_ACTIVE, STATUS_LEFT]

# 性別只記錄 M / F；辨識不出來的 session 不入庫
GENDER_MALE = "M"
GENDER_FEMALE = "F"

GENDERS = [GENDER_MALE, GENDER_FEMALE]

# 年齡分組（與前端 demographics 圖表一致）
AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"]

# GET /visitors?date=... 的時間範圍
DATE_SCOPE_TODAY = "today"    # 只看今天
DATE_SCOPE_MONTH = "month"    # 近 30 天
