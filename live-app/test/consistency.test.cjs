// 一致性自检：录取计数字段必须与 note 出处说明一致（界面上每个数，note 里都有出处）
const { extract } = require('./lib/extract.cjs');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('consistency: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}

module.exports = function run(t) {
  const { SCHOOLS } = extract();
  const FIELDS = ['applicants', 'passed', 'admitted'];

  SCHOOLS.forEach((s) => {
    (s.admission || []).forEach((a) => {
      const tag = s.name + ' ' + a.year;
      const note = a.note || '';

      // note 声明某字段「置空」，该字段必须为 null。
      // 「applicants/passed置空」是 passed 尚装初审数时的历史口径，只约束 applicants；
      // 入围数另有「入围/finalPassed」说明，故排除紧跟在 / 后的 passed。
      const re = /(?<![\/A-Za-z])(applicants|passed|admitted)\s*置空/g;
      let m;
      while ((m = re.exec(note))) {
        check(t, a[m[1]] == null, tag + ' note 声明 ' + m[1] + ' 置空，实际为 ' + a[m[1]]);
      }
      if (/均置空/.test(note)) {
        FIELDS.forEach((k) => check(t, a[k] == null, tag + ' note 声明均置空，' + k + ' 非空'));
      }

      FIELDS.forEach((k) => {
        if (a[k] != null) {
          check(t, note.indexOf(String(a[k])) > -1, tag + ' ' + k + '=' + a[k] + ' 未在 note 中逐字找到出处');
        }
      });

      if (a.minScore != null) {
        check(t, !!a.sourceUrl, tag + ' minScore 有值但缺 sourceUrl');
        check(t, a.minScore !== 0, tag + ' minScore 不得为 0');
      }

      if (a.passed != null) {
        check(t, note.indexOf('入围') > -1, tag + ' passed 有值但 note 无「入围」（疑似初审数）');
      }
    });
  });

  // 首页「数据可核实」演示卡的随机池底线：足够多的院校可一键直达章程原文，且全部走 https
  const withFormulaSrc = SCHOOLS.filter((s) => s.formulaSource && s.formulaSource.url);
  check(t, withFormulaSrc.length >= 40, 'formulaSource.url 非空的院校数 ' + withFormulaSrc.length + ' < 40');
  withFormulaSrc.forEach((s) => {
    check(t, s.formulaSource.url.indexOf('https://') === 0, s.name + ' formulaSource.url 未以 https:// 开头: ' + s.formulaSource.url);
  });
};