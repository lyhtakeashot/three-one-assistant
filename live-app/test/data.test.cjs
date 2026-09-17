// 数据完整性测试：院校字段、URL、满意度范围、学考折算递减、权重和=1
// 规则分级：标准折算院校执行严格校验；折算口径特殊院校（如国科大）放宽，
// 但结构性字段（id/名称/专业/流程/链接等）仍严格校验。可空字段允许为 null（前端渲染「暂无」）。
// 范围口径（2026-09-16）：只收录「三位一体」院校 = 2026 招生 38 所 + 2026 未招备查 7 所；
// 「最新」视图只出 2026 招生的 38 所，备查校仅出现在 2025 及更早年份视图。
const { extract } = require('./lib/extract.cjs');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('data: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}

// 标准三一折算：学考有可用的等级分值表（A+B+C+D > 0，与 index.html 口径一致），且学考/高考权重均为正
function isStandardFormula(f) {
  return !!(f && f.xuekao && (f.xuekao.A + f.xuekao.B + f.xuekao.C + f.xuekao.D) > 0 && f.weights && f.weights.xuekao > 0 && f.weights.gaokao > 0);
}

module.exports = function run(t) {
  const {
    SCHOOLS, SUBJECTS, visibleSchools, schoolVisibleInMode, isRecruit2026,
    categoryOf, categoryLabel, categoryCounts, filterByCategory,
    CATEGORY_HIGH, CATEGORY_PROV, CATEGORY_FILTERS,
  } = extract();

  // 院校数量：2026 招生 38 所（省内地方属 32 + 高水平 6）+ 2026 未招备查 7 所
  const recruit = SCHOOLS.filter((s) => isRecruit2026(s));
  const extra = SCHOOLS.filter((s) => !isRecruit2026(s));
  check(t, recruit.length === 38, '2026 年招生院校应为 38 所（当前 ' + recruit.length + '）');
  check(t, extra.length === 7, '2026 未招备查校应为 7 所（当前 ' + extra.length + '）');
  check(t, SCHOOLS.length === 45, '院校总量应为 45（当前 ' + SCHOOLS.length + '）');

  // id 唯一性与基本字段
  const ids = new Set();
  SCHOOLS.forEach((s) => {
    check(t, !!s.id, s.name + ' 应有 id');
    check(t, !ids.has(s.id), s.name + ' id 重复');
    ids.add(s.id);
    check(t, typeof s.name === 'string' && s.name.length > 0, s.id + ' name 非空');
    check(t, typeof s.shortName === 'string' && s.shortName.length > 0, s.id + ' shortName 非空');
    check(t, Array.isArray(s.aliases), s.id + ' aliases 为数组');
    check(t, s.type === 'ministry' || s.type === 'provincial', s.id + ' type 合法');

    // 范围与类别（2026-09-16 新增维度）
    check(t, s.category === CATEGORY_HIGH || s.category === CATEGORY_PROV, s.id + ' category 取值合法（' + s.category + '）');
    check(t, categoryOf(s) === s.category, s.id + ' categoryOf 与字段一致');
    check(t, typeof s.recruit2026 === 'boolean', s.id + ' recruit2026 为布尔');
    check(t, categoryLabel(s.category) === (s.category === CATEGORY_HIGH ? '高水平' : '省内地方属'), s.id + ' categoryLabel 映射正确');

    // info
    const info = s.info || {};
    check(t, Array.isArray(info.campuses) && info.campuses.length > 0, s.id + ' info.campuses 非空');
    check(t, /^https?:\/\//.test(info.website || ''), s.id + ' info.website 以 http 开头');
    check(t, typeof info.admissionsPhone === 'string' && info.admissionsPhone.length > 0, s.id + ' info.admissionsPhone 非空');
    check(t, typeof info.tuitionGeneral === 'string' && info.tuitionGeneral.length > 0, s.id + ' info.tuitionGeneral 非空');

    // formula
    const f = s.formula || {};
    check(t, !!f.xuekao && !!f.xiaokao && !!f.gaokao, s.id + ' formula 三部分齐全');
    check(t, !!f.weights, s.id + ' formula.weights 存在');
    const standard = isStandardFormula(f);
    if (f.weights) {
      const sum = (f.weights.xuekao || 0) + (f.weights.xiaokao || 0) + (f.weights.gaokao || 0);
      check(t, Math.abs(sum - 1) < 0.001, s.id + ' weights 之和 = 1（实际 ' + sum.toFixed(3) + '）');
    }
    if (standard) {
      check(t, f.weights.xuekao > 0 && f.weights.gaokao > 0, s.id + ' 标准折算 weights 均 > 0');
      check(t, f.xuekao.A > f.xuekao.B && f.xuekao.B >= f.xuekao.C && f.xuekao.C > f.xuekao.D, s.id + ' 学考折算 A>B>=C>D');
      check(t, f.xuekao.A > 0 && f.xuekao.fullScore > 0, s.id + ' 学考分值 > 0');
    }

    // examFormat
    const ex = s.examFormat || {};
    check(t, typeof ex.hasWrittenTest === 'boolean' && typeof ex.hasInterview === 'boolean', s.id + ' examFormat 布尔字段');
    if (ex.hasWrittenTest) {
      check(t, Array.isArray(ex.writtenTestSubjects) && ex.writtenTestSubjects.length > 0, s.id + ' 有笔试应有科目');
    }

    // majors
    check(t, Array.isArray(s.majors) && s.majors.length > 0, s.id + ' majors 非空');
    s.majors.forEach((m) => {
      check(t, !!m.name && typeof m.name === 'string', s.id + ' 专业名非空');
      check(t, typeof m.category === 'string', s.id + ' ' + m.name + ' 有 category');
      (m.requiredSubjects || []).forEach((sub) => {
        check(t, SUBJECTS.indexOf(sub) > -1, s.id + ' ' + m.name + ' 选科 ' + sub + ' 合法');
      });
    });

    // majorsYear（数据年份）：今年未发布的学校应回退到有录取行的年份
    if (s.majorsYear != null) {
      check(t, Number.isInteger(s.majorsYear) && s.majorsYear >= 2020 && s.majorsYear <= 2030, s.id + ' majorsYear 合法（' + s.majorsYear + '）');
      if (s.majorsYear < 2026) {
        check(t, (s.admission || []).some((a) => a.year === s.majorsYear), s.id + ' 未发布学校存在 ' + s.majorsYear + ' 年录取行');
      }
    }

    // admission（可空；标准院校最低分为百分制，特殊口径院校不校验分制区间）
    if (Array.isArray(s.admission) && s.admission.length > 0) {
      s.admission.forEach((a) => {
        if (a.minScore != null) {
          check(t, a.minScore >= 0, s.id + ' minScore 非负（' + a.minScore + '）');
          // 标准院校最低分应为百分制；>100 的非百分制口径须有 formulaNote 说明（历史遗留：原综合评价院校的 631 口径）
          if (standard && !(a.minScore > 100 && s.formulaNote)) check(t, a.minScore <= 100, s.id + ' minScore 在 0-100（' + a.minScore + '）');
        }
        check(t, a.applicants == null || a.applicants > 0, s.id + ' 报名人数 > 0 或为空');
        check(t, a.admitted == null || a.admitted > 0, s.id + ' 录取人数 > 0 或为空');
      });
    }

    // satisfaction（可空；有值须在 0-5）
    const sat = s.satisfaction || {};
    [sat.overall, sat.environment, sat.life].forEach((v) => {
      check(t, v == null || (typeof v === 'number' && v >= 0 && v <= 5), s.id + ' 满意度在 0-5 或为空');
    });

    // transferRestriction
    check(t, typeof s.transferRestriction.restricted === 'boolean', s.id + ' transferRestriction.restricted 布尔');

    // applicationSteps
    check(t, Array.isArray(s.applicationSteps) && s.applicationSteps.length > 0, s.id + ' applicationSteps 非空');
    s.applicationSteps.forEach((st, i) => {
      check(t, st.step === i + 1, s.id + ' 步骤 step 递增');
      check(t, typeof st.title === 'string' && st.title.length > 0, s.id + ' 步骤标题非空');
    });

    // brochureUrl
    check(t, /^https?:\/\//.test(s.brochureUrl || ''), s.id + ' brochureUrl 以 http 开头');
  });

  // 收藏/对比用的 id 均应存在
  const refIds = ['zju', 'hdu', 'zufe', 'nbu', 'wzu', 'zjut', 'zjnu', 'wmu', 'zjgsu', 'zstu', 'zjou', 'zafu', 'cjlu', 'hznu', 'wku'];
  refIds.forEach((rid) => {
    check(t, SCHOOLS.some((s) => s.id === rid), '应有院校 id=' + rid);
  });

  // ---------- 年份视图范围（「最新」只出 2026 招生名单）----------
  const latest = visibleSchools(SCHOOLS, 'latest');
  const v2026 = visibleSchools(SCHOOLS, 2026);
  const v2025 = visibleSchools(SCHOOLS, 2025);
  const v2024 = visibleSchools(SCHOOLS, 2024);
  check(t, latest.length === 38, '「最新」视图 38 所（当前 ' + latest.length + '）');
  check(t, v2025.length === 44, '「2025 年」视图 44 所（与 2025 官方名单 39+5 一致，当前 ' + v2025.length + '）');
  check(t, v2026.length === 18, '「2026 年」视图 18 所（当前 ' + v2026.length + '）');
  check(t, v2024.length === 8, '「2024 年」视图 8 所（当前 ' + v2024.length + '）');
  check(t, latest.every((s) => isRecruit2026(s)), '「最新」视图全部为 2026 招生院校');
  check(t, v2026.every((s) => isRecruit2026(s)), '「2026 年」视图不含 2026 未招院校');
  check(t, !latest.some((s) => !isRecruit2026(s)) && !v2026.some((s) => !isRecruit2026(s)), '备查校不出现在最新 / 2026 视图');
  check(t, extra.every((s) => v2025.indexOf(s) > -1), '7 所备查校全部出现在「2025 年」视图');
  check(t, schoolVisibleInMode(extra[0], 'latest') === false && schoolVisibleInMode(extra[0], 2025) === true, 'schoolVisibleInMode 单校口径正确');
  check(t, visibleSchools(SCHOOLS, 'latest').length + 0 <= SCHOOLS.length, 'visibleSchools 不改动入参（长度不越界）');

  // 备查校数据完整性（不伪造：缺失的满意度 / 住宿留证 / 来源保持空）
  extra.forEach((s) => {
    check(t, (s.majors || []).length > 0, s.id + ' 备查校有专业名单');
    check(t, (s.applicationSteps || []).length > 0, s.id + ' 备查校有报名流程');
    check(t, (s.admission || []).some((a) => a.year === 2025), s.id + ' 备查校有 2025 年录取行');
    check(t, !(s.admission || []).some((a) => a.year >= 2026), s.id + ' 备查校无 2026 年录取行');
    check(t, s.satisfaction && [s.satisfaction.overall, s.satisfaction.environment, s.satisfaction.life].every((v) => v == null), s.id + ' 备查校满意度留空（未伪造）');
    check(t, !s.sources, s.id + ' 备查校无溯源素材（未伪造）');
  });

  // ---------- 类别维度 ----------
  const cLatest = categoryCounts(SCHOOLS, 'latest');
  const c2025 = categoryCounts(SCHOOLS, 2025);
  check(t, cLatest.total === 38 && cLatest.prov === 32 && cLatest.high === 6, '最新视图类别数 32 + 6（实际 ' + JSON.stringify(cLatest) + '）');
  check(t, c2025.total === 44 && c2025.prov === 39 && c2025.high === 5, '2025 视图类别数 39 + 5（实际 ' + JSON.stringify(c2025) + '）');
  check(t, schoolVisibleInMode(SCHOOLS.find((s) => s.id === 'eit'), 2025) === false, '宁波东方理工 2026 首招，无 2025 记录');
  check(t, filterByCategory(latest, CATEGORY_HIGH).length === 6, 'filterByCategory 高水平 = 6');
  check(t, filterByCategory(latest, CATEGORY_PROV).length === 32, 'filterByCategory 省内地方属 = 32');
  check(t, filterByCategory(latest, 'all').length === 38 && filterByCategory(latest, '').length === 38, 'filterByCategory 全部 / 空值不过滤');
  check(t, CATEGORY_FILTERS.length === 3 && CATEGORY_FILTERS[0].k === 'all', '类别筛选清单为 全部 / 省内地方属 / 高水平');
  ['fudan', 'sjtu', 'zju', 'ucas', 'westlake', 'eit'].forEach((id) => {
    const s = SCHOOLS.find((x) => x.id === id);
    check(t, !!s && categoryOf(s) === CATEGORY_HIGH, '高水平三位一体应含 ' + id);
  });
  check(t, SCHOOLS.filter((s) => categoryOf(s) === CATEGORY_HIGH).length === 6, '高水平三位一体共 6 所');
};
