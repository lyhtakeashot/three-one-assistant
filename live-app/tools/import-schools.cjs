// 院校数据导入脚本：把 .三位一体数据采集表.ref/schools_46.json 归一化后写入 index.html 的 var SCHOOLS
// 用法：
//   node tools/import-schools.cjs            # 正式写入 index.html（写入前用 vm 试执行校验）
//   node tools/import-schools.cjs --dry-run  # 只打印差异报告，不写入
// 设计原则：只做安全归一化与缺省填充，不伪造真实数值（折算规则原样保留）。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'index.html');
const SRC_PATH = path.join(ROOT, '..', '.三位一体数据采集表.ref', 'schools_46.json');
// 去年(2025)数据：用于「今年未发布」学校的专业名单回退
const PREV_PATH = path.join(ROOT, '..', '.三位一体数据采集表.ref', 'schools_2025.json');

const DRY_RUN = process.argv.indexOf('--dry-run') !== -1;

// 选科白名单（与 index.html 的 SUBJECTS 一致）
const SUBJECTS = ['物理', '化学', '生物', '政治', '历史', '地理', '技术'];
// 选科别名归一
const SUBJECT_ALIAS = { '思想政治': '政治', '思想品德': '政治', '信息技术': '技术', '通用技术': '技术' };
// 表示「无选科要求」的写法
const NO_REQUIRE = ['不限', '无', '不限选科', '不限科目', ''];

function isNum(v) { return typeof v === 'number' && isFinite(v); }
function numOrNull(v) { return isNum(v) && v > 0 ? v : null; }

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

// 竞争比归一：缺失人数置 null；整行仅剩年份的剔除
function normalizeAdmission(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  list.forEach(function (a) {
    if (!a || !isNum(a.year)) return;
    const row = {
      year: a.year,
      applicants: numOrNull(a.applicants),
      passed: numOrNull(a.passed),
      admitted: numOrNull(a.admitted),
      minScore: isNum(a.minScore) ? a.minScore : null,
      xuekaoRequirement: typeof a.xuekaoRequirement === 'string' ? a.xuekaoRequirement : ''
    };
    // 保留含学考门槛等文字信息的行（如「今年已发布但录取人数待公布」），避免丢失年份信号
    if (row.applicants == null && row.passed == null && row.admitted == null && row.minScore == null && !row.xuekaoRequirement) return;
    out.push(row);
  });
  return out;
}

// 满意度归一：非 0-5 数值一律置 null（前端渲染「暂无」），source 缺省为「暂缺」
function normalizeSatisfaction(sat) {
  sat = sat || {};
  function clean(v) { return isNum(v) && v >= 0 && v <= 5 ? v : null; }
  return {
    overall: clean(sat.overall),
    environment: clean(sat.environment),
    life: clean(sat.life),
    source: typeof sat.source === 'string' && sat.source ? sat.source : '暂缺'
  };
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

function normalizeSchool(raw) {
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
    return {
      id: m.id || (s.id + '-m' + (i + 1)),
      schoolId: s.id,
      name: m.name || ('专业' + (i + 1)),
      category: typeof m.category === 'string' ? m.category : '',
      requiredSubjects: normalizeSubjects(m.requiredSubjects),
      planCount: isNum(m.planCount) ? m.planCount : 0,
      admissionStats: m.admissionStats || undefined
    };
  });

  s.admission = normalizeAdmission(s.admission);
  s.satisfaction = normalizeSatisfaction(s.satisfaction);
  s.applicationSteps = normalizeSteps(s.applicationSteps);

  const d = s.dormitory || {};
  s.dormitory = {
    description: typeof d.description === 'string' ? d.description : '',
    score: isNum(d.score) ? d.score : null,
    source: typeof d.source === 'string' ? d.source : '',
    highlights: Array.isArray(d.highlights) ? d.highlights : [],
    drawbacks: Array.isArray(d.drawbacks) ? d.drawbacks : []
  };

  s.brochureUrl = typeof s.brochureUrl === 'string' ? s.brochureUrl : '';
  if (s.formulaSource && typeof s.formulaSource !== 'object') s.formulaSource = undefined;
  if (!s.formulaNote) delete s.formulaNote;
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

function main() {
  const src = JSON.parse(fs.readFileSync(SRC_PATH, 'utf8'));
  const raw = Array.isArray(src) ? src : src.schools;
  if (!Array.isArray(raw)) throw new Error('数据源缺少 schools 数组');

  const normalized = raw.map(normalizeSchool);

  // 合并去年(2025)数据：今年未发布的学校（无 2026 录取行）改用 2025 完整专业名单并标注 majorsYear
  let prevMap = {};
  try {
    const prevRaw = JSON.parse(fs.readFileSync(PREV_PATH, 'utf8'));
    const prevArr = Array.isArray(prevRaw) ? prevRaw : (prevRaw.schools || []);
    prevArr.forEach(function (p) { if (p && p.id) prevMap[p.id] = p; });
  } catch (e) {
    console.warn('警告：未读取到 schools_2025.json，跳过去年名单回退（' + e.message + '）');
  }
  let published = 0, unpublished = 0, switched = 0;
  const list = normalized.map(function (s) {
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

  const block = serializeSchools(list);
  verifyBlock(block);

  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const start = html.indexOf('var SCHOOLS=[');
  const end = findSchoolsEnd(html);
  const oldBlock = html.substring(start, end);

  // 差异报告
  let oldIds = [];
  try {
    const sb = {};
    vm.createContext(sb);
    vm.runInContext(oldBlock + ';', sb, { timeout: 5000 });
    oldIds = (sb.SCHOOLS || []).map(function (s) { return s.id; });
  } catch (e) { /* 旧块不可解析时忽略 */ }
  const newIds = list.map(function (s) { return s.id; });
  console.log('院校数：' + oldIds.length + ' -> ' + newIds.length);
  const added = newIds.filter(function (id) { return oldIds.indexOf(id) === -1; });
  const removed = oldIds.filter(function (id) { return newIds.indexOf(id) === -1; });
  const updated = newIds.filter(function (id) { return oldIds.indexOf(id) !== -1; });
  console.log('新增 ' + added.length + ' 所：' + (added.join(',') || '无'));
  console.log('覆盖更新 ' + updated.length + ' 所：' + (updated.join(',') || '无'));
  console.log('移除 ' + removed.length + ' 所：' + (removed.join(',') || '无'));
  const notes = list.filter(function (s) { return s.formulaNote; }).length;
  const nonStandard = list.filter(function (s) { return !(s.formula.weights.xuekao > 0 && s.formula.xuekao.fullScore > 0); }).length;
  console.log('带 formulaNote：' + notes + ' 所；折算口径特殊：' + nonStandard + ' 所');
  console.log('今年(2026)已发布：' + published + ' 所；今年未发布(用 2025 数据)：' + unpublished + ' 所；其中改用 2025 专业名单：' + switched + ' 所');

  if (DRY_RUN) { console.log('[dry-run] 未写入 index.html'); return; }

  const next = html.substring(0, start) + block + html.substring(end);
  fs.writeFileSync(HTML_PATH, next, 'utf8');
  console.log('已写入 ' + HTML_PATH);
}

main();
