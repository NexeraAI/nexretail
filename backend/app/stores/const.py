"""stores 常量 — 國家代碼到中文名的對照表。

刻意不做 countries lookup 表（MVP 階段），需要顯示中文國名時直接查這個 dict。
"""

COUNTRY_NAMES: dict[str, str] = {
    "TW": "台灣",
    "JP": "日本",
    "HK": "香港",
    "SG": "新加坡",
    "TH": "泰國",
}
