// 计算器测试：calcResult 与手工公式一致、reverseGk/reverseXs round-trip、filterSchools 筛选
const { extract } = require('./lib/extract.cjs');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('calculator: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}
function close(a, b, eps) { return Math.abs(a - b) < (eps || 0.01); }

module.exports = function run(t) {
  const { SCHOOLS, calcResult, reverseGk, reverseXs, filterSchools, calcXuekao, xuekaoTotal, SUBJECTS, schoolDataYear, hasCurrentData, schoolLine, majorLine, admissionRow } = extract();

  // 通用 10 科学考等级（全 B 基准）
  const grades = SUBJECTS.concat(['语文', '数学', '英语']).map((subject) => ({ subject, grade: 'B' }));

  // 1) calcResult 与手工公式一致（取 2 所不同权重院校）
  ['zjut', 'wku'].forEach((id) => {
    const s = SCHOOLS.find((x) => x.id === id);
    const gs = grades.map((g) => ({ subject: g.subject, grade: 'A' }));
    const xk = calcXuekao(gs, s.formula);
    const xs = 88, gk = 620;
    const xiaokaoFs = s.formula.xiaokao && s.formula.xiaokao.fullScore > 0 ? s.formula.xiaokao.fullScore : 100;
    const manual = (xk / s.formula.xuekao.fullScore * 100) * s.formula.weights.xuekao + (xs / xiaokaoFs * 100) * s.formula.weights.xiaokao + (gk / s.formula.gaokao.fullScore * 100) * s.formula.weights.gaokao;
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

  // 9) 数据年份：今年(2026)优先、去年(2025)回退
  {
    const zju = SCHOOLS.find((x) => x.id === 'zju');
    check(t, hasCurrentData(zju) === false, 'zju 视为今年未发布');
    check(t, schoolDataYear(zju) === 2025, 'zju 数据年份 = 2025');
    const sl = schoolLine(zju);
    check(t, !!sl && sl.year === 2025 && sl.isPrev === true, 'zju 校级线回退 2025 且标记 isPrev');
    check(t, zju.majors.length >= 3, 'zju 使用去年完整专业名单（' + zju.majors.length + ' 个）');
    const ml = majorLine(zju, zju.majors[0]);
    check(t, !!ml && ml.score === sl.score, 'zju 专业线回退到校级线');
  }
  {
    const zcmu = SCHOOLS.find((x) => x.id === 'zcmu');
    check(t, hasCurrentData(zcmu) === true, 'zcmu 视为今年已发布');
    check(t, schoolDataYear(zcmu) === 2026, 'zcmu 数据年份 = 2026');
    const sl = schoolLine(zcmu);
    check(t, !!sl && sl.year === 2026 && sl.isPrev === false, 'zcmu 校级线为 2026 且非回退');
  }
  // 所有「今年未发布」学校，回退年份必须有对应录取行
  SCHOOLS.filter((s) => !hasCurrentData(s)).forEach((s) => {
    check(t, !!admissionRow(s, schoolDataYear(s)), s.id + ' 回退年份有录取行');
  });

  // 10) xuekaoTotal：学考折算分合计与百分制折算分（未选/E 等/无折算院校 → null）
  {
    const zjut = SCHOOLS.find((x) => x.id === 'zjut'); // A=15,B=10,C=6,D=1，满分 150
    const gs = [{ subject: '语文', grade: 'A' }, { subject: '数学', grade: 'B' }];
    const t1 = xuekaoTotal(gs, zjut.formula);
    check(t, !!t1 && t1.sum === 25 && t1.fullScore === 150, 'zjut A+B 学考折算分合计=25/150（实际 ' + (t1 && t1.sum) + '）');
    check(t, !!t1 && close(t1.percent, 25 / 150 * 100), 'zjut 百分制折算分≈16.67（实际 ' + (t1 && t1.percent) + '）');
    check(t, !!t1 && t1.selected === 2, 'zjut 已选科目数=2');

    const t2 = xuekaoTotal([{ subject: '语文', grade: 'A' }, { subject: '数学', grade: 'E' }, { subject: '英语', grade: '' }], zjut.formula);
    check(t, !!t2 && t2.sum === 15 && t2.selected === 1, 'E 等与未选不计入合计（sum=' + (t2 && t2.sum) + '）');

    check(t, xuekaoTotal([{ subject: '语文', grade: '' }], zjut.formula) === null, '全部未选返回 null');
    check(t, xuekaoTotal(gs, null) === null, '无 formula 返回 null');
    const nyush = SCHOOLS.find((x) => x.id === 'nyush');
    check(t, xuekaoTotal(gs, nyush.formula) === null, '无学考折算院校返回 null');
  }
};
