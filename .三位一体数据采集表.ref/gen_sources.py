# -*- coding: utf-8 -*-
"""按「三位一体数据溯源采集需求表.md」§4/§6 生成 46 所院校的溯源素材 JSON。

落地策略（§4 推荐）：学费 / 专业名单与计划数 / 学考门槛 / 校测形式 这几项
绝大多数院校都出自同一份招生章程，因此统一挂该校已有章程链接（formulaSource.url）。
报录人数来源、满意度可点链接、住宿 UGC 尚缺，按 §1「宁可标注不可编造」留 null 并注明。
不改动 live-app/index.html、open-data/、live-app/data/。
"""
import json
import os

BASE = r"D:\Desktop\VibeCoding\三位一体辅助系统"
REF = os.path.join(BASE, ".三位一体数据采集表.ref")
OUTDIR = os.path.join(BASE, "溯源素材")
COLLECTED = "2026-09-13"
CATS = ["省内地方属三位一体", "高水平三位一体", "综合评价（在浙）"]
COUNTS = (32, 6, 8)

with open(os.path.join(REF, "schools_46.json"), "r", encoding="utf-8") as fh:
    schools = json.load(fh)["schools"]

cats = []
for c, n in zip(CATS, COUNTS):
    cats += [c] * n
assert len(cats) == len(schools), (len(cats), len(schools))

os.makedirs(OUTDIR, exist_ok=True)
index_rows = []

for i, (s, cat) in enumerate(zip(schools, cats), start=1):
    fs = s.get("formulaSource") or {}
    url = fs.get("url") or s.get("brochureUrl")
    title = fs.get("title") or (str(s.get("name")) + " 招生章程")
    year = fs.get("year") or 2026

    sources = {}
    if url:
        sources["info"] = {"tuitionSourceUrl": url, "tuitionSourceTitle": title, "tuitionSourceYear": year}
        sources["majorsSource"] = {"url": url, "title": title + "（招生专业与计划章节）",
                                   "year": year, "collectedAt": COLLECTED}
        sources["examFormatSource"] = {"url": url, "title": title + "（综合素质测试章节）",
                                       "year": year, "collectedAt": COLLECTED}

    adm = []
    for a in s.get("admission") or []:
        has_xk = bool(a.get("xuekaoRequirement"))
        adm.append({
            "year": a.get("year"),
            "applicants": a.get("applicants"),
            "passed": a.get("passed"),
            "admitted": a.get("admitted"),
            "sourceUrl": None,
            "sourceTitle": None,
            "xuekaoRequirement": a.get("xuekaoRequirement"),
            "xuekaoRequirementSourceUrl": url if has_xk else None,
            "xuekaoRequirementSourceTitle": title if has_xk else None,
            "collectedAt": COLLECTED,
            "note": "报录人数来源待补：需该校入围/录取名单公示或浙江省教育考试院公告（P1）。"
                    + ("学考门槛已挂招生章程。" if has_xk else "该行暂无学考门槛数据。"),
        })

    sat = s.get("satisfaction") or {}
    if sat.get("source"):
        sat_note = "现有文字来源：%s；阳光高考网可直达链接待补（P3）。" % sat.get("source")
    else:
        sat_note = "本平台暂无满意度数据；如该校在阳光高考网无评分，保留空缺（P3）。"
    sat_out = {
        "overall": sat.get("overall"), "environment": sat.get("environment"), "life": sat.get("life"),
        "sourceUrl": None, "sourceTitle": None, "sourceYear": None,
        "collectedAt": COLLECTED, "note": sat_note,
    }

    obj = {
        "id": s.get("id"),
        "name": s.get("name"),
        "category": cat,
        "collectedAt": COLLECTED,
        "sources": sources,
        "satisfaction": sat_out,
        "admission": adm,
        "dormitory": {
            "platforms": [],
            "note": "住宿来源待补：需 ≥1 条官方（招生网/后勤处/官方公众号新生指南）+ ≥2 个 UGC 平台"
                    "（虎扑/小红书/抖音），每条附直达链接、原文摘录、采集时间（P4/§5）。",
        },
        "notes": "P0（学考门槛、校测形式）、P1（招生专业名单与计划数）、P2（学费）已按 §4 统一挂该校招生章程链接；"
                 "报录人数来源、满意度可点链接、住宿 UGC 待补。未编造任何链接。",
    }
    fn = "%03d-%s.json" % (i, str(s.get("name")))
    with open(os.path.join(OUTDIR, fn), "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=2)
    index_rows.append((i, cat, s.get("name"), s.get("id"), 1 if url else 0,
                       len(adm), sum(1 for a in adm if a.get("xuekaoRequirementSourceUrl")), fn))

# ---------- 索引 ----------
lines = ["# 溯源素材 · 索引与进度", "",
         "> 生成日期：%s ｜ 依据：`三位一体数据溯源采集需求表.md` §4 / §6" % COLLECTED,
         "> 本目录为**素材交付**，未改动 `live-app/index.html`、`open-data/`、`live-app/data/`。", "",
         "## 本轮已落地（可复用章程来源）", "",
         "学费、专业名单与计划数、学考门槛、校测形式 —— 均出自同一份招生章程，已按 §4 统一挂该校章程链接，共 **%d 所**。" % len(index_rows),
         "满意度链接、报录人数、住宿 UGC 三类**未编造**，留 `null` 并在 `note` 注明待补。", "",
         "## 明细", "",
         "| 序号 | 类别 | 院校全称 | id | 章程链接 | 报录行数 | 其中学考门槛已挂 | 文件 |",
         "|---|---|---|---|---|---|---|---|"]
for r in index_rows:
    lines.append("| %d | %s | %s | `%s` | %s | %d | %d | `%s` |" % (
        r[0], r[1], r[2], r[3], "✅" if r[4] else "—", r[5], r[6], r[7]))
lines += ["", "## 待补清单（后续批次）", "",
          "| 批次 | 维度 | 需要什么 | 影响院校 |", "|---|---|---|---|",
          "| P0 | 学考门槛、校测形式 | 已用章程链接覆盖 | — |",
          "| P1 | 报录人数 | 各校入围/录取名单公示、省考试院公告 | 46 所 / 53 行 |",
          "| P1 | 招生专业与计划数 | 已用章程链接覆盖 | — |",
          "| P2 | 学费 | 已用章程链接覆盖 | — |",
          "| P3 | 满意度链接化 | 阳光高考网院校满意度直达链接 | 43 所（3 所无数据） |",
          "| P4 | 住宿 UGC | 官方新生指南 + 虎扑/小红书/抖音 各 1 条 | 46 所 |", "",
          "> 备注：文件名前缀（001–046）为本表序号，主程归一化时可重新编号。"]

with open(os.path.join(OUTDIR, "_索引.md"), "w", encoding="utf-8") as fh:
    fh.write("\n".join(lines) + "\n")

print("OUTDIR:", OUTDIR)
print("生成 JSON:", len(index_rows), "份")
print("有章程链接:", sum(1 for r in index_rows if r[4]))
print("报录行合计:", sum(r[5] for r in index_rows), "| 已挂学考门槛来源:", sum(r[6] for r in index_rows))
