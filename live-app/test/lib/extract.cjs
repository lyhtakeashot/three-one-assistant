// 从 index.html 提取 SCHOOLS 与 utils 函数（vm 隔离执行，不污染测试进程）
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = path.join(__dirname, '..', '..', 'index.html');

// 注入的 localStorage 桩（供 Lget/Lset 定义与调用）
function makeStore() {
  const store = {};
  return {
    localStorage: {
      getItem: (k) => (store[k] !== undefined ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    },
  };
}

// 提取 `var SCHOOLS=[` 到 `// === Components` 之间的全部代码（数据 + utils + storage + api）
function extractAppCode() {
  const html = fs.readFileSync(HTML, 'utf8');
  const scriptStart = html.indexOf('<script>');
  const scriptEnd = html.lastIndexOf('</script>');
  if (scriptStart === -1 || scriptEnd === -1) throw new Error('index.html 缺少 <script> 块');
  const code = html.substring(scriptStart + 8, scriptEnd);

  const startMark = 'var SCHOOLS=[';
  const endMark = '// === Components';
  const start = code.indexOf(startMark);
  const end = code.indexOf(endMark);
  if (start === -1) throw new Error('未找到 var SCHOOLS=[');
  if (end === -1) throw new Error('未找到 // === Components');
  return code.substring(start, end);
}

// 返回 { SCHOOLS, SUBJECTS, FAQ_DATA, ENCOURAGE_DATA, calcResult, reverseGk, reverseXs, filterSchools, calcXuekao, extractTuitionNum }
function extract() {
  const code = extractAppCode();
  const sandbox = makeStore();
  vm.createContext(sandbox);
  try {
    vm.runInContext(code, sandbox, { timeout: 5000 });
  } catch (e) {
    throw new Error('提取代码执行失败: ' + e.message);
  }
  return {
    SCHOOLS: sandbox.SCHOOLS,
    SUBJECTS: sandbox.SUBJECTS,
    FAQ_DATA: sandbox.FAQ_DATA,
    ENCOURAGE_DATA: sandbox.ENCOURAGE_DATA,
    calcResult: sandbox.calcResult,
    reverseGk: sandbox.reverseGk,
    reverseXs: sandbox.reverseXs,
    filterSchools: sandbox.filterSchools,
    calcXuekao: sandbox.calcXuekao,
    extractTuitionNum: sandbox.extractTuitionNum,
  };
}

module.exports = { extract, makeStore };
