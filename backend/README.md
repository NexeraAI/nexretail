# backend

FastAPI + SQLAlchemy 2 + Alembic + Pydantic v2 — 7-table MVP，完全按 scope 裁過的版本。

---

## 快速開始

```bash
cd backend

# 1. 建 venv + 裝依賴
python3.12 -m venv .venv
.venv/bin/pip install -e .

# 2. 建表
.venv/bin/alembic upgrade head

# 3. 塞 demo 資料
.venv/bin/python seed.py

# 4. 啟動 server (port 8321)
.venv/bin/uvicorn app.main:app --reload --port 8321
```

**Swagger UI**：<http://localhost:8321/docs>

目前 **裸跑、沒有 auth**，所有 endpoint 直接打即可。

---

## 目錄結構（flat，一張表一個 folder）

```
backend/
├── app/
│   ├── main.py                 # FastAPI app + CORS + unified error envelope
│   ├── config.py               # pydantic-settings
│   ├── database.py             # SQLAlchemy engine + session + Base
│   ├── deps.py                 # DbSession + Pagination
│   ├── common/schema.py        # Page<T>, ErrorEnvelope, OrmModel
│   ├── stores/                 # 1. 商場
│   │   ├── model.py
│   │   ├── schema.py
│   │   └── controller.py       # /stores, /stores/:id, /stores/:id/layout
│   ├── areas/                  # 2. 區域
│   │   ├── model.py
│   │   ├── schema.py
│   │   └── controller.py       # /areas
│   ├── entrances/              # 3. 出入口
│   │   ├── model.py
│   │   ├── schema.py
│   │   └── controller.py       # /entrances
│   ├── products/               # 4. 產品
│   │   ├── model.py
│   │   ├── schema.py
│   │   └── controller.py       # /products, /products/:id
│   ├── visitor_sessions/       # 5. 顧客（一次到店一筆）
│   │   ├── model.py
│   │   ├── schema.py
│   │   └── controller.py       # /visitors*
│   ├── visitor_positions/      # 6. 顧客位置（軌跡點）
│   │   ├── model.py
│   │   └── schema.py           # 無 router，由 /visitors/:id/path 消費
│   └── behavior_events/        # 7. 顧客行為
│       ├── model.py
│       └── schema.py           # 無 router，由 /visitors/:id/behaviors 消費
├── alembic/                    # migrations
├── seed.py                     # 8 店 × 30 天 × 40–80 sessions/day
├── pyproject.toml
└── dev.db                      # SQLite (gitignored)
```

---

## API（全部 `/api/v1/*`）

| 路徑 | 用途 |
|---|---|
| `GET /stores` | 店鋪列表 + 30 天人流 |
| `GET /stores/{id}` | 單店 |
| `GET /stores/{id}/layout` | store + areas + entrances + products |
| `GET /areas?storeId=` | 區域列表 + today_count + month_avg |
| `GET /entrances?storeId=` | 出入口列表 + today_count |
| `GET /products?storeId=` | 商品列表 + avg_view + touch_count |
| `GET /products/{id}` | 單品 |
| `GET /visitors?storeId=&status=&date=&page=&size=` | 顧客分頁 |
| `GET /visitors/{id}` | 顧客細節（含 entrance） |
| `GET /visitors/{id}/behaviors` | 行為時序 |
| `GET /visitors/{id}/area-dwell` | 各區停留秒數 |
| `GET /visitors/{id}/path` | 軌跡點（由 `visitor_positions` 實際取） |
| `GET /health` | meta |

---

## 開發指令

```bash
# 新增 migration（修改 model 後）
.venv/bin/alembic revision --autogenerate -m "add xxx"
.venv/bin/alembic upgrade head

# 重置 DB
rm dev.db && .venv/bin/alembic upgrade head && .venv/bin/python seed.py
```

---

## 設計筆記

- `behavior_events.behavior_type` 是 **字串** (`enter`/`dwell`/`touch`/`talk`/`test_ride`)，沒有 lookup table
- `products.category` 同上，字串
- `stores.manager_name` 字串，沒有 `staff` 表
- `stores.country_code` 純字串，沒有 `countries` 表
- `visitor_positions.id` 是 BigInteger（on PostgreSQL）/ Integer（on SQLite）
- FK 全用字串寫法 `ForeignKey("stores.id")` 避免跨 folder 循環 import
- 沒有定義 SQLAlchemy `relationship()`，所有跨表查詢都顯式 `select().join()`
