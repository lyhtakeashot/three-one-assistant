// 数据完整性测试：院校字段、URL、满意度范围、学考折算递减、权重和=1
// 规则分级：标准折算院校执行严格校验；综合评价/特殊折算院校放宽（折算口径与比例不同），
// 但结构性字段（id/名称/专业/流程/链接等）仍严格校验。可空字段允许为 null（前端渲染「暂无」）。
const { extract } = require('./lib/extract.cjs');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('data: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}

// 标准三一折算：学考有实际 A 分值，且学考/高考权重均为正
function isStandardFormula(f) {
  return !!(f && f.xuekao && f.xuekao.A > 0 && f.weights && f.weights.xuekao > 0 && f.weights.gaokao > 0);
}

module.exports = function run(t) {
  const { SCHOOLS, SUBJECTS } = extract();

  // 院校数量（46 所 = 省内地方属 32 + 高水平 6 + 综合评评价 8）
  check(t, SCHOOLS.length >= 46, '院校数量应 >= 46（当前 ' + SCHOOLS.length + '）');

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
          // 标准院校最低分应为百分制；>100 的非百分制口径须有 formulaNote 说明（如综合评价 631 模式）
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
};
