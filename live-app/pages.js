import React, { useState, useMemo } from 'react';
import { SCHOOLS, SUBJECTS, FAQ_DATA } from './data.js';
import { filterSchools, calcComprehensive, reverseCalcGaokao, reverseCalcXiaokao } from './utils.js';

function HeartIcon(props) {
  return React.createElement('svg', {width:props.size||18,height:props.size||18,viewBox:'0 0 24 24',fill:props.fill||'none',stroke:props.stroke||'currentColor',strokeWidth:2},
    React.createElement('path',{d:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'})
  );
}

function LS_get(k) { try { return JSON.parse(localStorage.getItem('3in1_'+k)); } catch(e) { return null; } }
function LS_set(k, v) { localStorage.setItem('3in1_'+k, JSON.stringify(v)); }

// ===== HomePage =====
export function HomePage(props) {
  var cards = [
    {l:'院校筛选',d:'按选科和学考条件查找',p:'schools'},
    {l:'综合分计算',d:'正算反算都支持',p:'calculator'},
    {l:'我的档案',d:'收藏院校与时间管理',p:'profile'}
  ];
  var steps = [
    {step:'01',title:'学考报名',desc:'查看各校学考等级要求，选择符合条件的目标院校，准备报名材料。学考等级越高，选择越多。',color:'#3B82F6'},
    {step:'02',title:'校测考核',desc:'参加目标院校的综合素质测试（笔试+面试）。校测成绩占比25%，是区分度的关键环节。',color:'#F59E0B'},
    {step:'03',title:'高考录取',desc:'高考后综合分排名录取。注意：提前批只能填报一所三位一体院校，选稳不选冲！',color:'#16A34A'}
  ];

  return React.createElement('div', {className:'animate-fade-in'},
    React.createElement('section', {className:'hero-bg py16 px4 text-center'},
      React.createElement('h1', {className:'text-3xl font-bold text-s8 mb4'}, '三位一体，不止一条路'),
      React.createElement('p', {className:'text-s5 text-base max-w-md mx-auto mb8'}, '学考成绩 + 校测表现 + 高考分数，三个维度综合录取。帮你找到最适合的三一院校，制定最优报考策略。'),
      React.createElement('div', {className:'grid sm:g3 gap4 max-w-lg mx-auto'},
        cards.map(function(c) {
          return React.createElement('button', {
            key: c.p, onClick: function(){props.setPage(c.p)},
            className: 'card card-hover p6 flex flex-col items-center text-center'
          }, React.createElement('span', {className:'text-2xl mb2'}, c.l === '院校筛选' ? '🔍' : c.l === '综合分计算' ? '🧮' : '📋'),
             React.createElement('h3', {className:'font-semibold text-s8 mb1'}, c.l),
             React.createElement('p', {className:'text-xs text-s4'}, c.d));
        })
      )
    ),
    React.createElement('section', {className:'max-w-lg mx-auto px4 py16'},
      React.createElement('h2', {className:'text-2xl font-bold text-center text-s8 mb2'}, '三位一体录取流程'),
      React.createElement('p', {className:'text-sm text-s4 text-center mb8'}, '三步走，每一步都关键'),
      React.createElement('div', {className:'grid md:g3 gap6'},
        steps.map(function(item, i) {
          return React.createElement('div', {key:i, className:'card p6 text-center'},
            React.createElement('span', {className:'inline-block w-12 h-12 rounded-full text-w font-bold text-lg mb4', style:{background:item.color,lineHeight:'48px'}}, item.step),
            React.createElement('h3', {className:'font-semibold text-s8 mb2'}, item.title),
            React.createElement('p', {className:'text-sm text-s5 leading-relaxed'}, item.desc)
          );
        })
      )
    ),
    React.createElement('section', {className:'max-w-lg mx-auto px4 pb16'},
      React.createElement('div', {className:'card bg-y50 border border-y100 p5 flex items-start gap3'},
        React.createElement('span', {className:'text-xl'}, '⚠️'),
        React.createElement('div', null,
          React.createElement('h3', {className:'font-semibold text-y mb2'}, '重要提醒：提前批只能报一所'),
          React.createElement('p', {className:'text-sm leading-relaxed'}, '省属三位一体在高考提前批录取，每位考生只能填报一所院校的一志愿。一旦被三一录取，将不再参与后续普通批次录取。')
        )
      )
    )
  );
}

// ===== SchoolListPage =====
export function SchoolListPage(props) {
  var [favs, setFavs] = useState(function() { return LS_get('favs') || []; });
  var [showFilter, setShowFilter] = useState(false);
  var [filter, setFilter] = useState({selectedSubjects:[],minACount:0,minBCount:0,searchQuery:'',tierFilter:'all',categoryFilter:null});
  var [userScore, setUserScore] = useState('');

  var results = useMemo(function() {
    return filterSchools(SCHOOLS, filter, userScore ? Number(userScore) : undefined);
  }, [filter, userScore]);

  var toggleFav = function(id) {
    var u = favs.indexOf(id) !== -1 ? favs.filter(function(x) { return x !== id; }) : favs.concat([id]);
    setFavs(u); LS_set('favs', u);
  };

  var el = function(tag, cls, children) { return React.createElement(tag, {className:cls}, children); };

  return React.createElement('div', {className:'max-w-2xl mx-auto px4 py6 pb-safe animate-fade-in'},
    // Search
    React.createElement('div', {className:'relative mb4'},
      React.createElement('input', {type:'text',placeholder:'搜索院校，如"杭电"、"浙财"...', value:filter.searchQuery,
        onChange:function(e){setFilter(Object.assign({},filter,{searchQuery:e.target.value}))},
        className:'input', style:{paddingLeft:16,paddingRight:40}
      }),
      React.createElement('button', {onClick:function(){setShowFilter(!showFilter)},
        className:'absolute right2 top-half text-s4', style:{transform:'translateY(-50%)'}},
        '🔽')
    ),
    // Filter
    showFilter ? React.createElement('div', {className:'card p4 mb4 animate-slide-up'},
      React.createElement('div', {className:'mb3'},
        React.createElement('label', {className:'text-xs font-medium text-s5 mb2 block'}, '选科筛选'),
        React.createElement('div', {className:'flex flex-wrap gap2'},
          SUBJECTS.map(function(s) {
            var selected = filter.selectedSubjects.indexOf(s) !== -1;
            return React.createElement('button', {
              key: s,
              onClick: function() {
                var u = selected ? filter.selectedSubjects.filter(function(x){return x!==s}) : filter.selectedSubjects.concat([s]);
                setFilter(Object.assign({},filter,{selectedSubjects:u}));
              },
              className: 'px3 py15 rounded-lg text-sm font-medium transition-all ' + (selected ? 'bg-p500 text-w' : 'bg-s1 text-s5')
            }, s);
          })
        )
      ),
      React.createElement('div', {className:'mb3'},
        React.createElement('label', {className:'text-xs font-medium text-s5 mb2 block'}, '预估学考折算分'),
        React.createElement('input', {type:'number',value:userScore,onChange:function(e){setUserScore(e.target.value)},placeholder:'输入预估折算分查看冲稳保',className:'input'})
      ),
      React.createElement('div', {className:'mb3'},
        React.createElement('label', {className:'text-xs font-medium text-s5 mb2 block'}, '冲稳保筛选'),
        React.createElement('div', {className:'flex gap2'},
          [{v:'all',l:'全部'},{v:'reach',l:'冲刺'},{v:'match',l:'稳妥'},{v:'safety',l:'保底'}].map(function(t) {
            return React.createElement('button', {
              key: t.v, onClick: function(){setFilter(Object.assign({},filter,{tierFilter:t.v}))},
              className: 'px3 py1 rounded-lg text-sm font-medium transition-all ' + (filter.tierFilter===t.v ? 'bg-s8 text-w' : 'bg-s1 text-s5')
            }, t.l);
          })
        )
      ),
      React.createElement('button', {onClick:function(){setFilter({selectedSubjects:[],minACount:0,minBCount:0,searchQuery:'',tierFilter:'all',categoryFilter:null})},className:'text-xs text-s4'},'重置筛选条件')
    ) : null,
    // Results
    React.createElement('p', {className:'text-xs text-s4 mb3'},
      '共找到 ', React.createElement('span', {className:'font-medium text-s5'}, results.length), ' 所院校'
    ),
    React.createElement('div', {className:'grid sm:g2 lg:g3 gap4'},
      results.map(function(r) {
        var school = r.school, tier = r.tier;
        var isFav = favs.indexOf(school.id) !== -1;
        return React.createElement('div', {key:school.id, className:'card card-hover overflow-hidden'},
          React.createElement('div', {className:'p5'},
            React.createElement('div', {className:'flex items-start justify-between mb3'},
              React.createElement('div', {onClick:function(){LS_set('detailId',school.id);props.setPage('detail')}, className:'flex-1 min-w-0 cursor-pointer'},
                React.createElement('h3', {className:'font-semibold text-s8 truncate'}, school.name),
                React.createElement('p', {className:'text-xs text-s4 mt1'}, school.shortName)
              ),
              React.createElement('button', {onClick:function(){toggleFav(school.id)}, className:'flex-shrink-0 ml2 p1 rounded-lg ' + (isFav ? 'text-r' : 'text-s3')},
                React.createElement(HeartIcon, {size:16, fill: isFav ? 'currentColor' : 'none', stroke: isFav ? 'currentColor' : '#CBD5E1'})
              )
            ),
            React.createElement('div', {className:'flex items-center gap2 mb3'},
              React.createElement('span', {className: tier==='reach' ? 'tag tag-reach' : tier==='match' ? 'tag tag-match' : 'tag tag-safety'},
                tier==='reach' ? '冲刺' : tier==='match' ? '稳妥' : '保底'
              ),
              React.createElement('span', {className:'text-xs text-s4'}, school.type==='ministry'?'部属':'省属')
            ),
            React.createElement('p', {className:'text-xs text-s4 mb1'}, '校区：', (school.info.campuses[0]||{}).name || '-'),
            React.createElement('p', {className:'text-xs text-s4 mb1'}, '校测：', [school.examFormat.hasWrittenTest&&'笔试',school.examFormat.hasInterview&&'面试',school.examFormat.hasPhysicalTest&&'体测'].filter(Boolean).join('+')),
            React.createElement('div', {className:'flex flex-wrap gap1 mb3'},
              school.majors.slice(0,3).map(function(m){return React.createElement('span',{key:m.id,className:'px2 py05 bg-s1 rounded text-xs text-s5'},m.name)}),
              school.majors.length>3 ? React.createElement('span',{className:'text-xs text-s4'},'+',school.majors.length-3) : null
            ),
            React.createElement('button', {
              onClick: function(){LS_set('detailId',school.id);props.setPage('detail')},
              className: 'w-full py2 rounded-lg bg-p500 text-w text-sm font-medium hover:bg-p600 transition-colors'
            }, '查看详情')
          )
        );
      }),
      results.length === 0 ? React.createElement('div', {className:'text-center py16', style:{gridColumn:'1/-1'}},
        React.createElement('p', {className:'text-s4'}, '没有找到匹配的院校，试试调整筛选条件')
      ) : null
    )
  );
}

// ===== SchoolDetailPage =====
export function SchoolDetailPage(props) {
  var id = LS_get('detailId');
  var school = SCHOOLS.find(function(s){return s.id===id});
  var [favs, setFavs] = useState(function(){return LS_get('favs')||[]});
  var [tab, setTab] = useState('overview');

  if (!school) {
    return React.createElement('div', {className:'text-center py16'},
      React.createElement('p', {className:'text-s4 mb4'}, '未找到该院校信息'),
      React.createElement('button', {onClick:function(){props.setPage('schools')}, className:'px4 py2 rounded-lg bg-p500 text-w text-sm'}, '返回列表')
    );
  }

  var isFav = favs.indexOf(school.id) !== -1;
  var toggleFav = function() {
    var u = isFav ? favs.filter(function(x){return x!==school.id}) : favs.concat([school.id]);
    setFavs(u); LS_set('favs', u);
  };

  var tabs = [{k:'overview',l:'概览'},{k:'exam',l:'校测'},{k:'data',l:'数据'},{k:'life',l:'生活'}];

  return React.createElement('div', {className:'max-w-lg mx-auto px4 py6 pb-safe animate-fade-in'},
    React.createElement('div', {className:'flex items-center justify-between mb6'},
      React.createElement('button', {onClick:function(){props.setPage('schools')}, className:'text-s4 text-sm'}, '← 返回列表'),
      React.createElement('button', {onClick:toggleFav, className:'flex items-center gap1 px3 py15 rounded-lg text-sm font-medium ' + (isFav?'bg-r50 text-r':'bg-s1 text-s5')},
        React.createElement(HeartIcon, {size:14, fill: isFav?'currentColor':'none', stroke: isFav?'#EF4444':'#94A3B8'}), isFav?'已收藏':'收藏')
    ),
    // Header
    React.createElement('div', {className:'card p6 mb4 flex items-start gap4'},
      React.createElement('div', {className:'w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0'},
        React.createElement('span', {className:'text-w text-xl font-bold'}, school.shortName[0])
      ),
      React.createElement('div', {className:'flex-1 min-w-0'},
        React.createElement('h1', {className:'text-2xl font-bold text-s8'}, school.name),
        React.createElement('p', {className:'text-sm text-s4'}, school.type==='ministry'?'部属院校':'省属院校'),
        React.createElement('div', {className:'flex flex-wrap gap2 mt2'},
          school.info.campuses.map(function(c,i){return React.createElement('span',{key:i,className:'px2 py05 bg-s1 rounded text-xs text-s5'},'📍 '+c.name)})
        )
      )
    ),
    // Transfer Warning
    school.transferRestriction.restricted ? React.createElement('div', {className:'flex items-start gap3 bg-r50 rounded-xl p4 mb4'},
      React.createElement('span', {className:'text-sm'}, '⚠️'),
      React.createElement('div', null,
        React.createElement('p', {className:'text-sm font-medium text-r'}, '转专业限制提醒'),
        React.createElement('p', {className:'text-xs mt1'}, school.transferRestriction.detail)
      )
    ) : null,
    // Tabs
    React.createElement('div', {className:'flex gap1 bg-s1 rounded-xl p1 mb4'},
      tabs.map(function(tb) {
        return React.createElement('button', {
          key: tb.k, onClick: function(){setTab(tb.k)},
          className: 'flex-1 tab-btn justify-center ' + (tab===tb.k ? 'active' : 'text-s5')
        }, tb.l);
      })
    ),
    // Tab: Overview
    tab==='overview' ? React.createElement('div', {className:'flex flex-col gap4'},
      React.createElement('div', {className:'card p5'},
        React.createElement('h3', {className:'font-semibold text-s8 mb3'}, '基本信息'),
        React.createElement('div', {className:'flex flex-col gap2 text-sm'},
          React.createElement('p', null, '📍 ', school.info.campuses.map(function(c){return c.name}).join('、')),
          React.createElement('p', null, '💰 学费：', school.info.tuitionGeneral),
          school.info.tuitionSinoForeign ? React.createElement('p', {className:'text-y'}, '   中外合作：', school.info.tuitionSinoForeign) : null,
          React.createElement('p', null, '📞 ', school.info.admissionsPhone),
          school.info.healthRestrictions ? React.createElement('p', {className:'text-y'}, '⚠️ ', school.info.healthRestrictions) : null,
          React.createElement('a', {href:school.info.website,target:'_blank',className:'text-p text-break'}, school.info.website)
        )
      ),
      React.createElement('div', {className:'card p5'},
        React.createElement('h3', {className:'font-semibold text-s8 mb3'}, '招生专业'),
        React.createElement('div', {className:'flex flex-col gap2'},
          school.majors.map(function(m) {
            return React.createElement('div', {key:m.id, className:'flex items-center justify-between py2 px3 bg-s1 rounded-xl'},
              React.createElement('div', null,
                React.createElement('p', {className:'text-sm font-medium'}, m.name),
                React.createElement('p', {className:'text-xs text-s4'}, m.category)
              ),
              React.createElement('div', {className:'flex items-center gap2'},
                m.requiredSubjects.length>0 ? React.createElement('span',{className:'badge badge-blue'},m.requiredSubjects.join('+')) : null,
                m.planCount ? React.createElement('span',{className:'text-xs text-s4'},'招'+m.planCount+'人') : null
              )
            );
          })
        )
      ),
      React.createElement('div', {className:'card p5'},
        React.createElement('h3', {className:'font-semibold text-s8 mb3'}, '报名流程'),
        React.createElement('div', {className:'flex flex-col gap3'},
          school.applicationSteps.map(function(step) {
            return React.createElement('div', {key:step.step, className:'flex gap3'},
              React.createElement('div', {className:'w-8 h-8 rounded-full bg-p50 flex items-center justify-center flex-shrink-0'},
                React.createElement('span', {className:'text-sm font-bold text-p'}, step.step)
              ),
              React.createElement('div', null,
                React.createElement('div', {className:'flex items-center gap2'},
                  React.createElement('h4', {className:'font-medium text-sm'}, step.title),
                  step.deadline ? React.createElement('span', {className:'text-xs text-s4 bg-s1 px2 py05 rounded'}, step.deadline) : null
                ),
                React.createElement('p', {className:'text-xs text-s5 mt1'}, step.description),
                step.materials && step.materials.length>0 ? React.createElement('div', {className:'flex flex-wrap gap1 mt2'},
                  step.materials.map(function(m){return React.createElement('span',{key:m,className:'px2 py05 bg-y50 rounded text-xs text-y'},m)})
                ) : null
              )
            );
          })
        )
      )
    ) : null,
    // Tab: exam
    tab==='exam' ? React.createElement('div', {className:'card p5'},
      React.createElement('h3', {className:'font-semibold text-s8 mb3'}, '校测形式'),
      React.createElement('div', {className:'flex gap3 mb4'},
        React.createElement('div', {className:'px4 py15 rounded-xl text-sm font-medium '+(school.examFormat.hasWrittenTest?'bg-p50 text-p':'bg-s1 text-s4')}, '笔试：'+(school.examFormat.hasWrittenTest?'有':'无')),
        React.createElement('div', {className:'px4 py15 rounded-xl text-sm font-medium '+(school.examFormat.hasInterview?'bg-g50 text-g':'bg-s1 text-s4')}, '面试：'+(school.examFormat.hasInterview?'有':'无')),
        React.createElement('div', {className:'px4 py15 rounded-xl text-sm font-medium '+(school.examFormat.hasPhysicalTest?'bg-y50 text-y':'bg-s1 text-s4')}, '体测：'+(school.examFormat.hasPhysicalTest?'有':'无'))
      ),
      school.examFormat.hasWrittenTest && school.examFormat.writtenTestSubjects ? React.createElement('p',{className:'text-sm text-s5 mb2'},'笔试科目：',school.examFormat.writtenTestSubjects.join('、')) : null,
      school.examFormat.hasInterview ? React.createElement('p',{className:'text-sm text-s5 mb2'},'面试形式：',
        school.examFormat.interviewFormat==='individual'?'个体面试':school.examFormat.interviewFormat==='group'?'无领导小组讨论':'个体面试 + 群面') : null,
      React.createElement('p',{className:'text-sm text-s5 mb2'},school.examFormat.contentSummary),
      React.createElement('div',{className:'bg-p50 rounded-xl p3 mt3'},
        React.createElement('p',{className:'text-xs text-p font-medium mb1'},'备考建议'),
        React.createElement('p',{className:'text-xs text-p'},school.examFormat.tips)
      )
    ) : null,
    // Tab: data
    tab==='data' ? React.createElement('div', {className:'flex flex-col gap4'},
      React.createElement('div', {className:'card p5'},
        React.createElement('h3', {className:'font-semibold text-s8 mb3'}, '综合分计算公式'),
        React.createElement('div', {className:'bg-s1 rounded-xl p4 text-sm'},
          React.createElement('p', {className:'mb2'}, '综合分 = 学考折算分 × '+(school.formula.weights.xuekao*100)+'% + 校测 × '+(school.formula.weights.xiaokao*100)+'% + 高考折算分 × '+(school.formula.weights.gaokao*100)+'%'),
          React.createElement('p',{className:'text-xs text-s5 mt1'},'A='+school.formula.xuekao.A+'分 B='+school.formula.xuekao.B+'分 C='+school.formula.xuekao.C+'分 D='+school.formula.xuekao.D+'分（满分'+school.formula.xuekao.fullScore+'分）')
        ),
        React.createElement('p',{className:'text-xs text-s3 mt2'},'数据来源：'+school.name+'招生章程')
      ),
      school.admission.length>0 ? React.createElement('div', {className:'card p5'},
        React.createElement('h3', {className:'font-semibold text-s8 mb3'}, '历年竞争比'),
        React.createElement('table', {className:'w-full text-sm'},
          React.createElement('thead', null,
            React.createElement('tr', {className:'text-left text-s4 text-xs'},
              ['年份','报名','入围','录取','报录比'].map(function(h){return React.createElement('th',{key:h,className:'pb2'},h)})
            )
          ),
          React.createElement('tbody', null,
            school.admission.map(function(ad) {
              return React.createElement('tr', {key:ad.year,className:'border-t border-s1'},
                React.createElement('td',{className:'py2'},ad.year),
                React.createElement('td',{className:'py2'},ad.applicants),
                React.createElement('td',{className:'py2'},ad.passed),
                React.createElement('td',{className:'py2 font-medium'},ad.admitted),
                React.createElement('td',{className:'py2 text-s4'},(ad.applicants/ad.admitted).toFixed(1)+':1')
              );
            })
          )
        )
      ) : null
    ) : null,
    // Tab: life
    tab==='life' ? React.createElement('div', {className:'flex flex-col gap4'},
      React.createElement('div', {className:'card p5'},
        React.createElement('h3', {className:'font-semibold text-s8 mb3'}, '学生满意度'),
        [{l:'综合满意度',v:school.satisfaction.overall},{l:'校园环境',v:school.satisfaction.environment},{l:'生活条件',v:school.satisfaction.life}].map(function(item){
          return React.createElement('div',{key:item.l,className:'flex items-center gap3 mb2'},
            React.createElement('span',{className:'text-sm text-s5 w-20'},item.l),
            React.createElement('div',{className:'flex-1 h-3 bg-s1 rounded-full overflow-hidden'},
              React.createElement('div',{className:'h-full rounded-full',style:{width:(item.v/5*100)+'%',background:'linear-gradient(90deg,#F59E0B,#FBBF24)'}})
            ),
            React.createElement('span',{className:'text-sm font-medium w-8 text-right'},item.v)
          );
        }),
        React.createElement('p',{className:'text-xs text-s3 mt2'},'来源：'+school.satisfaction.source)
      ),
      React.createElement('div', {className:'card p5'},
        React.createElement('h3', {className:'font-semibold text-s8 mb3'}, '住宿条件'),
        React.createElement('p', {className:'text-sm text-s5 leading-relaxed'}, school.dormitory.description),
        React.createElement('div', {className:'flex flex-wrap gap2 mt3'},
          school.dormitory.highlights.map(function(h){return React.createElement('span',{key:h,className:'badge badge-green'},h)})
        ),
        school.dormitory.drawbacks.length>0 ? React.createElement('div',{className:'flex flex-wrap gap2 mt2'},
          school.dormitory.drawbacks.map(function(d){return React.createElement('span',{key:d,className:'badge badge-red'},d)})
        ) : null,
        React.createElement('p',{className:'text-xs text-s4 mt2'},'评分：', '⭐'.repeat(Math.floor(school.dormitory.score)))
      )
    ) : null
  );
}

// ===== CalculatorPage =====
export function CalculatorPage() {
  var [schoolId, setSchoolId] = useState('');
  var SUBJ = ['语文','数学','英语','物理','化学','生物','政治','历史','地理','技术'];
  var [grades, setGrades] = useState(SUBJ.map(function(s){return {subject:s,grade:'B'}}));
  var [xs, setXs] = useState(''); var [gk, setGk] = useState('');
  var [target, setTarget] = useState('');
  var [result, setResult] = useState(null);
  var [rGk, setRGk] = useState(null); var [rXs, setRXs] = useState(null);
  var [mode, setMode] = useState('forward');
  var [history, setHistory] = useState(function(){return LS_get('calcHistory')||[]});
  var [showHistory, setShowHistory] = useState(false);

  var school = SCHOOLS.find(function(s){return s.id===schoolId});

  var updateGrade = function(sub, g) {
    setGrades(grades.map(function(x){return x.subject===sub ? Object.assign({},x,{grade:g}) : x}));
  };

  var calcFwd = function() {
    if (!school) return;
    var r = calcComprehensive({
      xuekaoGrades: grades.map(function(g){return {subject:g.subject,grade:g.grade}}),
      xiaokaoScore: xs ? Number(xs) : null,
      gaokaoScore: gk ? Number(gk) : null
    }, school);
    setResult(r);
    if (r) {
      var rec = {id:Date.now(),date:new Date().toLocaleString('zh-CN'),schoolName:school.shortName,score:r.comprehensiveScore};
      var h = [rec].concat(history).slice(0,20);
      setHistory(h); LS_set('calcHistory', h);
    }
  };

  var calcRev = function() {
    if (!school || !target) return;
    var gradesArr = grades.map(function(g){return {subject:g.subject,grade:g.grade}});
    setRGk(reverseCalcGaokao(Number(target), gradesArr, xs?Number(xs):0, school));
    setRXs(reverseCalcXiaokao(Number(target), gradesArr, gk?Number(gk):0, school));
  };

  var aCount = grades.filter(function(g){return g.grade==='A'}).length;
  var bCount = grades.filter(function(g){return g.grade==='B'}).length;

  return React.createElement('div', {className:'max-w-md mx-auto px4 py6 pb-safe animate-fade-in'},
    React.createElement('h1', {className:'text-xl font-bold text-s8 mb6'}, '🧮 综合分计算器'),
    // Mode
    React.createElement('div', {className:'flex bg-s1 rounded-xl p1 mb4'},
      [{k:'forward',l:'正算模式'},{k:'reverse',l:'反向推算'}].map(function(m) {
        return React.createElement('button', {key:m.k, onClick:function(){setMode(m.k);setResult(null);setRGk(null);setRXs(null)},
          className: 'flex-1 py25 rounded-lg text-sm font-medium transition-all '+(mode===m.k?'bg-w text-p shadow-sm':'text-s5')
        }, m.l);
      })
    ),
    // School select
    React.createElement('div', {className:'card p4 mb4'},
      React.createElement('label', {className:'text-xs font-medium text-s5 mb2 block'}, '选择目标院校'),
      React.createElement('select', {value:schoolId,onChange:function(e){setSchoolId(e.target.value);setResult(null);setRGk(null);setRXs(null)},className:'input'},
        React.createElement('option', {value:''}, '请选择院校'),
        SCHOOLS.map(function(s){return React.createElement('option',{key:s.id,value:s.id},s.name+'（'+s.shortName+'）')})
      )
    ),
    // Formula
    school ? React.createElement('div', {className:'bg-p50 rounded-xl p4 mb4 text-sm'},
      React.createElement('p', {className:'font-medium text-p mb1'}, '公式：综合分 = 学考折算分 × '+(school.formula.weights.xuekao*100)+'% + 校测 × '+(school.formula.weights.xiaokao*100)+'% + 高考折算分 × '+(school.formula.weights.gaokao*100)+'%'),
      React.createElement('p', {className:'text-xs mt1'}, 'A='+school.formula.xuekao.A+' B='+school.formula.xuekao.B+' C='+school.formula.xuekao.C+' D='+school.formula.xuekao.D)
    ) : null,
    // Grades
    React.createElement('div', {className:'card p4 mb4'},
      React.createElement('div', {className:'flex items-center justify-between mb3'},
        React.createElement('h3', {className:'font-medium text-sm'}, '学考等级'),
        React.createElement('span', {className:'text-xs text-s4'}, 'A:',aCount,' B:',bCount)
      ),
      React.createElement('div', {className:'grid g2 gap2'},
        grades.map(function(g) {
          return React.createElement('div', {key:g.subject, className:'flex items-center gap2 bg-s1 rounded-xl px3 py2'},
            React.createElement('span', {className:'text-sm w-10'}, g.subject),
            React.createElement('select', {value:g.grade, onChange:function(e){updateGrade(g.subject,e.target.value)}, className:'bg-w border border-s2 rounded-lg px2 py1 text-sm flex-1'},
              ['A','B','C','D','E'].map(function(o){return React.createElement('option',{key:o,value:o},o)})
            )
          );
        })
      )
    ),
    // Scores
    React.createElement('div', {className:'card p4 mb4'},
      React.createElement('div', {className:'grid g2 gap3'},
        React.createElement('div', null,
          React.createElement('label', {className:'text-xs font-medium text-s5 mb1 block'}, '校测预估分'),
          React.createElement('input', {type:'number',value:xs,onChange:function(e){setXs(e.target.value)},placeholder:'如 85',className:'input'})
        ),
        React.createElement('div', null,
          React.createElement('label', {className:'text-xs font-medium text-s5 mb1 block'}, '高考预估分'),
          React.createElement('input', {type:'number',value:gk,onChange:function(e){setGk(e.target.value)},placeholder:'如 620',className:'input'})
        )
      )
    ),
    // Forward
    mode==='forward' ? React.createElement('button', {onClick:calcFwd,disabled:!schoolId,className:'w-full py3 rounded-xl bg-p500 text-w font-medium text-sm hover:bg-p600 transition-colors mb4 disabled:opacity-50'}, '计算综合分') :
    React.createElement('div', {className:'flex flex-col gap4'},
      React.createElement('div', {className:'card p4'},
        React.createElement('label', {className:'text-xs font-medium text-s5 mb2 block'}, '目标综合分'),
        React.createElement('input', {type:'number',value:target,onChange:function(e){setTarget(e.target.value)},placeholder:'如 85',className:'input'})
      ),
      React.createElement('button', {onClick:calcRev,disabled:!schoolId||!target,className:'w-full py3 rounded-xl text-w font-medium text-sm transition-colors mb4 disabled:opacity-50',style:{background:'#F59E0B'}}, '反向推算')
    ),
    // Forward Result
    mode==='forward' && result ? React.createElement('div', {className:'card p5 animate-slide-up mb4'},
      React.createElement('h3', {className:'font-semibold text-s8 mb3 text-center'}, '计算结果'),
      React.createElement('div', {className:'text-center mb4'},
        React.createElement('p', {className:'text-4xl font-bold text-p'}, result.comprehensiveScore),
        React.createElement('p', {className:'text-xs text-s4 mt1'}, '综合分')
      ),
      [['学考折算分',result.xuekaoConverted+'/'+result.xuekaoFullScore],['校测成绩',result.xiaokaoNormalized],['高考折算分',result.gaokaoNormalized],['判定',result.tier==='reach'?'冲刺':result.tier==='match'?'稳妥':'保底']].map(function(r,i){
        return React.createElement('div',{key:i,className:'flex justify-between py2 '+(i<3?'border-b border-s1':'')},
          React.createElement('span',{className:'text-sm text-s5'},r[0]),
          React.createElement('span',{className:'text-sm font-medium'},r[1])
        );
      })
    ) : null,
    // Reverse Result
    mode==='reverse' && (rGk!==null||rXs!==null) ? React.createElement('div', {className:'card p5 animate-slide-up mb4'},
      rGk!==null ? React.createElement('div',{className:'bg-y50 rounded-xl p4 mb3'},
        React.createElement('p',{className:'text-xs text-y mb1'},'若校测为 '+(xs||'?')+' 分'),
        React.createElement('p',{className:'text-lg font-bold text-y'},'高考需要 ≥ ',rGk,' 分')
      ) : null,
      rXs!==null ? React.createElement('div',{className:'bg-p50 rounded-xl p4'},
        React.createElement('p',{className:'text-xs text-p mb1'},'若高考为 '+(gk||'?')+' 分'),
        React.createElement('p',{className:'text-lg font-bold text-p'},'校测需要 ≥ ',rXs,' 分')
      ) : null
    ) : null,
    // History
    React.createElement('div', {className:'card overflow-hidden'},
      React.createElement('button', {onClick:function(){setShowHistory(!showHistory)}, className:'w-full flex items-center justify-between p4 text-sm font-medium text-s5'},
        '📋 计算历史',
        React.createElement('span', null, showHistory ? '▲' : '▼')
      ),
      showHistory ? React.createElement('div', {className:'px4 pb4 max-h-60 overflow-y-auto'},
        history.length===0 ? React.createElement('p',{className:'text-sm text-s4 text-center py4'},'暂无记录') :
        history.slice(0,10).map(function(item){return React.createElement('div',{key:item.id,className:'flex items-center justify-between py2 px3 bg-s1 rounded-xl text-xs mb2'},
          React.createElement('div',null,React.createElement('p',{className:'text-s5 font-medium'},item.schoolName),React.createElement('p',{className:'text-s4'},item.date)),
          React.createElement('span',{className:'text-p font-bold'},item.score)
        )})
      ) : null
    )
  );
}

// ===== FavoritesPage =====
export function FavoritesPage(props) {
  var [favs, setFavs] = useState(function(){return LS_get('favs')||[]});
  var list = SCHOOLS.filter(function(s){return favs.indexOf(s.id)!==-1});
  var toggle = function(id) { var u = favs.filter(function(x){return x!==id}); setFavs(u); LS_set('favs',u); };
  return React.createElement('div', {className:'max-w-md mx-auto px4 py6 pb-safe animate-fade-in'},
    React.createElement('h1', {className:'text-xl font-bold text-s8 mb2'}, '❤️ 我的收藏'),
    React.createElement('p', {className:'text-sm text-s4 mb6'}, '收藏的院校保存在本地浏览器'),
    list.length===0 ? React.createElement('div', {className:'text-center py16'},
      React.createElement('p', {className:'text-s4 mb4'}, '还没有收藏的院校'),
      React.createElement('button', {onClick:function(){props.setPage('schools')}, className:'px4 py2 rounded-lg bg-p500 text-w text-sm'}, '去院校列表看看')
    ) : React.createElement('div', {className:'flex flex-col gap3'},
      list.map(function(s){return React.createElement('div',{key:s.id,className:'card p4 flex items-center gap4'},
        React.createElement('div',{className:'w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0'},React.createElement('span',{className:'text-w font-bold'},s.shortName[0])),
        React.createElement('div',{className:'flex-1 min-w-0'},
          React.createElement('button',{onClick:function(){LS_set('detailId',s.id);props.setPage('detail')},className:'font-medium text-s8 text-left w-full'},s.name),
          React.createElement('p',{className:'text-xs text-s4'},"📍 "+(s.info.campuses[0]||{}).name)
        ),
        React.createElement('button',{onClick:function(){toggle(s.id)},className:'p1 text-s4 hover:text-r transition-colors'},'✕')
      )})
    )
  );
}

// ===== FAQPage =====
export function FAQPage() {
  var [open, setOpen] = useState(null);
  return React.createElement('div', {className:'max-w-md mx-auto px4 py6 pb-safe animate-fade-in'},
    React.createElement('h1', {className:'text-xl font-bold text-s8 mb6'}, '❓ 常见问题'),
    React.createElement('div', {className:'flex flex-col gap3'},
      FAQ_DATA.map(function(item,i) {
        return React.createElement('div', {key:i, className:'card overflow-hidden'},
          React.createElement('button', {onClick:function(){setOpen(open===i?null:i)}, className:'w-full flex items-center justify-between p4 text-left'},
            React.createElement('span', {className:'font-medium text-s8 text-sm pr4'}, item.q),
            React.createElement('span', {className:'text-s4 text-xs'}, open===i ? '▲' : '▼')
          ),
          open===i ? React.createElement('div', {className:'px4 pb4 animate-slide-up'},
            React.createElement('p', {className:'text-sm text-s5 bg-s1 rounded-xl p4 leading-relaxed'}, item.a)
          ) : null
        );
      })
    )
  );
}

// ===== TreeholePage =====
export function TreeholePage() {
  var [posts, setPosts] = useState(function(){return LS_get('treehole')||[
    {id:'1',content:'杭电的校测难度怎么样？有过来人分享一下吗？',created_at:'2026-03-15 14:30',aid:'匿名001'},
    {id:'2',content:'浙财面试是无领导小组讨论，建议大家多练练表达',created_at:'2026-03-14 10:15',aid:'匿名002'},
    {id:'3',content:'学考7A3B，想冲浙大计算机，有希望吗？',created_at:'2026-03-13 21:00',aid:'匿名003'},
  ]});
  var [text, setText] = useState('');
  var submit = function() {
    if (!text.trim()) return;
    var p = {id:Date.now().toString(),content:text.trim(),created_at:new Date().toLocaleString('zh-CN'),aid:'匿名'+Math.random().toString(36).slice(2,6)};
    var u = [p].concat(posts); setPosts(u); LS_set('treehole',u); setText('');
  };
  return React.createElement('div', {className:'max-w-md mx-auto px4 py6 pb-safe animate-fade-in'},
    React.createElement('h1', {className:'text-xl font-bold text-s8 mb6'}, '💬 树洞'),
    React.createElement('div', {className:'card p4 mb4'},
      React.createElement('textarea', {value:text,onChange:function(e){setText(e.target.value)},placeholder:'分享你的三一经验、困惑或心情...',maxLength:500,rows:3,className:'input resize-none mb2'}),
      React.createElement('div', {className:'flex items-center justify-between'},
        React.createElement('span', {className:'text-xs text-s3'}, text.length, '/500'),
        React.createElement('button', {onClick:submit,disabled:!text.trim(),className:'px4 py2 rounded-lg bg-p500 text-w text-sm disabled:opacity-50'}, '匿名发布')
      )
    ),
    React.createElement('div', {className:'flex flex-col gap3'},
      posts.map(function(p){return React.createElement('div',{key:p.id,className:'card p4'},
        React.createElement('p',{className:'text-sm text-s6 leading-relaxed'},p.content),
        React.createElement('p',{className:'text-xs text-s4 mt2'},p.aid,' · ',p.created_at)
      )})
    )
  );
}

// ===== ProfilePage =====
export function ProfilePage(props) {
  var [favs] = useState(function(){return LS_get('favs')||[]});
  var list = SCHOOLS.filter(function(s){return favs.indexOf(s.id)!==-1});
  var timelines = useMemo(function() {
    var tl = [];
    list.forEach(function(s) {
      s.applicationSteps.forEach(function(step) {
        if (step.deadline) tl.push({date:step.deadline,title:step.title,schoolName:s.shortName,type:step.step===4?'result':'deadline'});
      });
    });
    return tl.sort(function(a,b){return a.date.localeCompare(b.date)});
  }, [list]);

  return React.createElement('div', {className:'max-w-md mx-auto px4 py6 pb-safe animate-fade-in'},
    React.createElement('h1', {className:'text-xl font-bold text-s8 mb6'}, '📋 我的三一档案'),
    React.createElement('div', {className:'card p4 mb4'},
      React.createElement('h3', {className:'font-medium text-sm mb2'}, '目标院校'),
      list.length===0 ? React.createElement('p',{className:'text-sm text-s4'},'还没有收藏，',React.createElement('button',{onClick:function(){props.setPage('schools')},className:'text-p'},'去添加')) :
      React.createElement('div',{className:'flex flex-wrap gap2'},list.map(function(s){return React.createElement('button',{key:s.id,onClick:function(){LS_set('detailId',s.id);props.setPage('detail')},className:'px3 py15 bg-s1 rounded-lg text-sm text-s5'},s.shortName)}))
    ),
    React.createElement('div', {className:'card p4 mb4'},
      React.createElement('h3', {className:'font-medium text-sm mb2'}, '重要时间节点'),
      timelines.length===0 ? React.createElement('p',{className:'text-sm text-s4'},'收藏院校后自动生成') :
      React.createElement('div',{className:'flex flex-col gap3'},timelines.map(function(tl,i){return React.createElement('div',{key:i,className:'flex gap3'},
        React.createElement('div',{className:'flex-shrink-0'},React.createElement('div',{className:'w-2 h-2 rounded-full bg-p mt15'})),
        React.createElement('div',null,React.createElement('p',{className:'text-sm font-medium'},tl.title),React.createElement('p',{className:'text-xs text-s4'},tl.schoolName,' · ',tl.date))
      )}))
    ),
    React.createElement('div', {className:'card p4'},
      React.createElement('h3', {className:'font-medium text-sm mb2'}, '报名材料清单'),
      list.length===0 ? React.createElement('p',{className:'text-sm text-s4'},'收藏院校后自动汇总') :
      list.map(function(s){
        var allMats = []; s.applicationSteps.forEach(function(st){(st.materials||[]).forEach(function(m){if(allMats.indexOf(m)===-1)allMats.push(m)})});
        return React.createElement('div',{key:s.id,className:'bg-s1 rounded-xl p3 mb3'},
          React.createElement('p',{className:'text-sm font-medium mb2'},s.shortName),
          allMats.map(function(m){return React.createElement('label',{key:m,className:'flex items-center gap2 py1'},
            React.createElement('input',{type:'checkbox',className:'w-4 h-4'}),
            React.createElement('span',{className:'text-xs text-s5'},m)
          )})
        );
      })
    )
  );
}

// ===== ComparePage =====
export function ComparePage(props) {
  var [ids, setIds] = useState(function(){return LS_get('compareIds')||[]});
  var [show, setShow] = useState(false);
  var list = SCHOOLS.filter(function(s){return ids.indexOf(s.id)!==-1});
  var add = function(id) { if(ids.length>=5||ids.indexOf(id)!==-1) return; var u = ids.concat([id]); setIds(u); LS_set('compareIds',u); setShow(false); };
  var remove = function(id) { var u = ids.filter(function(i){return i!==id}); setIds(u); LS_set('compareIds',u); };
  var base = list[0];
  var getVal = function(s,f) {
    switch(f) { case'type':return s.type==='ministry'?'部属':'省属'; case'campus':return (s.info.campuses[0]||{}).name||'-'; case'tuition':return s.info.tuitionGeneral; case'written':return s.examFormat.hasWrittenTest?'有':'无'; case'interview':return s.examFormat.hasInterview?'有':'无'; case'restrict':return s.transferRestriction.restricted?'是':'否'; case'score':return(s.admission[0]||{}).minScore||0; case'sat':return s.satisfaction.overall; default:return'-'; }
  };
  var rows = [{f:'type',l:'院校类型'},{f:'campus',l:'校区'},{f:'tuition',l:'学费'},{f:'written',l:'笔试'},{f:'interview',l:'面试'},{f:'restrict',l:'转专业限制'},{f:'score',l:'往年最低录取分'},{f:'sat',l:'满意度'}];

  return React.createElement('div', {className:'max-w-2xl mx-auto px4 py6 pb-safe animate-fade-in'},
    React.createElement('div', {className:'flex items-center justify-between mb6'},
      React.createElement('h1', {className:'text-xl font-bold text-s8'}, '院校对比'),
      React.createElement('button', {onClick:function(){setShow(true)},disabled:ids.length>=5,className:'px4 py2 rounded-lg bg-p500 text-w text-sm disabled:opacity-50'},'添加 (',ids.length,'/',5,')')
    ),
    list.length>0 ? React.createElement('div', {className:'card overflow-x-auto'},
      React.createElement('table', {className:'w-full text-sm'},
        React.createElement('thead',null,React.createElement('tr',{className:'border-b border-s1'},React.createElement('th',{className:'text-left p4 text-s4 text-xs'},'对比项目'),list.map(function(s){return React.createElement('th',{key:s.id,className:'p4 text-center',style:{minWidth:120}},React.createElement('div',{className:'flex items-center justify-between'},s.shortName,React.createElement('button',{onClick:function(){remove(s.id)},className:'text-s3'},'✕')))}))),
        React.createElement('tbody',null,rows.map(function(row){return React.createElement('tr',{key:row.f,className:'border-b border-s1'},React.createElement('td',{className:'p4 text-s5 font-medium'},row.l),list.map(function(s,i){var v = getVal(s,row.f);return React.createElement('td',{key:s.id,className:'p4 text-center'},v)}))}))
      )
    ) : React.createElement('div', {className:'text-center py16'},
      React.createElement('p', {className:'text-s4'}, '添加院校开始对比（最多 5 所）')
    ),
    show ? React.createElement('div', {className:'fixed inset0 z50 flex items-center justify-center p4', style:{background:'rgba(0,0,0,.3)'}},
      React.createElement('div', {className:'bg-w rounded-2xl w-full max-w-sm max-h-70 overflow-hidden animate-slide-up'},
        React.createElement('div', {className:'flex items-center justify-between p4 border-b border-s1'},
          React.createElement('h3', {className:'font-semibold'}, '添加对比院校'),
          React.createElement('button', {onClick:function(){setShow(false)}, className:'text-s4'}, '✕')
        ),
        React.createElement('div', {className:'p4 overflow-y-auto max-h-60'},
          SCHOOLS.map(function(s){return React.createElement('button',{key:s.id,onClick:function(){add(s.id)},disabled:ids.indexOf(s.id)!==-1,className:'w-full text-left p3 rounded-xl hover:bg-s1 transition-colors disabled:opacity-40'},
            React.createElement('p',{className:'font-medium text-sm'},s.name),React.createElement('p',{className:'text-xs text-s4'},s.shortName)
          )})
        )
      )
    ) : null
  );
}
