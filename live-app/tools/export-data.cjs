// 开放数据包导出脚本：复用 index.html 切片区的导出纯函数（与前端下载页唯一来源）
// 用法：node tools/export-data.cjs
// 产出 open-data/：schools.json + 6 个 CSV + schools.md + README.md
//   CSV / MD / README 一律带 UTF-8 BOM（Excel / WPS 打开不乱码）；JSON 不带 BOM（保证 JSON.parse 可用）
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'open-data');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// ---- 与 test/lib/extract.cjs 同机制：提取切片区间（数据 + Utils + 导出纯函数）----
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
if (scriptStart === -1 || scriptEnd === -1) {
  console.error('ERROR: index.html 缺少 <script> 块');
  process.exit(1);
}
const code = html.substring(scriptStart + 8, scriptEnd);
const startMark = 'var SCHOOLS=[';
const endMark = '// === Components';
const start = code.indexOf(startMark);
const end = code.indexOf(endMark);
if (start === -1) { console.error('ERROR: 未找到 var SCHOOLS=['); process.exit(1); }
if (end === -1) { console.error('ERROR: 未找到 // === Components'); process.exit(1); }

// localStorage 桩（与前端/extract 沙箱保持一致）
const store = {};
const sandbox = {
  localStorage: {
    getItem: (k) => (store[k] !== undefined ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  },
};
vm.createContext(sandbox);
try {
  vm.runInContext(code.substring(start, end), sandbox, { timeout: 10000 });
} catch (e) {
  console.error('ERROR: 切片区执行失败: ' + e.message);
  process.exit(1);
}

const SCHOOLS = sandbox.SCHOOLS;
const buildOpenDataFiles = sandbox.buildOpenDataFiles;
if (!Array.isArray(SCHOOLS) || SCHOOLS.length === 0) {
  console.error('ERROR: SCHOOLS 提取失败');
  process.exit(1);
}
if (typeof buildOpenDataFiles !== 'function') {
  console.error('ERROR: buildOpenDataFiles 未定义（切片区未包含导出纯函数）');
  process.exit(1);
}

const files = buildOpenDataFiles(SCHOOLS);
console.log('Extracted ' + SCHOOLS.length + ' schools');

// ---- 写盘 ----
fs.mkdirSync(OUT, { recursive: true });
const written = [];
function writeOut(name, content) {
  const bytes = Buffer.from(content, 'utf8');
  fs.writeFileSync(path.join(OUT, name), bytes);
  written.push([name, bytes.length]);
}
writeOut(files.json.name, files.json.content);          // JSON：无 BOM
files.csv.forEach((f) => writeOut(f.name, f.content)); // CSV：含 BOM
writeOut(files.md.name, files.md.content);              // MD：含 BOM
writeOut(files.readme.name, files.readme.content);      // README：含 BOM

// ---- 自校验（编码 + 行数），失败即非零退出 ----
const BOM = [0xEF, 0xBB, 0xBF];
function firstBytes(file, n) {
  return Array.from(fs.readFileSync(path.join(OUT, file)).slice(0, n));
}
function hasBom(file) {
  const b = firstBytes(file, 3);
  return b[0] === BOM[0] && b[1] === BOM[1] && b[2] === BOM[2];
}
let failed = false;
function assert(cond, msg) {
  if (!cond) { failed = true; console.error('  ✗ ' + msg); }
}
const textFiles = files.csv.map((f) => f.name).concat([files.md.name, files.readme.name]);
textFiles.forEach((n) => assert(hasBom(n), n + ' 缺少 UTF-8 BOM'));
assert(!hasBom(files.json.name), files.json.name + ' 不应包含 BOM');
written.forEach((w) => assert(fs.existsSync(path.join(OUT, w[0])), w[1] !== undefined ? w[0] + ' 已写入' : w[0]));

console.log('Generated open-data/ (' + files.version + ' · ' + files.count + ' schools):');
written.forEach((w) => console.log('  ' + w[0].padEnd(24) + ' ' + w[1] + ' bytes'));
const t = files.tables;
[['schools', t.schools], ['formulas', t.formulas], ['majors', t.majors], ['admission', t.admission], ['exam-formats', t.examFormats], ['application-steps', t.applicationSteps]]
  .forEach((row) => console.log('  table ' + row[0].padEnd(20) + ' ' + (row[1].length - 1) + ' rows'));

if (failed) { console.error('ERROR: open-data 自校验未通过'); process.exit(1); }
console.log('DONE');
