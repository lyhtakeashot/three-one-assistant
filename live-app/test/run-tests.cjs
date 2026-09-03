// 测试统一入口：node test/run-tests.cjs [可选: 指定测试文件名前缀]
// 用法示例：
//   node test/run-tests.cjs              # 运行全部测试
//   node test/run-tests.cjs api          # 仅运行 api.test.cjs
const path = require('path');

const FILES = ['data', 'calculator', 'html', 'render', 'api', 'cf-pure'];
const filterArg = process.argv[2];

function createT() {
  return { pass: 0, fail: 0, failures: [] };
}

async function runFile(file) {
  const t = createT();
  process.stdout.write('=== ' + file + '.test.cjs ===\n');
  const mod = require(path.join(__dirname, file + '.test.cjs'));
  const fn = mod.run || mod;
  try {
    await fn(t);
  } catch (e) {
    t.fail++;
    t.failures.push('FATAL in ' + file + ': ' + e.message);
  }
  process.stdout.write('    ' + t.pass + ' passed, ' + t.fail + ' failed\n');
  return t;
}

(async () => {
  const files = filterArg
    ? FILES.filter((f) => f.indexOf(filterArg) === 0 || f === filterArg)
    : FILES;

  if (files.length === 0) {
    process.stderr.write('未找到匹配的测试: ' + filterArg + '\n');
    process.exit(1);
  }

  process.stdout.write('三位一体辅助系统 · 测试套件\n============================\n');
  const total = { pass: 0, fail: 0, failures: [] };
  for (const f of files) {
    const t = await runFile(f);
    total.pass += t.pass;
    total.fail += t.fail;
    total.failures = total.failures.concat(t.failures);
  }

  process.stdout.write('============================\n');
  process.stdout.write('合计: ' + total.pass + ' passed, ' + total.fail + ' failed\n');
  if (total.failures.length > 0) {
    process.stdout.write('失败明细:\n');
    total.failures.forEach((msg) => process.stdout.write('  ✗ ' + msg + '\n'));
  }
  process.exit(total.fail > 0 ? 1 : 0);
})();
