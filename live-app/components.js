import React from 'react';

function HeartIcon(props) {
  return React.createElement('svg', {width:props.size||18,height:props.size||18,viewBox:'0 0 24 24',fill:props.fill||'none',stroke:props.stroke||'currentColor',strokeWidth:2},
    React.createElement('path',{d:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'})
  );
}

export function Header(props) {
  var navs = [
    {p:'home',l:'首页'},
    {p:'schools',l:'院校查询'},
    {p:'calculator',l:'计算器'},
    {p:'compare',l:'对比'},
    {p:'favorites',l:'收藏'},
    {p:'faq',l:'FAQ'},
    {p:'treehole',l:'树洞'}
  ];

  return React.createElement('header', {className:'fixed top0 left0 right0 z50 glass glass-border'},
    React.createElement('div', {className:'flex items-center justify-between px4 h14'},
      React.createElement('div', {onClick:function(){props.setPage('home')}, className:'flex items-center gap2 cursor-pointer', style:{cursor:'pointer'}},
        React.createElement('div', {className:'w-8 h-8 rounded-lg gradient-primary flex items-center justify-center'},
          React.createElement('span', {className:'text-w text-xs font-bold'}, '3一')
        ),
        React.createElement('span', {className:'font-bold text-sm sm-hide'}, '三位一体辅助系统')
      ),
      React.createElement('nav', {className:'md:flex hide gap1'},
        navs.slice(0,5).map(function(n) {
          var active = props.page === n.p || (n.p !== 'home' && props.page.indexOf(n.p) === 0);
          return React.createElement('button', {
            key: n.p, onClick: function(){props.setPage(n.p)},
            className: 'px3 py15 rounded-lg text-sm font-medium transition-all ' + (active ? 'bg-p50 text-p' : 'text-s5 hover:bg-s1')
          }, n.l);
        })
      ),
      React.createElement('button', {onClick:function(){props.setMobile(!props.mobile)}, className:'md:flex hide p2 text-s5'},
        props.mobile ? '✕' : '☰'
      )
    ),
    props.mobile ? React.createElement('div', {className:'md:flex hide bg-w border-t border-s2 shadow-lg animate-slide-up'},
      React.createElement('div', {className:'px2 py2 flex flex-col gap1'},
        navs.map(function(n) {
          return React.createElement('button', {
            key: n.p, onClick: function(){props.setPage(n.p);props.setMobile(false)},
            className: 'px4 py3 rounded-lg text-sm font-medium ' + (props.page === n.p ? 'bg-p50 text-p' : 'text-s5')
          }, n.l);
        })
      )
    ) : null
  );
}

export function MobileNav(props) {
  var items = [
    {p:'home',l:'首页'},{p:'schools',l:'院校'},{p:'calculator',l:'计算'},{p:'favorites',l:'收藏'},{p:'profile',l:'档案'}
  ];
  return React.createElement('nav', {className:'md:hidden fixed bottom0 left0 right0 z50 glass glass-border px2 pb-safe'},
    React.createElement('div', {className:'flex items-center justify-around h14'},
      items.map(function(item) {
        var active = props.page === item.p || (item.p !== 'home' && props.page.indexOf(item.p) === 0);
        return React.createElement('button', {
          key: item.p, onClick: function(){props.setPage(item.p)},
          className: 'flex flex-col items-center px3 py1 rounded-lg min-w-[56px] transition-all ' + (active ? 'text-p' : 'text-s4')
        }, React.createElement('span', {className:'text-lg'}, item.l[0]),
           React.createElement('span', {className:'text-[10px] font-medium'}, item.l));
      })
    )
  );
}

export function Footer() {
  return React.createElement('footer', {className:'bg-w border-t border-s2 py6 px4 text-center text-xs text-s4 mt-auto'},
    React.createElement('p', null, '数据来源：浙江省教育考试院 · 各高校招生网 · 阳光高考网'),
    React.createElement('p', {className:'mt1'}, '仅供考生参考，请以官方最新公告为准。')
  );
}
