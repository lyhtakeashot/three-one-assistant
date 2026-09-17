# -*- coding: utf-8 -*-
"""按 2026-09-17 章程核对结果修正折算数据。
   修正依据：各校 2025/2026 三位一体招生章程原文（核见 .ref/verify_out_*.json）。
"""
import json
import os

B = r"D:\Desktop\VibeCoding\三位一体辅助系统"
REF = os.path.join(B, ".三位一体数据采集表.ref")

FIX = {
    "zufe": {
        "xiaokao": {"fullScore": 300},
        "note": "综合成绩（满分750）=学考（折算750）×20%+综合素质测试（折算750）×20%+高考×60%；"
                "学考原始 A=15/B=9/C=3/D 及以下不计分，满分150；综合测试（面试）满分 300 分。",
    },
    "zjgsu": {
        "xiaokao": {"fullScore": 150},
        "note": "综合成绩按学考20%+校测20%+高考60%计算；学考满分100（A=10/B=8/C=4/D=0），"
                "综合素质测试（面试）满分 150 分。",
    },
    "zstu": {
        "xiaokao": {"fullScore": 150},
        "weights": {"xuekao": 0.2, "xiaokao": 0.2, "gaokao": 0.6},
        "note": "综合成绩=学考等第成绩（折算满分750）×20%+综合素质测试（折算满分750）×20%+高考×60%；"
                "学考 A=10/B=8/C=4/D=0，满分100；综合素质测试满分 150 分。",
    },
    "westlake": {
        "xuekao": {"A": 10, "B": 9, "C": 8, "D": 6, "fullScore": 100},
        "note": "综合总分=(高考总分÷750×100)×60%+学校综合测试成绩(满分100)×30%+学考成绩(满分100)×10%；"
                "学考各科按 A=10/B=9/C=8/D=6 折算，满分100。",
    },
    "ucas": {
        "xuekao": {"fullScore": 750},
        "note": "综合评价成绩=高考成绩(含加分)×60%+综合素质测试(折算满分750)×30%+学考成绩(折算满分750)×10%。"
                "学考非等级赋分：Z 满分与浙江高考满分一致（750），各科全 A 则满分，每增 1 个 B 扣 2%、每增 1 个 C 扣 3%，"
                "出现 D/E 原则上不予考虑。",
    },
}


def apply(path, label):
    with open(path, "r", encoding="utf-8") as fh:
        doc = json.load(fh)
    done = []
    for s in doc["schools"]:
        f = FIX.get(s["id"])
        if not f:
            continue
        fm = s.setdefault("formula", {})
        if "xuekao" in f:
            fm["xuekao"] = f["xuekao"]
        if "xiaokao" in f:
            fm["xiaokao"] = f["xiaokao"]
        if "weights" in f:
            fm["weights"] = f["weights"]
        s["formulaNote"] = f["note"]
        s["formulaCorrectedAt"] = "2026-09-17"
        done.append(s["id"])
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=2)
    print(label, "已修正:", done)


apply(os.path.join(REF, "schools_38.json"), "schools_38.json")
apply(os.path.join(B, "live-app", "open-data", "schools.json"), "open-data/schools.json")

# ---- 全量排查「学考等级全 0」占位 ----
print("\n=== 学考 A/B/C/D 是否全 0 占位（应为空对象或 null，而不是 0）===")
for fn, lab in ((os.path.join(REF, "schools_38.json"), "2026"),
                (os.path.join(REF, "schools_44.json"), "2025")):
    d = json.load(open(fn, encoding="utf-8"))["schools"]
    for s in d:
        xk = (s.get("formula") or {}).get("xuekao") or {}
        if all(xk.get(k) == 0 for k in ("A", "B", "C", "D")) and "A" in xk:
            print("  ⚠", lab, s["name"], json.dumps(xk, ensure_ascii=False))
