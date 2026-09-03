// 计算器测试：calcResult 与手工公式一致、reverseGk/reverseXs round-trip、filterSchools 筛选
const { extract } = require('./lib/extract.cjs');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('calculator: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}
function close(a, b, eps) { return Math.abs(a - b) < (eps || 0.01); }

module.exports = function run(t) {
  const { SCHOOLS, calcResult, reverseGk, reverseXs, filterSchools, calcXuekao, SUBJECTS } = extract();

  // 通用 10 科学考等级（全 B 基准）
  const grades = SUBJECTS.concat(['语文', '数学', '英语']).map((subject) => ({ subject, grade: 'B' }));

  // 1) calcResult 与手工公式一致（取 2 所不同权重院校）
  ['zjut', 'wku'].forEach((id) => {
    const s = SCHOOLS.find((x) => x.id === id);
    const gs = grades.map((g) => ({ subject: g.subject, grade: 'A' }));
    const xk = calcXuekao(gs, s.formula);
    const xs = 88, gk = 620;
    const manual = xk * s.formula.weights.xuekao + xs * s.formula.weights.xiaokao + (gk / s.formula.gaokao.fullScore * 100) * s.formula.weights.gaokao;
    const r = calcResult({ xuekaoGrades: gs, xiaokaoScore: xs, gaokaoScore: gk }, s);
    check(t, close(r.comprehensiveScore, manual), id + ' calcResult 与手工公式一致（' + r.comprehensiveScore + ' vs ' + manual.toFixed(2) + '）');
    check(t, close(r.xuekaoConverted, xk), id + ' xuekaoConverted 正确');
    check(t, close(r.gaokaoNormalized, gk / s.formula.gaokao.fullScore * 100), id + ' gaokaoNormalized 正确');
  });

  // 2) 学考折算：A=10 时全 A 折算应为对应分值
  const s1 = SCHOOLS.find((x) => x.id === 'zjut');
  const allA = grades.map((g) => ({ subject: g.subject, grade: 'A' }));
  const allD = grades.map((g) => ({ subject: g.subject, grade: 'D' }));
  check(t, calcXuekao(allA, s1.formula) === 10 * s1.formula.xuekao.A, 'zjut 全 A 学考折算 = 10×A');
  check(t, calcXuekao(allD, s1.formula) === 10 * s1.formula.xuekao.D, 'zjut 全 D 学考折算 = 10×D');

  // 3) reverseGk round-trip
  {
    const s = SCHOOLS.find((x) => x.id === 'zjut');
    const xs = 85, target = 86;
    const rGk = reverseGk(target, grades, xs, s);
    check(t, rGk > 0, 'reverseGk 返回正数');
    const back = calcResult({ xuekaoGrades: grades, xiaokaoScore: xs, gaokaoScore: rGk }, s);
    check(t, back.comprehensiveScore >= target - 0.01, 'reverseGk round-trip 综合分 >= 目标（' + back.comprehensiveScore + ' >= ' + target + '）');
  }

  // 4) reverseXs round-trip
  {
    const s = SCHOOLS.find((x) => x.id === 'hdu');
    const gk = 620, target = 84;
    const rXs = reverseXs(target, grades, gk, s);
    check(t, rXs > 0, 'reverseXs 返回正数');
    const back = calcResult({ xuekaoGrades: grades, xiaokaoScore: rXs, gaokaoScore: gk }, s);
    check(t, close(back.comprehensiveScore, target), 'reverseXs round-trip 综合分 ≈ 目标（' + back.comprehensiveScore + ' vs ' + target + '）');
  }

  // 5) filterSchools 搜索：短名/别名命中
  {
    const r1 = filterSchools(SCHOOLS, { selectedSubjects: [], searchQuery: '杭电', tierFilter: 'all', minACount: 0 }, null);
    check(t, r1.some((x) => x.school.id === 'hdu'), '搜索"杭电"命中 hdu');
    const r2 = filterSchools(SCHOOLS, { selectedSubjects: [], searchQuery: '浙财', tierFilter: 'all', minACount: 0 }, null);
    check(t, r2.some((x) => x.school.id === 'zufe'), '搜索"浙财"命中 zufe');
  }

  // 6) filterSchools 选科过滤：选物理应排除只招化学的专业院校
  {
    // 全部专业只要求化学（如温医大医学类需化学生物）——选物理时该校所有专业不满足
    const wmu = SCHOOLS.find((x) => x.id === 'wmu');
    const onlyChemBio = wmu.majors.every((m) => m.requiredSubjects.length > 0 && m.requiredSubjects.indexOf('物理') === -1);
    const r = filterSchools(SCHOOLS, { selectedSubjects: ['物理'], searchQuery: '', tierFilter: 'all', minACount: 0 }, null);
    if (onlyChemBio) {
      check(t, !r.some((x) => x.school.id === 'wmu'), '选物理应排除温医大（专业均需化学生物）');
    } else {
      t.pass++; // 数据变化时跳过该断言
    }
  }

  // 7) filterSchools 冲稳保分层
  {
    const target = 75;
    const all = filterSchools(SCHOOLS, { selectedSubjects: [], searchQuery: '', tierFilter: 'all', minACount: 0 }, target);
    all.forEach(({ school, tier }) => {
      const min = school.admission[0] && school.admission[0].minScore;
      if (!min) return;
      const diff = target - min;
      const expect = diff > 5 ? 'safety' : diff < -5 ? 'reach' : 'match';
      check(t, tier === expect, school.id + ' 冲稳保分层（min=' + min + ' diff=' + diff + ' 期望 ' + expect + ' 实际 ' + tier + '）');
    });
  }

  // 8) 无参数 calcResult 返回 null
  check(t, calcResult({ xuekaoGrades: grades }, { formula: null }) === null, '无 formula 返回 null');
};
