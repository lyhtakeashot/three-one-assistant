// 开放数据导出测试：
//  1) 六张表结构与行数  2) CSV/MD 带 BOM、JSON 不带 BOM  3) UTF-8 编码字节
//  4) CRC32 已知向量 + ZIP 结构  5) 最低分口径与页面 schoolLine 完全一致
//  6) open-data/ 落盘内容与前端下载页构建结果一致（单一来源不漂移）
const fs = require('fs');
const path = require('path');
const { extract } = require('./lib/extract.cjs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'open-data');

function check(t, cond, msg) {
  if (cond) t.pass++;
  else { t.fail++; t.failures.push('export: ' + msg); process.stdout.write('  ✗ ' + msg + '\n'); }
}
function headBytes(file, n) {
  return Array.from(fs.readFileSync(path.join(OUT, file)).slice(0, n));
}
function hasBom(file) {
  const b = headBytes(file, 3);
  return b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF;
}
function u16le(bytes, off) { return bytes[off] | (bytes[off + 1] << 8); }
function u32le(bytes, off) { return (bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24)) >>> 0; }

module.exports = function run(t) {
  const app = extract();
  const S = app.SCHOOLS;

  // ---------- 1) 六张表结构与行数 ----------
  const tables = app.buildExportTables(S);
  const expectRows = { schools: 46, formulas: 46, majors: 621, admission: 53, examFormats: 46, applicationSteps: 201 };
  Object.keys(expectRows).forEach((k) => {
    const rows = tables[k];
    check(t, Array.isArray(rows) && rows.length === expectRows[k] + 1, k + ' 表行数为 ' + expectRows[k] + ' + 表头');
    check(t, Array.isArray(rows[0]) && rows[0].length > 0, k + ' 表含表头');
    const width = rows[0].length;
    check(t, rows.every((r) => r.length === width), k + ' 表所有行列数一致');
  });
  check(t, tables.schools[0].indexOf('最低综合分(原始)') > -1 && tables.schools[0].indexOf('最低综合分(百分制)') > -1 && tables.schools[0].indexOf('数据年份') > -1,
    '院校总览表含最低综合分双列与数据年份列');
  check(t, tables.schools[0].indexOf('2025') === -1, '院校总览表表头不再写死年份');

  // ---------- 2) 最低分口径与 schoolLine 一致 ----------
  const iName = tables.schools[0].indexOf('院校');
  const iRaw = tables.schools[0].indexOf('最低综合分(原始)');
  const iPct = tables.schools[0].indexOf('最低综合分(百分制)');
  const iYear = tables.schools[0].indexOf('数据年份');
  let lineChecked = 0;
  let mismatch = 0;
  for (let i = 1; i < tables.schools.length; i++) {
    const row = tables.schools[i];
    const school = S[i - 1];
    const line = app.schoolLine(school);
    if (!line || typeof line.score !== 'number') continue;
    lineChecked++;
    if (row[iRaw] !== line.score || row[iYear] !== line.year) mismatch++;
    const pct = app.toPercentScore(line.score, school);
    if ((pct == null ? '' : pct) !== row[iPct]) mismatch++;
  }
  check(t, lineChecked > 30, '至少 30 所院校有录取线可校验（实测 ' + lineChecked + '）');
  check(t, mismatch === 0, '导出口径与 schoolLine 完全一致（不一致 ' + mismatch + ' 处）');

  // 三所「admission[0] 年份与页面可能不一致」的院校，必须以 schoolLine 为准
  ['绍兴大学', '浙外', '宁财'].forEach((short) => {
    const idx = S.findIndex((s) => s.shortName === short);
    if (idx === -1) { check(t, false, '未找到院校 ' + short); return; }
    const line = app.schoolLine(S[idx]);
    const row = tables.schools[idx + 1];
    if (!line) {
      check(t, row[iRaw] === '' && row[iPct] === '' && row[iYear] === app.schoolDataYear(S[idx]), short + ' 无录取线时分数列留空、年份取 schoolDataYear');
      return;
    }
    check(t, row[iYear] === line.year && row[iRaw] === line.score, short + ' 导出年份/原始分取自 schoolLine');
  });

  // ---------- 3) 百分制换算 ----------
  check(t, app.scoreScaleMax(641, null) === 750, 'scoreScaleMax(641)=750');
  check(t, app.scoreScaleMax(80, null) === 100, 'scoreScaleMax(80)=100');
  check(t, app.toPercentScore(641, null) === 85.5, 'toPercentScore(641)=85.5');
  check(t, app.toPercentScore(66.822, null) === 66.8, 'toPercentScore(66.822)=66.8');
  check(t, app.toPercentScore(80, null) === 80, 'toPercentScore(80)=80（百分制原样）');
  check(t, app.toPercentScore(null, null) === null && app.toPercentScore('', null) === null, 'toPercentScore 空值返回 null');
  const custom = { formula: { gaokao: { fullScore: 900 } } };
  check(t, app.scoreScaleMax(450, custom) === 900 && app.toPercentScore(450, custom) === 50, '满量程取自该校高考满分（900 制）');

  // ---------- 4) UTF-8 编码 ----------
  const b = app.utf8Bytes('中文');
  check(t, b.length === 6 && b[0] === 0xE4 && b[1] === 0xB8 && b[2] === 0xAD && b[3] === 0xE6 && b[4] === 0x96 && b[5] === 0x87, 'utf8Bytes(中文) = E4B8AD E69687');
  check(t, app.utf8Bytes('ABC').length === 3, 'utf8Bytes(ASCII) 每字符 1 字节');
  const emoji = app.utf8Bytes('\uD83D\uDE00');
  check(t, emoji.length === 4 && emoji[0] === 0xF0 && emoji[1] === 0x9F, 'utf8Bytes 代理对被编码为 4 字节');
  const bomBytes = app.utf8Bytes('\uFEFF');
  check(t, bomBytes.length === 3 && bomBytes[0] === 0xEF && bomBytes[1] === 0xBB && bomBytes[2] === 0xBF, 'BOM 字符编码为 EF BB BF');

  // ---------- 5) CRC32 / ZIP ----------
  check(t, app.crc32(app.utf8Bytes('123456789')) === 3421780262, 'crc32 标准向量 3421780262');
  check(t, app.crc32(new Uint8Array(0)) === 0, 'crc32 空输入 = 0');

  const ziFiles = [{ name: 'a.txt', content: 'hello 中文' }, { name: 'b/c.csv', content: 'x,y\n1,2\n' }];
  const zip = app.zipStore(ziFiles, new Date(2026, 8, 11, 12, 0, 0));
  check(t, zip[0] === 0x50 && zip[1] === 0x4B && zip[2] === 0x03 && zip[3] === 0x04, 'ZIP 以 local file header 签名 PK\\x03\\x04 开头');
  const eocdOff = zip.length - 22;
  check(t, u32le(zip, eocdOff) === 0x06054B50, 'ZIP 以 EOCD 签名结尾');
  check(t, u16le(zip, eocdOff + 8) === 2 && u16le(zip, eocdOff + 10) === 2, 'ZIP 中央目录条目数 = 2');
  check(t, u32le(zip, eocdOff + 12) + u32le(zip, eocdOff + 16) === zip.length - 22, 'ZIP 中央目录大小 + 偏移 与 EOCD 一致');
  // 逐条 CRC 校验：从 local header 取出 crc 与文件名，重算
  let zOff = 0;
  let crcOk = true;
  ziFiles.forEach((f) => {
    if (u32le(zip, zOff) !== 0x04034B50) crcOk = false;
    const storedCrc = u32le(zip, zOff + 14);
    const size = u32le(zip, zOff + 18);
    const nameLen = u16le(zip, zOff + 26);
    const extraLen = u16le(zip, zOff + 28);
    const data = zip.slice(zOff + 30 + nameLen + extraLen, zOff + 30 + nameLen + extraLen + size);
    if (app.crc32(Array.prototype.slice.call(data)) !== storedCrc) crcOk = false;
    zOff = zOff + 30 + nameLen + extraLen + size;
  });
  check(t, crcOk, 'ZIP 每个条目的 CRC32 与实际数据一致');

  // ---------- 6) 文件构建与 BOM 策略 ----------
  const files = app.buildOpenDataFiles(S);
  check(t, files.version === app.OPEN_DATA_VERSION && files.count === S.length, '数据包版本与院校数正确');
  check(t, files.json.name === 'schools.json', 'JSON 文件名为 schools.json');
  check(t, files.csv.length === 6, 'CSV 为 6 个文件');
  check(t, files.csv.map((c) => c.name).join(',') === app.OPEN_DATA_FILES.csv.join(','), 'CSV 文件名与清单一致');
  check(t, files.csv[0].content.charCodeAt(0) === 0xFEFF, 'CSV 内容以 BOM 开头');
  check(t, files.md.content.charCodeAt(0) === 0xFEFF, 'MD 内容以 BOM 开头');
  check(t, files.readme.content.charCodeAt(0) === 0xFEFF, 'README 内容以 BOM 开头');
  check(t, files.json.content.charCodeAt(0) === 0x7B, 'JSON 内容以 { 开头（无 BOM，保证可解析）');
  check(t, (() => { try { JSON.parse(files.json.content.replace(/^\uFEFF/, '')); return true; } catch (e) { return false; } })(), 'JSON 内容可被 JSON.parse');
  check(t, files.csv[0].content.indexOf('\r\n') > -1, 'CSV 使用 CRLF 换行（Excel 友好）');
  check(t, files.md.content.indexOf('## 院校总览') > -1 && files.md.content.indexOf('## 报名流程') > -1, 'MD 含六张表的章节');
  check(t, files.readme.content.indexOf('schools.csv') > -1 && files.readme.content.indexOf('application-steps.csv') > -1, 'README 列出 CSV 文件说明');

  const zips = app.buildOpenDataZips(S);
  check(t, zips.length === 3, '按格式生成 3 个 zip');
  check(t, zips.every((z) => z.bytes && z.bytes.length > 100 && z.bytes[0] === 0x50), '3 个 zip 均为有效字节流');
  check(t, zips.every((z) => u32le(z.bytes, z.bytes.length - 22) === 0x06054B50), '3 个 zip 均以 EOCD 签名结尾');
  check(t, u16le(zips[0].bytes, zips[0].bytes.length - 22 + 10) === 2, 'JSON 包 2 个条目（schools.json + README）');
  check(t, u16le(zips[1].bytes, zips[1].bytes.length - 22 + 10) === 7, 'CSV 包 7 个条目（6 个 CSV + README）');
  check(t, u16le(zips[2].bytes, zips[2].bytes.length - 22 + 10) === 2, 'MD 包 2 个条目（schools.md + README）');
  check(t, zips.map((z) => z.key).join(',') === 'json,csv,md', 'zip 键顺序为 json/csv/md');
  check(t, zips.every((z) => z.name.indexOf(z.key + '-' + app.OPEN_DATA_VERSION) > -1), 'zip 文件名含格式键与版本号');

  // ---------- 7) open-data/ 落盘与内存构建一致 ----------
  [...app.OPEN_DATA_FILES.json, ...app.OPEN_DATA_FILES.csv, ...app.OPEN_DATA_FILES.md, 'README.md'].forEach((f) => {
    check(t, fs.existsSync(path.join(OUT, f)), 'open-data/' + f + ' 存在');
  });
  app.OPEN_DATA_FILES.csv.concat([app.OPEN_DATA_FILES.md[0], 'README.md']).forEach((f) => {
    check(t, hasBom(f), 'open-data/' + f + ' 首字节为 UTF-8 BOM');
  });
  check(t, !hasBom(app.OPEN_DATA_FILES.json[0]), 'open-data/schools.json 无 BOM');
  check(t, fs.readFileSync(path.join(OUT, 'schools.csv'), 'utf8') === files.csv[0].content, 'open-data/schools.csv 与前端构建内容逐字一致');
  check(t, fs.readFileSync(path.join(OUT, 'schools.md'), 'utf8') === files.md.content, 'open-data/schools.md 与前端构建内容逐字一致');
  check(t, fs.readFileSync(path.join(OUT, 'schools.json'), 'utf8') === files.json.content, 'open-data/schools.json 与前端构建内容逐字一致');
};
