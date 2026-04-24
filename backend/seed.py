"""Seed the dev database with demo data for the 7-table MVP.

產生 8 店 × 30 天的合成資料，包含：
- 每店 5 個 area / 3 個 entrance / 5 個 product
- 每天 40–80 個 visitor_sessions，每 session 3–5 個 behavior_events
- 近 7 天的 visitor_positions（1 session × 10 點，避免 SQLite 太肥）

Run:  .venv/bin/python seed.py
"""

from __future__ import annotations

import hashlib
import random
from datetime import UTC, datetime, timedelta

from app.areas.const import (
    AREA_TYPE_DISPLAY,
    AREA_TYPE_EXPERIENCE,
    AREA_TYPE_SERVICE,
)
from app.areas.model import Area
from app.behavior_events.const import BEHAVIOR_CODES
from app.behavior_events.model import BehaviorEvent
from app.database import Base, SessionLocal, engine
from app.entrances.const import ENTRANCE_TYPE_MAIN, ENTRANCE_TYPE_SUB
from app.entrances.model import Entrance
from app.products.const import (
    PRODUCT_CATEGORY_ACCESSORY,
    PRODUCT_CATEGORY_EV,
    PRODUCT_CATEGORY_SPORT,
    PRODUCT_CATEGORY_SUV,
)
from app.products.model import Product
from app.stores.model import Store
from app.visitor_positions.model import VisitorPosition
from app.visitor_sessions.const import (
    AGE_GROUPS,
    GENDER_FEMALE,
    GENDER_MALE,
    STATUS_ACTIVE,
    STATUS_LEFT,
)
from app.visitor_sessions.model import VisitorSession

# 固定 seed 讓每次跑結果一致，方便 debug 或 PPT 示範對齊。
rng = random.Random(20260422)

# 店鋪定義：(country, 店名, 店長, 統編, 電話, tz)
STORES = [
    ("TW", "台北信義旗艦店", "陳柏均", "24531278", "(02) 2755-6677", "Asia/Taipei"),
    ("TW", "台中中港店", "林怡君", "25118820", "(04) 2368-1122", "Asia/Taipei"),
    ("TW", "高雄漢神店", "黃俊皓", "26902211", "(07) 310-8899", "Asia/Taipei"),
    ("TW", "台北內湖店", "王佩芳", "27321144", "(02) 8751-9922", "Asia/Taipei"),
    ("JP", "東京銀座展間", "Takeshi Ono", "JP-013-557812", "+81 3-6262-5500", "Asia/Tokyo"),
    ("HK", "香港中環旗艦", "Kelvin Lau", "HK-8812-22", "+852 2877-3321", "Asia/Hong_Kong"),
    ("SG", "新加坡 Orchard", "Daniel Tan", "SG-2021-55", "+65 6735-2211", "Asia/Singapore"),
    ("TH", "曼谷 Sukhumvit", "Kanya Somchai", "TH-9981-42", "+66 2-650-8800", "Asia/Bangkok"),
]

# 每店 5 區：code / 名稱 / type / polygon / 顏色（色碼與前端 area tone 對應）
AREA_DEFS = [
    ("A", "A 展車區", AREA_TYPE_DISPLAY, {"rect": [60, 60, 300, 180]}, "#2f68ff"),
    ("B", "B 配件區", AREA_TYPE_DISPLAY, {"rect": [380, 60, 180, 120]}, "#ee5da1"),
    ("C", "C 商談區", AREA_TYPE_SERVICE, {"rect": [580, 60, 120, 180]}, "#7a5af8"),
    ("D", "D 試乘準備", AREA_TYPE_EXPERIENCE, {"rect": [380, 200, 180, 120]}, "#f79009"),
    ("E", "E 接待區", AREA_TYPE_SERVICE, {"rect": [60, 260, 300, 120]}, "#15b79e"),
]

# 每店 3 個入口：code / 名稱 / type / x / y（SVG 座標）
ENTRANCE_DEFS = [
    ("E01", "正門入口", ENTRANCE_TYPE_MAIN, 40.0, 380.0),
    ("E02", "停車場直達", ENTRANCE_TYPE_SUB, 680.0, 380.0),
    ("E03", "後門商談", ENTRANCE_TYPE_SUB, 360.0, 20.0),
]

# 每店 5 件商品：SKU / 名稱 / 型號 / 分類 / placement 座標
PRODUCT_DEFS = [
    ("BMW-M3", "BMW M3 Competition", "G80", PRODUCT_CATEGORY_SPORT, 130.0, 130.0),
    ("BMW-I7", "BMW i7 xDrive60", "G70", PRODUCT_CATEGORY_EV, 230.0, 160.0),
    ("BMW-X5", "BMW X5 xDrive40i", "G05", PRODUCT_CATEGORY_SUV, 310.0, 120.0),
    ("BMW-ACC", "BMW M4 Accessories", "Acc", PRODUCT_CATEGORY_ACCESSORY, 440.0, 110.0),
    ("BMW-CS", "BMW M4 CS", "G82", PRODUCT_CATEGORY_SPORT, 620.0, 140.0),
]

# visitor_positions 只為最近 N 天產生，避免 SQLite 太肥（30 天 × 8 店 × 60/day × 10 pt ≈ 144k 筆）
POSITION_DAYS = 7
POINTS_PER_SESSION = 10


def reset():
    """清空 metadata 中所有表後重建 — dev 階段方便直接歸零重灌。"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _area_center(poly: dict) -> tuple[float, float]:
    """取 rect 的中心點供 visitor_positions jitter 採樣時當錨點。"""
    rect = poly.get("rect", [0, 0, 0, 0])
    return rect[0] + rect[2] / 2, rect[1] + rect[3] / 2


def seed():
    """產生全部 demo 資料。每次執行都會先 drop 所有表再重建。"""
    reset()
    db = SessionLocal()

    # --- 建店 ---
    stores: list[Store] = []
    for country, name, manager, tax, phone, tz in STORES:
        s = Store(
            country_code=country,
            name=name,
            manager_name=manager,
            tax_id=tax,
            phone=phone,
            timezone=tz,
        )
        db.add(s)
        stores.append(s)
    db.flush()

    for store in stores:
        # --- 每店 5 區 ---
        areas: list[Area] = []
        for i, (code, aname, typ, poly, color) in enumerate(AREA_DEFS):
            a = Area(
                store_id=store.id,
                code=code,
                name=aname,
                type=typ,
                polygon=poly,
                color=color,
                display_order=i,
            )
            db.add(a)
            areas.append(a)

        # --- 每店 3 個入口 ---
        entrances: list[Entrance] = []
        for code, ename, typ, x, y in ENTRANCE_DEFS:
            e = Entrance(
                store_id=store.id,
                code=code,
                name=ename,
                type=typ,
                position_x=x,
                position_y=y,
            )
            db.add(e)
            entrances.append(e)
        db.flush()

        # --- 每店 5 件商品（都擺在 A 展車區方便示範） ---
        products: list[Product] = []
        for sku, pname, model, cat, x, y in PRODUCT_DEFS:
            p = Product(
                store_id=store.id,
                sku=sku,
                name=pname,
                model=model,
                category=cat,
                area_id=areas[0].id,
                placement_x=x,
                placement_y=y,
                qr_code_id=f"{sku}-{store.id}",
            )
            db.add(p)
            products.append(p)
        db.flush()

        # --- 30 天 × 40-80 個 session ---
        now = datetime.now(UTC)
        session_cache: list[tuple[VisitorSession, int]] = []  # (session, days_ago)
        for days_ago in range(30):
            day_base = now - timedelta(days=days_ago)
            for k in range(rng.randint(40, 80)):
                hour = rng.randint(9, 20)
                minute = rng.randint(0, 59)
                entered = day_base.replace(hour=hour, minute=minute, second=0, microsecond=0)
                stay = rng.randint(120, 2400)
                vs = VisitorSession(
                    store_id=store.id,
                    anon_id=hashlib.sha256(
                        f"{store.id}-{days_ago}-{k}-{entered}".encode()
                    ).hexdigest()[:32],
                    entered_at=entered,
                    exited_at=entered + timedelta(seconds=stay),
                    stay_seconds=stay,
                    gender=rng.choice([GENDER_MALE, GENDER_FEMALE]),
                    age_group=rng.choice(AGE_GROUPS),
                    companion_count=rng.randint(0, 3),
                    entrance_id=rng.choice(entrances).id,
                    # 只有「今天」的 session 才可能還是 active，其他一律 left。
                    status=STATUS_LEFT
                    if days_ago > 0
                    else rng.choice([STATUS_ACTIVE, STATUS_LEFT]),
                    interested_flag=rng.random() > 0.7,
                )
                db.add(vs)
                session_cache.append((vs, days_ago))
        db.flush()

        # --- 每 session 3~5 個 behavior_events ---
        for vs, _ in session_cache:
            picks = rng.sample(BEHAVIOR_CODES, k=rng.randint(3, len(BEHAVIOR_CODES)))
            t = vs.entered_at
            for code in picks:
                dur = rng.randint(8, 300)
                a = rng.choice(areas)
                p = rng.choice(products) if rng.random() > 0.3 else None
                db.add(
                    BehaviorEvent(
                        session_id=vs.id,
                        behavior_type=code,
                        area_id=a.id,
                        product_id=p.id if p else None,
                        started_at=t,
                        ended_at=t + timedelta(seconds=dur),
                        duration_seconds=dur,
                        confidence=round(rng.uniform(0.7, 0.98), 2),
                    )
                )
                t += timedelta(seconds=dur + rng.randint(5, 60))

        # --- 近 7 天才生軌跡點（heatmap / 重播用） ---
        for vs, days_ago in session_cache:
            if days_ago >= POSITION_DAYS:
                continue
            for i in range(POINTS_PER_SESSION):
                frac = i / (POINTS_PER_SESSION - 1)
                t = vs.entered_at + timedelta(seconds=int(vs.stay_seconds * frac))
                area = rng.choice(areas)
                cx, cy = _area_center(area.polygon)
                db.add(
                    VisitorPosition(
                        session_id=vs.id,
                        store_id=store.id,
                        t=t,
                        x=cx + rng.uniform(-30, 30),
                        y=cy + rng.uniform(-30, 30),
                        area_id=area.id,
                    )
                )

    db.commit()
    db.close()
    print("Seed complete.")
    print(f"  Stores: {len(STORES)}")
    print(f"  Sessions: ~30 days × 40–80 per store")
    print(f"  Positions: last {POSITION_DAYS} days × {POINTS_PER_SESSION} pts/session")


if __name__ == "__main__":
    seed()
