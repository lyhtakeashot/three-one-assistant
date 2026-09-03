// 数据包导出脚本：从 index.html 提取 SCHOOLS，生成 open-data/ 三格式数据 + README
// 用法：node tools/export-data.cjs
const fs=require('fs'),path=require('path'),vm=require('vm');

const ROOT=path.join(__dirname,'..');
const OUT=path.join(ROOT,'open-data');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');

// 提取 SCHOOLS 数组声明
const start=html.indexOf('var SCHOOLS=[');
if(start===-1){console.error('ERROR: SCHOOLS not found in index.html');process.exit(1);}
let depth=0,end=-1;
for(let i=start;i<html.length;i++){
  const c=html[i];
  if(c==='[')depth++;
  if(c===']'){depth--;if(depth===0){end=i+1;break;}}
}
if(end===-1){console.error('ERROR: unbalanced SCHOOLS array');process.exit(1);}
const schoolsSrc=html.substring(start,end)+';';

// 在隔离 VM 中执行获得数组
const sandbox={};
vm.createContext(sandbox);
vm.runInContext(schoolsSrc,sandbox);
const SCHOOLS=sandbox.SCHOOLS;
console.log('Extracted',SCHOOLS.length,'schools');

const dataDate='2026年3月',dataVersion='v1.0.0';

// ---------- JSON ----------
const json=JSON.stringify({version:dataVersion,updatedAt:dataDate,count:SCHOOLS.length,schools:SCHOOLS},null,2);

// ---------- CSV ----------
function csvCell(v){
  const s=String(v==null?'':v);
  return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
}
const csvRows=[['院校','简称','类型','校区','学费','2025最低分','综合满意度','环境满意度','生活满意度','官网','招生简章']];
SCHOOLS.forEach(s=>{
  csvRows.push([s.name,s.shortName,s.type==='ministry'?'部属':'省属',(s.info.campuses[0]||{}).name||'',s.info.tuitionGeneral,(s.admission[0]&&s.admission[0].minScore)||'',s.satisfaction.overall,s.satisfaction.environment,s.satisfaction.life,s.info.website,s.brochureUrl||'']);
});
const csv=csvRows.map(r=>r.map(csvCell).join(',')).join('\n');

// ---------- Markdown ----------
let md='# 浙江三位一体院校开放数据\n\n';
md+='> 版本：'+dataVersion+' ｜ 更新时间：'+dataDate+' ｜ 院校数：'+SCHOOLS.length+' 所\n\n';
md+='## 数据说明\n\n本数据包整理自浙江省教育考试院、各高校招生网与阳光高考网，供报考参考与二次分析。\n\n';
md+='## 院校一览\n\n| 院校 | 简称 | 类型 | 校区 | 学费 | 2025最低录取分 | 综合满意度 |\n|---|---|---|---|---|---|---|\n';
SCHOOLS.forEach(s=>{
  md+='| '+s.name+' | '+s.shortName+' | '+(s.type==='ministry'?'部属':'省属')+' | '+((s.info.campuses[0]||{}).name||'')+' | '+s.info.tuitionGeneral+' | '+((s.admission[0]&&s.admission[0].minScore)||'-')+' | '+s.satisfaction.overall+' |\n';
});
md+='\n## 字段说明\n\n';
md+='- **学考折算**：各校 A/B/C/D 等级分值不同，综合分 = 学考折算×权重 + 校测×权重 + 高考折算×权重\n';
md+='- **校测**：笔试科目与面试形式（个面/群面）因校而异\n';
md+='- **满意度**：来自阳光高考网在校生投票，满分 5.0\n';
md+='- **转专业限制**：部分院校对三位一体录取考生有转专业限制\n';
md+='- **招生简章**：各校官方最新招生简章链接\n\n';
md+='## 数据来源\n\n浙江省教育考试院、各高校招生网、阳光高考网。请以官方最新公告为准。\n';

// ---------- README ----------
let readme='# 三位一体辅助系统 · 开放数据包\n\n';
readme+='本目录为浙江省三位一体院校数据的开放数据包，随应用版本同步更新。\n\n';
readme+='## 文件说明\n\n';
readme+='| 文件 | 说明 |\n|---|---|\n';
readme+='| schools.json | 完整结构化数据（15 所院校全字段），适合程序化使用 |\n';
readme+='| schools.csv | 核心字段表格，Excel / WPS 可直接打开 |\n';
readme+='| schools.md | 人类可读数据文档 |\n\n';
readme+='## 数据维度\n\n';
readme+='院校名称、校区地址、学费区间、学考折算规则、校测形式、招生专业与选科要求、历年报名/入围/录取数据、综合满意度（综合/环境/生活）、转专业限制、报名流程与材料、招生简章链接。\n\n';
readme+='## 数据来源\n\n浙江省教育考试院、各高校招生网、阳光高考网。\n\n';
readme+='## GitHub 上传指引\n\n';
readme+='将本数据包推送至你的 GitHub 仓库，步骤如下：\n\n';
readme+='```bash\n';
readme+='# 1. 进入项目目录\n';
readme+='cd 你的项目目录\n\n';
readme+='# 2. 初始化仓库（若尚未初始化）\n';
readme+='git init\n\n';
readme+='# 3. 添加数据包文件\n';
readme+='git add open-data/\n\n';
readme+='# 4. 提交\n';
readme+='git commit -m "feat: 更新开放数据包 v1.0.0"\n\n';
readme+='# 5. 关联远程仓库（替换为你的仓库地址）\n';
readme+='git remote add origin https://github.com/你的用户名/你的仓库.git\n\n';
readme+='# 6. 推送\n';
readme+='git push -u origin main\n';
readme+='```\n\n';
readme+='> 提示：推送到 GitHub 后，可在应用内"开放数据"页填入仓库地址，方便用户直接访问。\n';

fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'schools.json'),json,'utf8');
fs.writeFileSync(path.join(OUT,'schools.csv'),csv,'utf8');
fs.writeFileSync(path.join(OUT,'schools.md'),md,'utf8');
fs.writeFileSync(path.join(OUT,'README.md'),readme,'utf8');
console.log('Generated open-data/:');
console.log('  schools.json  '+json.length+' bytes');
console.log('  schools.csv   '+csv.length+' bytes');
console.log('  schools.md    '+md.length+' bytes');
console.log('  README.md     '+readme.length+' bytes');
console.log('DONE');
