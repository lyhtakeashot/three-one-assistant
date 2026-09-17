// 院校数据导入脚本：把 .三位一体数据采集表.ref/ 下的口径数据归一化后写入 index.html 的 var SCHOOLS
// 用法：
//   node tools/import-schools.cjs            # 正式写入 index.html（写入前用 vm 试执行校验 + 逐字段差异断言）
//   node tools/import-schools.cjs --dry-run  # 只打印差异报告，不写入
//   node tools/import-schools.cjs --allow-diff  # 允许「覆盖更新」的院校出现字段差异（默认视差异为回退，直接中止）
// 设计原则：只做安全归一化与缺省填充，不伪造真实数值（折算规则原样保留）。
//
// 口径（2026-09-16）：本项目只收录「三位一体」院校
//   · 2026 名单 38 所（省属 32 + 高水平 6）→ recruit2026=true，全站可见
//   · 2026 未招但 2025 招过 7 所 → recruit2026=false，仅「2025 / 2024」年份视图可见
//   · 综合评价招生 8 所（上纽/昆杜/北外/上科大/南科大/华工/港中深/深北莫）已从范围内移除
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'index.html');
const REF_DIR = path.join(ROOT, '..', '.三位一体数据采集表.ref');
// 2026 口径数据源（38 所三位一体）
const SRC_PATH = path.join(REF_DIR, 'schools_38.json');
// 2025 口径数据源（44 所三位一体：含 2026 未招的 7 所；亦用于「今年未发布」院校的专业名单回退）
const PREV_PATH = path.join(REF_DIR, 'schools_44.json');

const DRY_RUN = process.argv.indexOf('--dry-run') !== -1;
const ALLOW_DIFF = process.argv.indexOf('--allow-diff') !== -1;

// ---- 范围与分类常量（唯一口径来源，勿散落他处）----
// 2026 年官方三位一体名单 38 所（浙江省教育考试院《2026 三位一体招生开启！报考要点速览》）
// 省属 32 + 高水平 6；不在此名单者 recruit2026=false
const RECRUIT_2026_IDS = [
  // 省内地方属 32
  'zjut', 'zjnu', 'nbu', 'hdu', 'zjgsu', 'zstu', 'wmu', 'zjou', 'zafu', 'zcmu', 'cjlu',
  'zwu', 'zust', 'zufe', 'zjxu', 'zucc', 'nit', 'hznu', 'hzsf', 'sxu', 'wzu', 'zisu',
  'zjweu', 'zjpc', 'hzmc', 'lsu', 'jxnh', 'wku', 'unnc', 'zyu', 'nbfe', 'wzbc',
  // 高水平 6
  'fudan', 'sjtu', 'zju', 'ucas', 'westlake', 'eit',
];
// 高水平大学三位一体 6 所
const HIGH_LEVEL_IDS = ['fudan', 'sjtu', 'zju', 'ucas', 'westlake', 'eit'];
// 分类取值（与 溯源素材/*.json 的 category 字段完全一致）
const CATEGORY_HIGH = '高水平三位一体';
const CATEGORY_PROV = '省内地方属三位一体';

// 选科白名单（与 index.html 的 SUBJECTS 一致）
const SUBJECTS = ['物理', '化学', '生物', '政治', '历史', '地理', '技术'];
// 选科别名归一
const SUBJECT_ALIAS = { '思想政治': '政治', '思想品德': '政治', '信息技术': '技术', '通用技术': '技术' };
// 表示「无选科要求」的写法
const NO_REQUIRE = ['不限', '无', '不限选科', '不限科目', ''];

// 来源字段：归一化时必须原样透传（否则会丢掉报录公示 / 满意度 / 住宿留证链接）
const ADMISSION_SOURCE_KEYS = [
  'sourceUrl', 'sourceTitle', 'xuekaoRequirementSourceUrl', 'xuekaoRequirementSourceTitle',
  'collectedAt', 'note',
];
const SATISFACTION_SOURCE_KEYS = ['sourceUrl', 'sourceTitle', 'sourceYear', 'collectedAt', 'note', 'alternates'];
const DORMITORY_EXTRA_KEYS = ['platforms', 'note'];

function isNum(v) { return typeof v === 'number' && isFinite(v); }
function numOrNull(v) { return isNum(v) && v > 0 ? v : null; }

// 归一化后追加透传字段：白名单键在前（保证输出字段顺序稳定），其余未知键按原顺序追加
function passthrough(out, raw, keys) {
  (keys || []).forEach(function (k) { if (raw[k] !== undefined) out[k] = raw[k]; });
  Object.keys(raw).forEach(function (k) { if (!(k in out)) out[k] = raw[k]; });
  return out;
}

// 选科归一：别名映射 + 剔除「不限」类写法 + 只保留白名单 + 去重
function normalizeSubjects(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  list.forEach(function (raw) {
    if (raw == null) return;
    let s = String(raw).trim();
    if (NO_REQUIRE.indexOf(s) !== -1) return;
    if (SUBJECT_ALIAS[s]) s = SUBJECT_ALIAS[s];
    if (SUBJECTS.indexOf(s) === -1) return; // 非白名单项直接剔除，避免测试与筛选异常
    if (out.indexOf(s) === -1) out.push(s);
  });
  return out;
}

// 赛事/流程步骤归一：剔除无标题行，重排 step 从 1 递增
function normalizeSteps(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  list.forEach(function (st) {
    if (!st || typeof st.title !== 'string' || !st.title.trim()) return;
    out.push({
      step: out.length + 1,
      title: st.title,
      description: typeof st.description === 'string' ? st.description : '',
      deadline: typeof st.deadline === 'string' ? st.deadline : '',
      materials: Array.isArray(st.materials) ? st.materials : []
    });
  });
  return out;
}

// 「有信息量」的判定键：只要带有来源链接/摘录，行就必须保留
// （存在「仅年份 + 官方公示链接、人数待补」的行，它们是年份视图的存在性信号，剔除会导致该年视图缺校）
const ADMISSION_HINT_KEYS = ['sourceUrl', 'sourceTitle', 'xuekaoRequirementSourceUrl', 'xuekaoRequirementSourceTitle', 'collectedAt', 'note'];

// 竞争比归一：缺失人数置 null；来源字段透传；空值键不写入（保持与既有数据同形）
// loose=false（2026 口径）：无任何数值、无学考门槛、无来源信息 的空行剔除
// loose=true（2026 未招的备查校）：只要有年份就保留，否则 2025 视图会整校消失
function normalizeAdmission(list, loose) {
  if (!Array.isArray(list)) return [];
  const out = [];
  list.forEach(function (a) {
    if (!a || !isNum(a.year)) return;
    const row = {
      year: a.year,
      applicants: numOrNull(a.applicants),
      passed: numOrNull(a.passed),
      admitted: numOrNull(a.admitted),
      minScore: isNum(a.minScore) ? a.minScore : null
    };
    if (typeof a.xuekaoRequirement === 'string' && a.xuekaoRequirement) row.xuekaoRequirement = a.xuekaoRequirement;
    passthrough(row, a, ADMISSION_SOURCE_KEYS);
    const hasNumeric = row.applicants != null || row.passed != null || row.admitted != null || row.minScore != null;
    const hasHint = ADMISSION_HINT_KEYS.some(function (k) { return row[k] != null && row[k] !== ''; });
    if (!loose && !hasNumeric && !row.xuekaoRequirement && !hasHint) return;
    out.push(row);
  });
  return out;
}

// 满意度归一：非 0-5 数值一律置 null（前端渲染「暂无」），source 缺省为「暂缺」；来源字段透传
function normalizeSatisfaction(sat) {
  sat = sat || {};
  function clean(v) { return isNum(v) && v >= 0 && v <= 5 ? v : null; }
  const out = {
    overall: clean(sat.overall),
    environment: clean(sat.environment),
    life: clean(sat.life),
    source: typeof sat.source === 'string' && sat.source ? sat.source : '暂缺'
  };
  return passthrough(out, sat, SATISFACTION_SOURCE_KEYS);
}

// 折算规则归一：结构补全 + 数值缺省，标准口径字段保持原值不改
function normalizeFormula(f) {
  f = f || {};
  const xk = f.xuekao || {};
  const xs = f.xiaokao || {};
  const gk = f.gaokao || {};
  const w = f.weights || {};
  return {
    xuekao: {
      A: isNum(xk.A) ? xk.A : 0,
      B: isNum(xk.B) ? xk.B : 0,
      C: isNum(xk.C) ? xk.C : 0,
      D: isNum(xk.D) ? xk.D : 0,
      fullScore: isNum(xk.fullScore) ? xk.fullScore : 0
    },
    xiaokao: { fullScore: isNum(xs.fullScore) && xs.fullScore > 0 ? xs.fullScore : 100 },
    gaokao: { fullScore: isNum(gk.fullScore) && gk.fullScore > 0 ? gk.fullScore : 750 },
    weights: {
      xuekao: isNum(w.xuekao) ? w.xuekao : 0,
      xiaokao: isNum(w.xiaokao) ? w.xiaokao : 0,
      gaokao: isNum(w.gaokao) ? w.gaokao : 0
    }
  };
}

function normalizeSchool(raw, opts) {
  opts = opts || {};
  const s = JSON.parse(JSON.stringify(raw));
  const info = s.info || {};
  s.info = {
    campuses: Array.isArray(info.campuses) && info.campuses.length ? info.campuses : [{ name: '主校区', address: '' }],
    website: typeof info.website === 'string' ? info.website : '',
    admissionsPhone: typeof info.admissionsPhone === 'string' && info.admissionsPhone ? info.admissionsPhone : '暂未公布',
    tuitionGeneral: typeof info.tuitionGeneral === 'string' && info.tuitionGeneral ? info.tuitionGeneral : '暂未公布',
    tuitionSinoForeign: typeof info.tuitionSinoForeign === 'string' ? info.tuitionSinoForeign : '',
    healthRestrictions: typeof info.healthRestrictions === 'string' ? info.healthRestrictions : ''
  };
  if (info.consultQQ) s.info.consultQQ = info.consultQQ;

  s.formula = normalizeFormula(s.formula);

  const ex = s.examFormat || {};
  const subjects = Array.isArray(ex.writtenTestSubjects) ? ex.writtenTestSubjects.slice() : [];
  s.examFormat = {
    hasWrittenTest: !!ex.hasWrittenTest,
    hasInterview: !!ex.hasInterview,
    hasPhysicalTest: !!ex.hasPhysicalTest,
    writtenTestSubjects: (ex.hasWrittenTest && subjects.length === 0) ? ['综合知识'] : subjects,
    interviewFormat: ex.interviewFormat || 'individual',
    contentSummary: typeof ex.contentSummary === 'string' ? ex.contentSummary : '',
    tips: typeof ex.tips === 'string' ? ex.tips : ''
  };

  if (!s.transferRestriction || typeof s.transferRestriction.restricted !== 'boolean') {
    s.transferRestriction = { restricted: !!(s.transferRestriction && s.transferRestriction.restricted), detail: (s.transferRestriction && s.transferRestriction.detail) || '' };
  } else if (typeof s.transferRestriction.detail !== 'string') {
    s.transferRestriction.detail = '';
  }

  s.majors = (Array.isArray(s.majors) ? s.majors : []).map(function (m, i) {
    const out = {
      id: m.id || (s.id + '-m' + (i + 1)),
      schoolId: s.id,
      name: m.name || ('专业' + (i + 1)),
      category: typeof m.category === 'string' ? m.category : '',
      requiredSubjects: normalizeSubjects(m.requiredSubjects),
      planCount: isNum(m.planCount) ? m.planCount : 0
    };
    if (m.admissionStats) out.admissionStats = m.admissionStats;
    return out;
  });

  s.admission = normalizeAdmission(s.admission, !!opts.looseAdmission);
  s.satisfaction = normalizeSatisfaction(s.satisfaction);
  s.applicationSteps = normalizeSteps(s.applicationSteps);

  const d = s.dormitory || {};
  const dorm = {
    description: typeof d.description === 'string' ? d.description : '',
    score: isNum(d.score) ? d.score : null,
    // 既有数据里 source 有「纯文本」与 {name,url} 两种形态，两者都原样保留，不压平
    source: typeof d.source === 'string' ? d.source : (d.source && typeof d.source === 'object' ? d.source : ''),
    highlights: Array.isArray(d.highlights) ? d.highlights : [],
    drawbacks: Array.isArray(d.drawbacks) ? d.drawbacks : []
  };
  s.dormitory = passthrough(dorm, d, DORMITORY_EXTRA_KEYS);

  s.brochureUrl = typeof s.brochureUrl === 'string' ? s.brochureUrl : '';
  if (s.formulaSource && typeof s.formulaSource !== 'object') s.formulaSource = undefined;
  if (!s.formulaNote) delete s.formulaNote;

  // ---- 范围与分类（2026-09-16 新增字段）----
  s.category = HIGH_LEVEL_IDS.indexOf(s.id) > -1 ? CATEGORY_HIGH : CATEGORY_PROV;
  s.recruit2026 = RECRUIT_2026_IDS.indexOf(s.id) > -1;
  return s;
}

// 今年(2026)是否已发布：录取数据中存在 >=2026 的行
function hasCurrentAdmission(s) {
  return (s.admission || []).some(function (a) { return isNum(a.year) && a.year >= 2026; });
}

// 去年(2025)专业名单归一：2025 文件专业无 id/schoolId，按序号补齐稳定 id；选科同样归一
function normalizePreviousMajors(schoolId, list) {
  return (Array.isArray(list) ? list : []).map(function (m, i) {
    return {
      id: schoolId + '-m' + (i + 1),
      schoolId: schoolId,
      name: m.name || ('专业' + (i + 1)),
      category: typeof m.category === 'string' ? m.category : '',
      requiredSubjects: normalizeSubjects(m.requiredSubjects),
      planCount: isNum(m.planCount) ? m.planCount : 0
    };
  });
}

// 把 majorsYear 紧跟在 majors 之后写入，保持字段顺序可读
function withMajorsYear(s, year) {
  const out = {};
  Object.keys(s).forEach(function (k) {
    out[k] = s[k];
    if (k === 'majors') out.majorsYear = year;
  });
  if (!('majorsYear' in out)) out.majorsYear = year;
  return out;
}

// 序列化：每校一行紧凑 JSON（JSON 是合法 JS）
function serializeSchools(list) {
  return 'var SCHOOLS=[\r\n' + list.map(function (s) { return JSON.stringify(s); }).join(',\r\n') + '\r\n]';
}

// 字符串感知的括号扫描：定位 var SCHOOLS=[ 的配对 ] 结束位置
function findSchoolsEnd(html) {
  const startMark = 'var SCHOOLS=[';
  const start = html.indexOf(startMark);
  if (start === -1) throw new Error('index.html 未找到 var SCHOOLS=[');
  let depth = 0, inStr = false, quote = '', i = start;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === quote) inStr = false;
      continue;
    }
    if (c === "'" || c === '"') { inStr = true; quote = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('SCHOOLS 数组括号不配对');
}

function verifyBlock(block) {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(block + ';', sandbox, { timeout: 5000 });
  const list = sandbox.SCHOOLS;
  if (!Array.isArray(list) || list.length === 0) throw new Error('序列化结果不是非空数组');
  const ids = new Set();
  list.forEach(function (s) { if (ids.has(s.id)) throw new Error('id 重复: ' + s.id); ids.add(s.id); });
  return list;
}

// 扁平化（用于逐字段差异比对）
function flat(o, p, out) {
  out = out || {};
  if (o === null || o === undefined) { out[p] = String(o); return out; }
  if (Array.isArray(o)) { o.forEach(function (v, i) { flat(v, p + '[' + i + ']', out); }); if (!o.length) out[p] = '[]'; return out; }
  if (typeof o === 'object') { Object.keys(o).forEach(function (k) { flat(o[k], p ? p + '.' + k : k, out); }); return out; }
  out[p] = String(o);
  return out;
}

// 比对「覆盖更新」院校：除本次新增字段外不应有任何差异（防数据回退）
const NEW_FIELDS = ['category', 'recruit2026'];
function diffSchool(oldS, newS) {
  const a = flat(oldS, ''), b = flat(newS, '');
  const keys = new Set(Object.keys(a).concat(Object.keys(b)));
  const diffs = [];
  keys.forEach(function (k) {
    if (a[k] === b[k]) return;
    // 新增字段（及其父路径）不算差异
    if (NEW_FIELDS.some(function (f) { return k === f || k.indexOf(f + '.') === 0 || k.indexOf(f + '[') === 0; })) return;
    diffs.push(k + ': ' + (a[k] === undefined ? '(缺失)' : a[k]) + ' => ' + (b[k] === undefined ? '(缺失)' : b[k]));
  });
  return diffs;
}

function loadJson(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const arr = Array.isArray(raw) ? raw : raw.schools;
  if (!Array.isArray(arr)) throw new Error(file + ' 缺少 schools 数组');
  return { meta: raw, list: arr };
}

function main() {
  const src = loadJson(SRC_PATH);
  const base = src.list;

  const idsBase = base.map(function (s) { return s.id; });
  // 2026 名单常量与数据源一致性自检
  const missingInSrc = RECRUIT_2026_IDS.filter(function (id) { return idsBase.indexOf(id) === -1; });
  if (missingInSrc.length) throw new Error('2026 名单常量中的院校不在数据源内: ' + missingInSrc.join(','));
  if (RECRUIT_2026_IDS.length !== base.length) {
    console.warn('警告：RECRUIT_2026_IDS 数量(' + RECRUIT_2026_IDS.length + ') 与数据源院校数(' + base.length + ') 不一致');
  }

  const normalized = base.map(function (s) { return normalizeSchool(s); });

  // 去年(2025)数据：① 用于「今年未发布」院校的专业名单回退；② 追加「2026 未招」的备查校
  let prevMap = {};
  let prevList = [];
  try {
    const prevRaw = loadJson(PREV_PATH);
    prevList = prevRaw.list;
    prevList.forEach(function (p) { if (p && p.id) prevMap[p.id] = p; });
  } catch (e) {
    console.warn('警告：未读取到 ' + path.basename(PREV_PATH) + '，跳过去年名单回退与备查校追加（' + e.message + '）');
  }

  let published = 0, unpublished = 0, switched = 0, kept = 0;
  const list = normalized.map(function (s) {
    // 源已有合法 majorsYear：以源为准，不改动 majors（避免重跑改变历史回退结果）
    if (Number.isInteger(s.majorsYear) && s.majorsYear >= 2020 && s.majorsYear <= 2030) {
      kept++;
      if (hasCurrentAdmission(s)) published++; else unpublished++;
      return withMajorsYear(s, s.majorsYear);
    }
    // 源缺失 majorsYear：按「今年优先 / 去年回退」推导
    if (hasCurrentAdmission(s)) { published++; return withMajorsYear(s, 2026); }
    unpublished++;
    const p = prevMap[s.id];
    let out = s;
    if (p && Array.isArray(p.majors) && p.majors.length) {
      out = Object.assign({}, s, { majors: normalizePreviousMajors(s.id, p.majors) });
      switched++;
    }
    return withMajorsYear(out, 2025);
  });

  // ---- 追加「2026 未招但 2025 招过」的备查校（recruit2026=false，仅 2025/2024 视图可见）----
  const added = [];
  prevList.forEach(function (p) {
    if (!p || !p.id) return;
    if (idsBase.indexOf(p.id) !== -1) return;
    const s = normalizeSchool(p, { looseAdmission: true });
    s.recruit2026 = false; // 不在 2026 官方名单内
    const withYear = withMajorsYear(s, 2025);
    list.push(withYear);
    added.push(withYear.id);
  });

  const block = serializeSchools(list);
  verifyBlock(block);

  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const start = html.indexOf('var SCHOOLS=[');
  const end = findSchoolsEnd(html);
  const oldBlock = html.substring(start, end);

  // ---- 差异报告 ----
  let oldList = [];
  try {
    const sb = {};
    vm.createContext(sb);
    vm.runInContext(oldBlock + ';', sb, { timeout: 5000 });
    oldList = sb.SCHOOLS || [];
  } catch (e) { /* 旧块不可解析时忽略 */ }
  const oldIds = oldList.map(function (s) { return s.id; });
  const newIds = list.map(function (s) { return s.id; });
  const addedIds = newIds.filter(function (id) { return oldIds.indexOf(id) === -1; });
  const removedIds = oldIds.filter(function (id) { return newIds.indexOf(id) === -1; });
  const updatedIds = newIds.filter(function (id) { return oldIds.indexOf(id) !== -1; });

  console.log('院校数：' + oldIds.length + ' -> ' + newIds.length);
  console.log('移除 ' + removedIds.length + ' 所：' + (removedIds.join(',') || '无'));
  console.log('新增 ' + addedIds.length + ' 所：' + (addedIds.join(',') || '无'));
  console.log('覆盖更新 ' + updatedIds.length + ' 所：' + (updatedIds.join(',') || '无'));

  const oldMap = {};
  oldList.forEach(function (s) { oldMap[s.id] = s; });
  const newMap = {};
  list.forEach(function (s) { newMap[s.id] = s; });
  let diffCount = 0;
  const diffReport = [];
  updatedIds.forEach(function (id) {
    const d = diffSchool(oldMap[id], newMap[id]);
    if (d.length) { diffCount += d.length; diffReport.push([id, d]); }
  });
  console.log('覆盖更新院校字段差异：' + diffCount + ' 处' + (diffCount ? '（涉及 ' + diffReport.length + ' 所）' : '（与旧数据完全一致，仅新增 category / recruit2026）'));
  diffReport.forEach(function (row) {
    console.log('  ✗ ' + row[0] + '（' + row[1].length + ' 处）');
    row[1].slice(0, 6).forEach(function (x) { console.log('      ' + x); });
    if (row[1].length > 6) console.log('      …还有 ' + (row[1].length - 6) + ' 处');
  });

  const notes = list.filter(function (s) { return s.formulaNote; }).length;
  const nonStandard = list.filter(function (s) { return !(s.formula.weights.xuekao > 0 && s.formula.xuekao.fullScore > 0 && (s.formula.xuekao.A + s.formula.xuekao.B + s.formula.xuekao.C + s.formula.xuekao.D) > 0); }).length;
  console.log('带 formulaNote：' + notes + ' 所；折算口径特殊：' + nonStandard + ' 所');
  console.log('今年(2026)已发布：' + published + ' 所；今年未发布(用去年数据)：' + unpublished + ' 所；其中改用去年专业名单：' + switched + ' 所；沿用源 majorsYear：' + kept + ' 所');
  const majorsYears = {};
  list.forEach(function (s) { majorsYears[s.majorsYear] = (majorsYears[s.majorsYear] || 0) + 1; });
  console.log('majorsYear 分布：' + JSON.stringify(majorsYears));

  const cats = {};
  list.forEach(function (s) { cats[s.category] = (cats[s.category] || 0) + 1; });
  console.log('category 分布：' + JSON.stringify(cats));
  const recruit = { true: 0, false: 0 };
  list.forEach(function (s) { recruit[String(!!s.recruit2026)]++; });
  console.log('recruit2026：true ' + recruit['true'] + ' 所 / false ' + recruit['false'] + ' 所');

  // 各年份视图可见院校数（与前端 schoolVisibleInMode 同口径）
  const countByMode = function (mode) {
    return list.filter(function (s) {
      const ys = [];
      (s.admission || []).forEach(function (a) { if (a && a.year != null && ys.indexOf(a.year) === -1) ys.push(a.year); });
      if (mode === 'latest') return s.recruit2026 !== false;
      if (mode === 2026) return s.recruit2026 !== false && ys.indexOf(2026) !== -1;
      return ys.indexOf(mode) !== -1;
    }).length;
  };
  console.log('年份视图院校数：最新 ' + countByMode('latest') + ' 所 / 2026 ' + countByMode(2026) + ' 所 / 2025 ' + countByMode(2025) + ' 所 / 2024 ' + countByMode(2024) + ' 所');
  console.log('来源字段完整性：satisfaction.sourceUrl ' + list.filter(function (s) { return s.satisfaction && s.satisfaction.sourceUrl; }).length +
    ' / dormitory.platforms ' + list.filter(function (s) { return (s.dormitory.platforms || []).length; }).length +
    ' / admission.sourceUrl ' + list.reduce(function (n, s) { return n + (s.admission || []).filter(function (a) { return a.sourceUrl; }).length; }, 0) +
    ' / sources ' + list.filter(function (s) { return s.sources; }).length);

  if (DRY_RUN) { console.log('[dry-run] 未写入 index.html'); return; }

  if (diffCount > 0 && !ALLOW_DIFF) {
    console.error('ERROR: 覆盖更新出现 ' + diffCount + ' 处字段差异，疑似数据回退，已中止写入。');
    console.error('       确认为有意变更时，请加 --allow-diff 重新执行。');
    process.exit(1);
  }

  const next = html.substring(0, start) + block + html.substring(end);
  fs.writeFileSync(HTML_PATH, next, 'utf8');
  console.log('已写入 ' + HTML_PATH);
}

main();
