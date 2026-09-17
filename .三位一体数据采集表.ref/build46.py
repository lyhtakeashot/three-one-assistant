# -*- coding: utf-8 -*-
"""用合并后的 46 所院校数据重建「三位一体数据采集表.xlsx」。
数据源：live-app/open-data/schools.json(15) + extra_1/2/3.json(31) + satisfaction_G/H.json
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
from openpyxl.worksheet.datavalidation import DataValidation

BASE = r"D:\Desktop\VibeCoding\三位一体辅助系统"
REF = os.path.join(BASE, ".三位一体数据采集表.ref")
SRC15 = os.path.join(BASE, "live-app", "open-data", "schools.json")
OUT = os.path.join(BASE, "三位一体数据采集表.xlsx")
OUT_MERGED = os.path.join(REF, "schools_38.json")


def load(name):
    with open(os.path.join(REF, name), "r", encoding="utf-8") as fh:
        return json.load(fh)


with open(SRC15, "r", encoding="utf-8") as fh:
    _ALL = json.load(fh)["schools"]

_IDS = {s["id"] for s in _ALL}
# 权威来源判定：应用侧数据集（38 所三位一体 + 7 所 2026 未招 = 45 所）以 eit/zufe 存在为准
if len(_ALL) >= 38 and {"zufe", "eit"} <= _IDS:
    # 权威来源：live-app/open-data/schools.json（应用侧 46 所，已含溯源字段）
    BY_ID = {s["id"]: s for s in _ALL}
    print("数据源：live-app/open-data/schools.json（%d 所）" % len(_ALL))
else:
    # 回退：老的拼装链路（15 所 + 调研素材）
    BY_ID = {s["id"]: s for s in _ALL}
    for s in load("extra_1.json") + load("extra_2.json") + load("extra_3.json"):
        BY_ID[s["id"]] = s
    SAT = {x["id"]: x for x in (load("satisfaction_G.json") + load("satisfaction_H.json"))}
    for sid, extra in SAT.items():
        if sid in BY_ID:
            if extra.get("satisfaction"):
                BY_ID[sid]["satisfaction"] = extra["satisfaction"]
            if extra.get("dormitory"):
                BY_ID[sid]["dormitory"] = extra["dormitory"]
    for p in load("extra_0.json"):
        s = BY_ID.get(p["id"])
        if not s:
            continue
        for k in ("formulaSource", "brochureUrl", "formulaNote"):
            if p.get(k):
                s[k] = p[k]
        if p.get("formula"):
            s["formula"] = p["formula"]
    print("数据源：回退链路（15 所 + extra 素材，%d 所）" % len(BY_ID))

# ---------- 类别 ----------
CAT_DIFANG = "省内地方属三位一体"
CAT_GSP = "高水平三位一体"
CAT_ZH = "综合评价（在浙）"
CAT_LS = "历史（2026未招）"

DIFANG_2026 = [
    ("浙江工业大学", "zjut"), ("浙江师范大学", "zjnu"), ("宁波大学", "nbu"), ("杭州电子科技大学", "hdu"),
    ("浙江工商大学", "zjgsu"), ("浙江理工大学", "zstu"), ("温州医科大学", "wmu"), ("浙江海洋大学", "zjou"),
    ("浙江农林大学", "zafu"), ("浙江中医药大学", "zcmu"), ("中国计量大学", "cjlu"), ("浙江万里学院", "zwu"),
    ("浙江科技大学", "zust"), ("浙江财经大学", "zufe"), ("嘉兴大学", "zjxu"), ("浙大城市学院", "zucc"),
    ("浙大宁波理工学院", "nit"), ("杭州师范大学", "hznu"), ("湖州师范大学", "hzsf"), ("绍兴大学", "sxu"),
    ("温州大学", "wzu"), ("浙江外国语学院", "zisu"), ("浙江水利水电学院", "zjweu"), ("浙江警察学院", "zjpc"),
    ("杭州医学院", "hzmc"), ("丽水学院", "lsu"), ("嘉兴南湖学院", "jxnh"), ("温州肯恩大学", "wku"),
    ("宁波诺丁汉大学", "unnc"), ("浙江越秀外国语学院", "zyu"), ("宁波财经学院", "nbfe"), ("温州商学院", "wzbc"),
]
GSP_2026 = [("复旦大学", "fudan"), ("上海交通大学", "sjtu"), ("浙江大学", "zju"),
            ("中国科学院大学", "ucas"), ("西湖大学", "westlake"), ("宁波东方理工大学", "eit")]
ZH_2026 = [("上海纽约大学", "nyush"), ("昆山杜克大学", "dku"), ("北京外国语大学", "bfsu"),
           ("上海科技大学", "shtech"), ("南方科技大学", "sustc"), ("华南理工大学", "scut"),
           ("香港中文大学（深圳）", "cuhksz"), ("深圳北理莫斯科大学", "smbu")]
LS_2026 = [("台州学院", "tzc"), ("衢州学院", "qzc"), ("宁波工程学院", "nbut"), ("温州理工学院", "wzut"),
           ("金华职业技术大学", "jhc"), ("宁波幼儿师范高等专科学校", "nbyz"), ("湖州学院", "hzxy")]

# 2026-09-16：本项目只收录「三位一体」，排除「综合评价招生」8 所
#   （综合评价官方不称「三位一体」，且上科大/上纽/昆杜/北外基本不计学考，口径不符）
ORDER = [(n, i, CAT_DIFANG) for n, i in DIFANG_2026] + \
        [(n, i, CAT_GSP) for n, i in GSP_2026]
EXCLUDED_ZH = list(ZH_2026)
CAT_OF = {i: c for _, i, c in ORDER}

# ---------- 保存合并数据（app School 结构） ----------
merged = {"version": "v2.0.0", "updatedAt": "2026年9月", "count": len(ORDER),
          "schools": [BY_ID[i] for _, i, _ in ORDER]}
with open(OUT_MERGED, "w", encoding="utf-8") as fh:
    json.dump(merged, fh, ensure_ascii=False, indent=2)

# ---------- 颜色 ----------
def xl_color(css):
    v = css.removeprefix("#").upper()
    if len(v) != 6:
        raise ValueError(css)
    return "FF" + v


XL_PRIMARY = xl_color("#4472C4")
XL_TITLE_BG = xl_color("#2F5597")
XL_LIGHT = xl_color("#D9E2F3")
XL_BORDER = xl_color("#BFBFBF")
XL_WHITE = xl_color("#FFFFFF")

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
A_RIGHT = Alignment(horizontal="right", vertical="center")
FILL_HDR = PatternFill("solid", fgColor=XL_PRIMARY)
FILL_TITLE = PatternFill("solid", fgColor=XL_TITLE_BG)
FILL_LIGHT = PatternFill("solid", fgColor=XL_LIGHT)

TYPE_MAP = {"ministry": "部属", "provincial": "省属"}
INTERVIEW_MAP = {"individual": "个面", "group": "群面", "both": "两者", "none": None}


def yesno(v):
    return None if v is None else ("是" if v else "否")


def joinv(v):
    return None if not v else ";".join(str(x) for x in v)


def build_sheet(wb, name, title, headers, rows, widths, num_formats=None,
                center_cols=(), right_cols=(), wrap_cols=(), dv_list=(),
                freeze="B3", reserve=0, use_filter=True):
    ws = wb.create_sheet(name)
    ncol = len(headers)
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncol)
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
    ws.row_dimensions[2].height = 32
    n_data = len(rows)
    last_row = 2 + n_data + reserve
    for i in range(n_data + reserve):
        r = 3 + i
        rv = rows[i] if i < n_data else []
        for j in range(1, ncol + 1):
            v = rv[j - 1] if j - 1 < len(rv) else None
            c = ws.cell(row=r, column=j, value=v)
            c.font = font_body
            if j in center_cols:
                c.alignment = A_CENTER
            elif j in right_cols:
                c.alignment = A_RIGHT
            elif j in wrap_cols:
                c.alignment = A_WRAP
            else:
                c.alignment = A_LEFT
            c.border = BORDER
            if num_formats and num_formats[j - 1]:
                c.number_format = num_formats[j - 1]
    for j, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(j)].width = w
    for col_idx, opts in dv_list:
        dv = DataValidation(type="list", formula1='"%s"' % opts, allow_blank=True)
        dv.error = "请从下拉列表中选择"
        ws.add_data_validation(dv)
        col = get_column_letter(col_idx)
        dv.add("%s3:%s%d" % (col, col, last_row))
    if freeze:
        ws.freeze_panes = freeze
    if use_filter:
        ws.auto_filter.ref = "A2:%s%d" % (get_column_letter(ncol), last_row)
    return ws


wb = Workbook()
wb.remove(wb.active)

# ================= 表A：院校基础信息（46 所） =================
A_HEADERS = [
    "类别", "院校全称", "简称", "别名", "类型", "id",
    "校区1名称", "校区1地址", "校区2名称", "校区2地址", "官网", "招生办电话", "咨询QQ",
    "普通学费", "中外合作学费", "体检限制",
    "招生简章链接", "章程年份", "章程链接",
    "学考A", "学考B", "学考C", "学考D", "学考满分", "校测满分", "高考满分",
    "学考权重", "校测权重", "高考权重",
    "有笔试", "有面试", "有体测", "笔试科目", "面试形式", "校测内容摘要", "备考建议",
    "转专业受限", "转专业说明",
    "综合满意度", "环境满意度", "生活满意度", "满意度来源",
    "宿舍描述", "宿舍评分", "宿舍亮点", "宿舍不足",
    "折算/口径备注",
]
A_WIDTHS = [
    18, 14, 9, 14, 8, 9,
    12, 16, 12, 16, 26, 14, 12,
    18, 20, 24,
    26, 10, 26,
    8, 8, 8, 8, 9, 9, 9,
    9, 9, 9,
    8, 8, 8, 16, 10, 40, 34,
    10, 34,
    10, 10, 10, 12,
    40, 10, 24, 24,
    46,
]
A_NUMFMT = [
    None, None, None, None, None, None,
    None, None, None, None, None, None, None,
    None, None, None,
    None, "0", None,
    "0", "0", "0", "0", "0", "0", "0",
    "0.00", "0.00", "0.00",
    None, None, None, None, None, None, None,
    None, None,
    "0.0", "0.0", "0.0", None,
    None, "0.0", None, None,
    None,
]
A_ROWS = []
for name, sid, cat in ORDER:
    s = BY_ID.get(sid)
    if not s:
        A_ROWS.append([cat, name] + [None] * (len(A_HEADERS) - 2))
        continue
    info = s.get("info", {}) or {}
    camps = info.get("campuses", []) or []
    c1 = camps[0] if len(camps) > 0 else {}
    c2 = camps[1] if len(camps) > 1 else {}
    f = s.get("formula", {}) or {}
    xk = f.get("xuekao", {}) or {}
    w = f.get("weights", {}) or {}
    ef = s.get("examFormat", {}) or {}
    tr = s.get("transferRestriction", {}) or {}
    sat = s.get("satisfaction", {}) or {}
    dor = s.get("dormitory", {}) or {}
    fs = s.get("formulaSource", {}) or {}
    A_ROWS.append([
        cat, s.get("name"), s.get("shortName"), joinv(s.get("aliases")),
        TYPE_MAP.get(s.get("type"), s.get("type")), s.get("id"),
        c1.get("name"), c1.get("address"), c2.get("name"), c2.get("address"),
        info.get("website"), info.get("admissionsPhone"), info.get("consultQQ"),
        info.get("tuitionGeneral"), info.get("tuitionSinoForeign"), info.get("healthRestrictions"),
        s.get("brochureUrl"), fs.get("year"), fs.get("url"),
        xk.get("A"), xk.get("B"), xk.get("C"), xk.get("D"), xk.get("fullScore"),
        f.get("xiaokao", {}).get("fullScore"), f.get("gaokao", {}).get("fullScore"),
        w.get("xuekao"), w.get("xiaokao"), w.get("gaokao"),
        yesno(ef.get("hasWrittenTest")), yesno(ef.get("hasInterview")), yesno(ef.get("hasPhysicalTest")),
        joinv(ef.get("writtenTestSubjects")),
        INTERVIEW_MAP.get(ef.get("interviewFormat"), ef.get("interviewFormat")),
        ef.get("contentSummary"), ef.get("tips"),
        yesno(tr.get("restricted")), tr.get("detail"),
        sat.get("overall"), sat.get("environment"), sat.get("life"), sat.get("source"),
        dor.get("description"), dor.get("score"), joinv(dor.get("highlights")), joinv(dor.get("drawbacks")),
        s.get("formulaNote"),
    ])

build_sheet(
    wb, "表A-院校基础信息", "表A：院校基础信息（每校 1 行）· 2026 三位一体 38 所（省属院校 32 + 高水平大学 6）",
    A_HEADERS, A_ROWS, A_WIDTHS, num_formats=A_NUMFMT,
    center_cols={5, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 37, 39, 40, 41, 44},
    wrap_cols={8, 10, 13, 16, 19, 33, 35, 36, 38, 43, 45, 46, 47},
    dv_list=[(1, "省内地方属三位一体,高水平三位一体"),
             (5, "省属,部属"), (30, "是,否"), (31, "是,否"), (32, "是,否"),
             (34, "个面,群面,两者"), (37, "是,否")],
    freeze="C3", reserve=0,
)

# ================= 表B：招生专业 =================
B_HEADERS = ["类别", "院校全称", "专业名称", "专业类别", "选科要求", "招生计划数", "最低分年份", "最低综合分", "来源链接"]
B_WIDTHS = [18, 16, 26, 12, 14, 12, 12, 12, 30]
B_NUMFMT = [None, None, None, None, None, "0", "0", "0.0", None]
B_ROWS = []
for name, sid, cat in ORDER:
    s = BY_ID.get(sid)
    if not s:
        continue
    for m in s.get("majors", []) or []:
        st = m.get("admissionStats", {}) or {}
        B_ROWS.append([cat, s.get("name"), m.get("name"), m.get("category"),
                       joinv(m.get("requiredSubjects")), m.get("planCount"),
                       st.get("year"), st.get("minScore"), st.get("sourceUrl")])

build_sheet(wb, "表B-招生专业", "表B：招生专业（每专业 1 行）",
            B_HEADERS, B_ROWS, B_WIDTHS, num_formats=B_NUMFMT,
            center_cols={6, 7, 8}, wrap_cols={9}, freeze="C3")

# ================= 表C：历年竞争比 =================
C_HEADERS = ["类别", "院校全称", "年份", "报名人数", "入围人数", "录取人数", "最低综合分", "平均综合分", "学考门槛要求"]
C_WIDTHS = [18, 16, 8, 12, 12, 12, 12, 12, 46]
C_NUMFMT = [None, None, "0", "#,##0", "#,##0", "#,##0", "0.0", "0.0", None]
C_ROWS = []
for name, sid, cat in ORDER:
    s = BY_ID.get(sid)
    if not s:
        continue
    for a in s.get("admission", []) or []:
        C_ROWS.append([cat, s.get("name"), a.get("year"), a.get("applicants"), a.get("passed"),
                       a.get("admitted"), a.get("minScore"), a.get("avgScore"), a.get("xuekaoRequirement")])

build_sheet(wb, "表C-历年竞争比", "表C：历年竞争比（每年 1 行）",
            C_HEADERS, C_ROWS, C_WIDTHS, num_formats=C_NUMFMT,
            center_cols={3}, right_cols={4, 5, 6, 7, 8}, wrap_cols={9}, freeze="C3")

# ================= 表D：报名流程 =================
D_HEADERS = ["类别", "院校全称", "步骤序号", "环节名称", "说明", "截止时间", "需要材料"]
D_WIDTHS = [18, 16, 10, 18, 42, 20, 30]
D_NUMFMT = [None, None, "0", None, None, None, None]
D_ROWS = []
for name, sid, cat in ORDER:
    s = BY_ID.get(sid)
    if not s:
        continue
    for st in sorted(s.get("applicationSteps", []) or [], key=lambda x: x.get("step", 0)):
        D_ROWS.append([cat, s.get("name"), st.get("step"), st.get("title"), st.get("description"),
                       st.get("deadline"), joinv(st.get("materials"))])

build_sheet(wb, "表D-报名流程", "表D：报名流程（每环节 1 行）",
            D_HEADERS, D_ROWS, D_WIDTHS, num_formats=D_NUMFMT,
            center_cols={3}, wrap_cols={5, 6, 7}, freeze="C3")

# ================= （原「招生类型核对」表已移除） =================
# 2026-09-16：项目只收录「三位一体」，8 所「综合评价招生」院校已整体排除，
# 逐校归属核对不再需要，排除说明统一写在「使用说明」与「院校清单」备注中。
EXCLUDED_NAMES = "、".join(n for n, _ in ZH_2026)

# ================= 院校清单 =================
LIST_HEADERS = ["序号", "类别", "院校全称", "id", "状态", "负责人", "备注"]
LIST_WIDTHS = [8, 22, 26, 12, 12, 12, 34]
LIST_ROWS = []
for idx, (name, sid, cat) in enumerate(ORDER, start=1):
    note = "已入库 live-app（open-data/schools.json + index.html SCHOOLS）"
    LIST_ROWS.append([idx, cat, BY_ID[sid]["name"] if sid in BY_ID else name, sid, "已收录", None, note])
for k, (name, sid) in enumerate(LS_2026, start=len(ORDER) + 1):
    LIST_ROWS.append([k, CAT_LS, name, sid, "2026未招", None, "2025年省内地方属，2026年名单中已移除"])

build_sheet(wb, "院校清单",
            "浙江省 2026 三位一体院校全名单 · 38 所已收录（省属 32 + 高水平 6；另 2026 未招 7 所备查）",
            LIST_HEADERS, LIST_ROWS, LIST_WIDTHS, center_cols={1, 4, 5}, wrap_cols={7}, freeze="A3",
            dv_list=[(2, "省内地方属三位一体,高水平三位一体,历史（2026未招）"),
                     (5, "已收录,待补,已补,已核对,2026未招")])

# ================= 使用说明 =================
ws_note = wb.create_sheet("使用说明")
ws_note.merge_cells("A1:B1")
t = ws_note["A1"]
t.value = "三位一体数据采集表 · 使用说明"
t.font = font_title
t.fill = FILL_TITLE
t.alignment = Alignment(horizontal="left", vertical="center")
ws_note.row_dimensions[1].height = 28
ws_note.column_dimensions["A"].width = 22
ws_note.column_dimensions["B"].width = 96

NOTE_ROWS = [
    ("【基本信息】", ""),
    ("文档用途", "整理浙江省「三位一体」全部院校信息，用于完善系统数据库。**只收录三位一体**，不含综合评价招生等其他渠道。"),
    ("数据落点", "live-app/index.html 的 SCHOOLS 数组（open-data/schools.json 同步）。"),
    ("更新日期", "2026-09-10（2026-09-16 调整：仅保留三位一体，剔除综合评价 8 所）"),
    ("本表结构", "表A 院校基础信息／表B 招生专业／表C 历年竞争比／表D 报名流程；四表以「类别+院校全称」关联，含「类别」列与「折算/口径备注」列。"),
    ("", ""),
    ("【2026 三位一体院校数量】", ""),
    ("省属院校三位一体", "32 所（2025 年为 39 所，2026 年减少 7 所）。"),
    ("高水平大学三位一体", "6 所：复旦大学、上海交通大学、浙江大学、中国科学院大学、西湖大学、宁波东方理工大学（后者 2026 首次招生）。"),
    ("合计", "**38 所**（32 + 6）；另附 2026 未招 7 所备查。"),
    ("⚠️ 已排除（非三位一体）", "综合评价招生 8 所：上海纽约大学、昆山杜克大学、北京外国语大学、上海科技大学、南方科技大学、华南理工大学、香港中文大学（深圳）、深圳北理莫斯科大学。"
                                "官方口径为「综合评价招生」而非「三位一体」，且上科大、上纽、昆杜、北外几乎不计学考，与本项目口径不符，已整体排除。"),
    ("", ""),
    ("【折算口径说明（重要）】", ""),
    ("省属院校", "学考 A/B/C/D 分值 × 10 门 + 校测满分 100 + 高考满分 750，权重三项和 = 1，可直接套综合分计算器。"),
    ("高水平大学", "公式与省属不同（复旦 85/10/5、上交 1000 分制、国科大 60/30/10、西湖 60/30/10、东方理工 70/20/10），"
                   "均含学考项但**不可与省属口径混算**；特殊口径已在「折算/口径备注」列注明。"),
    ("分数口径", "「最低综合分」为百分制综合分；若为高考分口径，已在表C「学考门槛要求」逐条注明。"),
    ("", ""),
    ("【格式约定与校验规则】", ""),
    ("权重", "写小数且三项之和 = 1（如 0.15 / 0.25 / 0.60）。"),
    ("学考分值", "学考满分须与 A/B/C/D 自洽；E 等第不计。"),
    ("最低综合分", "填百分制（0–100，可 1 位小数），不是高考分、不是 750 制。"),
    ("人数 / 计划数", "纯数字，不写「约」「+」「余名」。"),
    ("多值字段", "别名、选科要求、笔试科目、亮点统一用 ; 分隔。"),
    ("缺失值", "留空，不要写「暂无」「-」「待定」。"),
    ("布尔字段", "统一填「是 / 否」。"),
    ("", ""),
    ("【数据来源与合规】", ""),
    ("2026 三位一体名单", "浙江省教育考试院《2026 三位一体招生开启！报考要点速览》，2026-03-05，https://www.zjzs.net/art/2026/3/5/art_30_12088.html"),
    ("各校章程/简章", "取自各校本科招生网、教育部阳光高考特殊类型招生信息服务平台、浙江省教育考试院等（链接见各校「招生简章链接/章程链接」列）。"),
    ("满意度/宿舍", "满意度取自阳光高考网院校满意度数据；宿舍描述来自学校官方及第三方学生评价渠道，仅供参考。"),
    ("合规提示", "招生政策每年可能调整，务必以官方最新公告为准；涉及人数、分数、学费的数字请保留来源链接核实。"),
]

r = 3
for k, v in NOTE_ROWS:
    if k.startswith("【"):
        ws_note.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        c = ws_note.cell(row=r, column=1, value=k)
        c.font = Font(name=FONT, size=11, bold=True, color=XL_TITLE_BG)
        c.alignment = Alignment(horizontal="left", vertical="center")
    elif k:
        c1 = ws_note.cell(row=r, column=1, value=k)
        c1.font = Font(name=FONT, size=10, bold=True)
        c1.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        c1.fill = FILL_LIGHT
        c1.border = BORDER
        c2 = ws_note.cell(row=r, column=2, value=v)
        c2.font = font_body
        c2.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        c2.border = BORDER
    r += 1
ws_note.freeze_panes = "A3"

wb.properties.title = "三位一体数据采集表"
wb.save(OUT)
print("SAVED:", OUT)
print("MERGED:", OUT_MERGED, len(merged["schools"]))
print("sheets:", wb.sheetnames)
print("表A:", len(A_ROWS), "| 表B:", len(B_ROWS), "| 表C:", len(C_ROWS), "| 表D:", len(D_ROWS), "| 清单:", len(LIST_ROWS))
missing = [i for _, i, _ in ORDER if i not in BY_ID]
print("缺失院校数据:", missing)
