// 一键推送脚本：init → add → commit → branch → remote → push
const { execSync } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const REPO_URL = 'https://github.com/lyhtakeashot/three-one-assistant.git';

function run(cmd, cwd) {
  console.log('> ' + cmd);
  try {
    const out = execSync(cmd, { cwd: cwd || ROOT, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
    if (out) console.log(out.trim());
  } catch (e) {
    const msg = (e.stdout || '') + (e.stderr || '') || e.message;
    console.log(msg.split('\n').slice(0, 8).join('\n'));
  }
}

// 检查是否已是 git 仓库
let isRepo = false;
try { execSync('git rev-parse --is-inside-work-tree', { cwd: ROOT, encoding: 'utf8' }); isRepo = true; } catch (e) {}

if (!isRepo) {
  run('git init');
} else {
  console.log('已是 git 仓库，跳过 init');
}

run('git add .');
run('git commit -m "feat: 三位一体辅助系统 v1.0（院校/计算器/树洞/开放数据 + PWA）"');
run('git branch -M main');

// 检查 remote
let hasRemote = false;
try {
  const remotes = execSync('git remote', { cwd: ROOT, encoding: 'utf8' });
  hasRemote = remotes.includes('origin');
} catch (e) {}

if (!hasRemote) {
  run('git remote add origin ' + REPO_URL);
} else {
  run('git remote set-url origin ' + REPO_URL);
}

run('git push -u origin main');
console.log('\n完成！');
