# -*- coding: utf-8 -*-
"""把 dorm_1~6.json 的满意度/住宿素材合并进 溯源素材/ 的 46 份 JSON，
   并生成便于人工逐条辨伪的《满意度与住宿核验表.xlsx》。
"""
import json
import os

try:
    import openpyxl  # noqa
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", "openpyxl>=3.1.0"])

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

BASE = r"D:\Desktop\VibeCoding\三位一体辅助系统"
REF = os.path.join(BASE, ".三位一体数据采集表.ref")
OUTDIR = os.path.join(BASE, "溯源素材")
XLSX = os.path.join(OUTDIR, "_满意度与住宿核验表.xlsx")
COLLECTED = "2026-09-13"
CATS = ["省内地方属三位一体", "高水平三位一体"]
COUNTS = (32, 6)

# ---------- 读数据 ----------
with open(os.path.join(REF, "schools_38.json"), "r", encoding="utf-8") as fh:
    schools = json.load(fh)["schools"]
cats = []
for c, n in zip(CATS, COUNTS):
    cats += [c] * n
CAT_OF = {s["id"]: c for s, c in zip(schools, cats)}
NAME_OF = {s["id"]: s.get("name") for s in schools}
ORDER = [s["id"] for s in schools]

DORM = {}
for i in range(1, 7):
    with open(os.path.join(REF, "dorm_%d.json" % i), "r", encoding="utf-8") as fh:
        for x in json.load(fh):
            DORM[x["id"]] = x

# 追加「官方来源」补采结果（dorm_fix1 / dorm_fix2），按 url 去重
for fn in ("dorm_fix1.json", "dorm_fix2.json"):
    fp = os.path.join(REF, fn)
    if not os.path.exists(fp):
        continue
    with open(fp, "r", encoding="utf-8") as fh:
        for x in json.load(fh):
            tgt = DORM.get(x.get("id"))
            if not tgt or not x.get("platforms"):
                continue
            dor = tgt.setdefault("dormitory", {})
            plats = dor.setdefault("platforms", [])
            have = {pp.get("url") for pp in plats}
            for pp in x["platforms"]:
                if pp.get("url") and pp["url"] not in have:
                    plats.append(pp)
                    have.add(pp["url"])
            if x.get("note"):
                dor["note"] = ((dor.get("note") or "") + " ｜ " + x["note"]).strip(" ｜")

# ---------- P1 报录人数来源（2025 / 2026 两年都统计） ----------
P1ROWS = {}   # (sid, year) -> row
P1NOTE = {}
for fn in ("p1_1.json", "p1_2.json", "p1_3.json", "p1_4.json", "p1_5.json",
           "p1b_1.json", "p1b_2.json"):
    fp = os.path.join(REF, fn)
    if not os.path.exists(fp):
        continue
    with open(fp, "r", encoding="utf-8") as fh:
        for x in json.load(fh):
            if x.get("note"):
                P1NOTE.setdefault(x["id"], []).append(x["note"])
            for r in x.get("admission") or []:
                key = (x["id"], r.get("year"))
                prev = P1ROWS.get(key)
                if prev is None or (not prev.get("sourceUrl") and r.get("sourceUrl")):
                    P1ROWS[key] = r

# ---------- 合并进素材 JSON ----------
merged = 0
p1_rows_all = []
by_school = {}
for sid in ORDER:
    path = os.path.join(OUTDIR, "%03d-%s.json" % (ORDER.index(sid) + 1, NAME_OF[sid]))
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as fh:
        obj = json.load(fh)
    src = DORM.get(sid)
    if src and src.get("satisfaction"):
        sat = dict(src["satisfaction"])
        sat.setdefault("collectedAt", COLLECTED)
        obj["satisfaction"] = sat
    if src and src.get("dormitory"):
        dor = dict(src["dormitory"])
        for p in dor.get("platforms") or []:
            p.setdefault("collectedAt", COLLECTED)
        obj["dormitory"] = dor

    ours = obj.get("admission") or []
    have_years = {a.get("year") for a in ours}
    other_years = sorted({str(k[1]) for k in P1ROWS if k[0] == sid and P1ROWS[k].get("sourceUrl")})
    merged_rows = []
    # ① 主表已有的行 → 挂对应年份来源
    for a in ours:
        y = a.get("year")
        r = P1ROWS.get((sid, y))
        row = dict(a)
        if r and r.get("sourceUrl"):
            row["sourceUrl"] = r["sourceUrl"]
            row["sourceTitle"] = r.get("sourceTitle")
            row["note"] = r.get("note") or "报录人数来源已挂官方公示链接。"
        else:
            tail = ("（同类来源见 %s 年）" % "、".join(other_years)) if other_years else ""
            row["sourceUrl"] = None
            row["sourceTitle"] = None
            row["note"] = "本行年份未找到官方公示链接%s。" % tail
            if r and r.get("note"):
                row["note"] += " " + r["note"]
        row["collectedAt"] = COLLECTED
        merged_rows.append(row)
    # ② 补采到、而主表缺该年份的记录（如温州商学院 2025）
    for (s2, y), r in P1ROWS.items():
        if s2 != sid or y in have_years or not r.get("sourceUrl"):
            continue
        merged_rows.append({
            "year": y, "applicants": r.get("applicants"), "passed": r.get("passed"),
            "admitted": r.get("admitted"), "minScore": None, "avgScore": None,
            "xuekaoRequirement": None,
            "sourceUrl": r["sourceUrl"], "sourceTitle": r.get("sourceTitle"),
            "collectedAt": COLLECTED,
            "note": "由 P1 补采补充的年度（主表暂无该年记录）。" + (r.get("note") or ""),
        })
    merged_rows.sort(key=lambda x: -(x.get("year") or 0))
    obj["admission"] = merged_rows
    obj["notes"] = ("P0（学考门槛、校测形式）、P1（招生专业名单与计划数）、P2（学费）已按 §4 统一挂该校招生章程链接；"
                    "P3 满意度、P4 住宿（官方 + 虎扑/知乎/B站/贴吧）已补，含直达链接与原文摘录；"
                    "P1 报录人数来源按 2025 / 2026 两年统计并挂官方公示链接（未找到的按 §1 留 null 并注明）。未编造任何链接。")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=2)
    merged += 1
    by_school[sid] = merged_rows
    for row in merged_rows:
        p1_rows_all.append([CAT_OF.get(sid), NAME_OF.get(sid), sid, row.get("year"),
                            row.get("applicants"), row.get("passed"), row.get("admitted"),
                            row.get("sourceTitle"), row.get("sourceUrl"), row.get("note")])

# 按年份收集：年份倒序 → 类别 → 院校
p1_rows_all.sort(key=lambda r: (-(r[3] or 0), r[0], r[1]))
print("已合并素材 JSON:", merged)

# ---------- 核验表 ----------
def xl_color(css):
    v = css.removeprefix("#").upper()
    return "FF" + v


XL_PRIMARY = xl_color("#4472C4")
XL_TITLE_BG = xl_color("#2F5597")
XL_BORDER = xl_color("#BFBFBF")
XL_WHITE = xl_color("#FFFFFF")
XL_WARN = xl_color("#FFEB9C")
thin = Side(style="thin", color=XL_BORDER)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
FONT = "微软雅黑"
font_body = Font(name=FONT, size=10)
font_hdr = Font(name=FONT, size=10, bold=True, color=XL_WHITE)
font_title = Font(name=FONT, size=13, bold=True, color=XL_WHITE)
A_HDR = Alignment(horizontal="center", vertical="center", wrap_text=True)
A_LEFT = Alignment(horizontal="left", vertical="center")
A_WRAP = Alignment(horizontal="left", vertical="top", wrap_text=True)
A_CENTER = Alignment(horizontal="center", vertical="center")
FILL_HDR = PatternFill("solid", fgColor=XL_PRIMARY)
FILL_TITLE = PatternFill("solid", fgColor=XL_TITLE_BG)

wb = Workbook()
wb.remove(wb.active)


def sheet(name, title, headers, widths, rows, center=(), wrap=()):
    ws = wb.create_sheet(name)
    n = len(headers)
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=n)
    tc = ws.cell(row=1, column=1, value=title)
    tc.font = font_title
    tc.fill = FILL_TITLE
    tc.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[1].height = 28
    for j, h in enumerate(headers, start=1):
        c = ws.cell(row=2, column=j, value=h)
        c.font = font_hdr
        c.fill = FILL_HDR
        c.alignment = A_HDR
        c.border = BORDER
    ws.row_dimensions[2].height = 30
    for i, rv in enumerate(rows):
        r = 3 + i
        for j in range(1, n + 1):
            c = ws.cell(row=r, column=j, value=rv[j - 1])
            c.font = font_body
            c.alignment = A_CENTER if j in center else (A_WRAP if j in wrap else A_LEFT)
            c.border = BORDER
    for j, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(j)].width = w
    ws.auto_filter.ref = "A2:%s%d" % (get_column_letter(n), 2 + len(rows))
    ws.freeze_panes = "A3"
    return ws


# ---- 满意度 ----
sat_rows = []
idx = 0
for sid in ORDER:
    src = DORM.get(sid) or {}
    sat = src.get("satisfaction") or {}
    idx += 1
    sat_rows.append([idx, CAT_OF.get(sid), NAME_OF.get(sid), sid, "主来源",
                     sat.get("sourceTitle"), sat.get("sourceUrl"), sat.get("note"),
                     sat.get("overall"), sat.get("environment"), sat.get("life"),
                     sat.get("sourceYear"), sat.get("collectedAt")])
    for alt in sat.get("alternates") or []:
        sat_rows.append([idx, CAT_OF.get(sid), NAME_OF.get(sid), sid, "备选·" + str(alt.get("name")),
                         alt.get("summary"), alt.get("url"), alt.get("note"),
                         None, None, None, None, alt.get("collectedAt") or COLLECTED])

sheet("满意度核验", "满意度来源核验表 · 46 所（主来源 + 备选来源逐条留证，供人工核实）",
      ["序号", "类别", "院校全称", "id", "来源类型", "来源标题/摘要", "链接", "存疑/口径说明",
       "综合", "环境", "生活", "来源年份", "采集时间"],
      [6, 18, 18, 9, 12, 40, 46, 44, 8, 8, 8, 9, 12],
      sat_rows, center={1, 5, 9, 10, 11, 12, 13}, wrap={6, 7, 8})

# ---- 住宿 ----
UGC = ("虎扑", "知乎", "B站", "b站", "贴吧", "小红书", "抖音", "论坛", "校友圈", "知道")


def nature(name, url=""):
    """依据 平台名 + 域名 判定来源性质：.edu.cn 视为学校官方域名。"""
    n = str(name or "")
    u = str(url or "")
    if "官方" in n or ".edu.cn" in u:
        return "官方"
    if any(k in n for k in UGC):
        return "UGC"
    return "第三方"


def plat_objs(sid):
    return ((DORM.get(sid) or {}).get("dormitory") or {}).get("platforms") or []


def official_count(sid):
    return sum(1 for p in plat_objs(sid) if nature(p.get("name"), p.get("url")) == "官方")


dor_rows = []
idx = 0
for sid in ORDER:
    src = DORM.get(sid) or {}
    dor = src.get("dormitory") or {}
    idx += 1
    for p in dor.get("platforms") or []:
        dor_rows.append([idx, CAT_OF.get(sid), NAME_OF.get(sid), sid,
                         nature(p.get("name"), p.get("url")),
                         p.get("name"), p.get("url"), p.get("summary"),
                         p.get("rating"), p.get("collectedAt") or COLLECTED, p.get("note")])
    if not (dor.get("platforms") or []):
        dor_rows.append([idx, CAT_OF.get(sid), NAME_OF.get(sid), sid, "—", "(无)", None,
                         dor.get("note"), None, None, None])

sheet("住宿核验", "住宿条件来源核验表 · 一校多平台逐条留证（「性质」列区分 官方/第三方/UGC，供人工辨伪）",
      ["序号", "类别", "院校全称", "id", "性质", "平台", "直达链接", "原文要点摘录", "评分", "采集时间", "存疑说明"],
      [6, 18, 18, 9, 10, 14, 46, 62, 8, 12, 40],
      dor_rows, center={1, 5, 6, 9, 10}, wrap={7, 8, 11})

# ---- 平台覆盖 ----
# 2026-09-14：移除「小红书」「抖音」（侵权/隐私风险，见需求表 §5.1）
MAIN = ["官方", "虎扑", "知乎", "B站", "贴吧"]
cov_rows = []
for sid in ORDER:
    names = [p.get("name") or "" for p in plat_objs(sid)]
    row = [CAT_OF.get(sid), NAME_OF.get(sid), sid]
    for m in MAIN:
        if m == "官方":
            row.append(official_count(sid) or None)
        else:
            hit = sum(1 for p in names if m in p)
            row.append(hit or None)
    other = sum(1 for p in names if not any(m in p for m in MAIN))
    row += [other or None, len(names),
            "有" if ((DORM.get(sid) or {}).get("satisfaction") or {}).get("sourceUrl") else "缺"]
    cov_rows.append(row)

sheet("平台覆盖", "平台覆盖矩阵 · 便于快速看出哪些院校/平台还缺（空白=未查到，非编造；已移除小红书/抖音）",
      ["类别", "院校全称", "id"] + MAIN + ["其它平台", "来源合计", "满意度链接"],
      [18, 18, 9, 8, 8, 8, 8, 8, 10, 10, 12],
      cov_rows, center={4, 5, 6, 7, 8, 9, 10, 11})

# ---- 人工补录清单 ----
UGC_MAIN = ["虎扑", "知乎", "B站", "贴吧"]
manual_rows = []
for sid in ORDER:
    names = [p.get("name") or "" for p in plat_objs(sid)]
    row = [CAT_OF.get(sid), NAME_OF.get(sid), sid]
    todo = []
    off = official_count(sid)
    row.append("✅" if off else "")
    if not off:
        todo.append("官方(学校官网/招生网)")
    for m in UGC_MAIN:
        hit = sum(1 for p in names if m in p)
        row.append("✅" if hit else "")
        if not hit:
            todo.append(m)
    ugc_kinds = sum(1 for m in UGC_MAIN if any(m in p for p in names))
    ok = off >= 1 and ugc_kinds >= 2
    row += ["达标" if ok else "未达标", ugc_kinds, "、".join(todo) if todo else "—",
            "有" if ((DORM.get(sid) or {}).get("satisfaction") or {}).get("sourceUrl") else "缺"]
    manual_rows.append(row)

sheet("人工补录清单",
      "人工补录清单 · 「达标」= §5 要求（≥1 官方 + ≥2 个 UGC 平台；UGC 限虎扑/知乎/B站/贴吧）；未达标者请按末尾「建议补录项」人工补齐",
      ["类别", "院校全称", "id", "官方"] + UGC_MAIN + ["§5达标", "UGC平台数", "建议补录项", "满意度链接"],
      [18, 18, 9, 8, 8, 8, 8, 8, 10, 10, 26, 12],
      manual_rows, center={4, 5, 6, 7, 8, 9, 10, 12}, wrap={11})

# ---- 报录来源核验 ----
sheet("报录来源核验",
      "报录人数（报名/入围/录取）来源核验表 · 2025 与 2026 两个年度均已统计；每行一条年度记录，附官方公示链接（空白=未找到官方公示，未编造）",
      ["类别", "院校全称", "id", "年份", "报名人数", "入围人数", "录取人数",
       "来源标题", "来源链接", "存疑/口径说明"],
      [18, 18, 9, 8, 11, 11, 11, 40, 46, 44],
      p1_rows_all, center={4, 5, 6, 7}, wrap={8, 9, 10})

# ---- 年份汇总 ----
yr_rows = []
for y in sorted({r[3] for r in p1_rows_all if r[3]}, reverse=True):
    rs = [r for r in p1_rows_all if r[3] == y]
    yr_rows.append([y, len(rs), sum(1 for r in rs if r[8]), len({r[2] for r in rs}),
                    "、".join(sorted({r[1] for r in rs}))[:200]])
yr_rows.append(["合计", len(p1_rows_all), sum(1 for r in p1_rows_all if r[8]),
                len({r[2] for r in p1_rows_all}), ""])
sheet("年份汇总", "按年份汇总 · 报录记录数与来源覆盖（年份倒序）",
      ["年份", "记录数", "已挂来源数", "涉及院校数", "院校清单（节选）"],
      [10, 10, 12, 12, 90], yr_rows, center={1, 2, 3, 4}, wrap={5})

# ---- 最近（各校最新一条） ----
recent_rows = []
for i, sid in enumerate(ORDER, start=1):
    rows = by_school.get(sid) or []
    if not rows:
        continue
    latest = max(rows, key=lambda r: r.get("year") or 0)
    years = "、".join(str(y) for y in sorted({r.get("year") for r in rows if r.get("year")}, reverse=True))
    recent_rows.append([
        i, CAT_OF.get(sid), NAME_OF.get(sid), sid,
        latest.get("year"), latest.get("applicants"), latest.get("passed"), latest.get("admitted"),
        latest.get("sourceTitle"), latest.get("sourceUrl"), years,
        "已挂官方公示" if latest.get("sourceUrl") else "未找到官方公示",
        (latest.get("note") or "")[:200],
    ])
sheet("最近", "「最近」· 各校最新一年的报录数据（每校取最新年份一条，附官方公示链接；空白=该年未找到官方公示）",
      ["序号", "类别", "院校全称", "id", "最近年份", "报名人数", "入围人数", "录取人数",
       "来源标题", "来源链接", "已收录年份", "来源状态", "备注"],
      [6, 18, 18, 9, 10, 11, 11, 11, 40, 46, 16, 14, 50],
      recent_rows, center={1, 5, 6, 7, 8, 11, 12}, wrap={9, 10, 13})

wb.properties.title = "满意度与住宿核验表"
wb.save(XLSX)

print("XLSX:", XLSX)
print("满意度行:", len(sat_rows), "| 住宿行:", len(dor_rows), "| 覆盖行:", len(cov_rows))
print("有满意度URL院校:", sum(1 for sid in ORDER if ((DORM.get(sid) or {}).get("satisfaction") or {}).get("sourceUrl")))
print("住宿来源合计:", sum(len(((DORM.get(sid) or {}).get("dormitory") or {}).get("platforms") or []) for sid in ORDER))
by_nature = {}
for r in dor_rows:
    by_nature[r[4]] = by_nature.get(r[4], 0) + 1
print("来源性质分布:", by_nature)
no_official = [r[2] for r in cov_rows if not r[3]]
print("缺官方来源院校(%d):" % len(no_official), "、".join(no_official))
with_url = sum(1 for r in p1_rows_all if r[8])
print("报录行合计:", len(p1_rows_all), "| 已挂官方公示链接:", with_url)
rc = {}
for r in recent_rows:
    rc[r[4]] = rc.get(r[4], 0) + 1
print("「最近」行数:", len(recent_rows), "| 最近年份分布:", rc,
      "| 已挂官方公示:", sum(1 for r in recent_rows if r[9]))
