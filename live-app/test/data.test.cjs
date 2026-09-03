// 数据完整性测试：院校字段、URL、满意度范围、学考折算递减、权重和=1
const { extract } = require('./lib/extract.cjs');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('data: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}

module.exports = function run(t) {
  const { SCHOOLS, SUBJECTS } = extract();

  // 院校数量
  check(t, SCHOOLS.length >= 15, '院校数量应 >= 15（当前 ' + SCHOOLS.length + '）');

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
    if (f.weights) {
      const sum = (f.weights.xuekao || 0) + (f.weights.xiaokao || 0) + (f.weights.gaokao || 0);
      check(t, Math.abs(sum - 1) < 0.001, s.id + ' weights 之和 = 1（实际 ' + sum.toFixed(3) + '）');
      check(t, f.weights.xuekao > 0 && f.weights.gaokao > 0, s.id + ' weights 均 > 0');
    }
    if (f.xuekao) {
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
      m.requiredSubjects.forEach((sub) => {
        check(t, SUBJECTS.indexOf(sub) > -1, s.id + ' ' + m.name + ' 选科 ' + sub + ' 合法');
      });
    });

    // admission
    if (Array.isArray(s.admission) && s.admission.length > 0) {
      s.admission.forEach((a) => {
        check(t, a.minScore >= 0 && a.minScore <= 100, s.id + ' minScore 在 0-100（' + a.minScore + '）');
        check(t, a.applicants > 0 && a.admitted > 0, s.id + ' 报名/录取人数 > 0');
      });
    }

    // satisfaction
    const sat = s.satisfaction || {};
    [sat.overall, sat.environment, sat.life].forEach((v) => {
      check(t, typeof v === 'number' && v >= 0 && v <= 5, s.id + ' 满意度在 0-5');
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
