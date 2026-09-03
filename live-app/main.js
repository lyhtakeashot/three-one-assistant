import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Header, MobileNav, Footer } from './components.js';
import { HomePage, SchoolListPage, SchoolDetailPage, CalculatorPage, ComparePage, FavoritesPage, FAQPage, TreeholePage, ProfilePage } from './pages.js';

function App() {
  var [page, setPage] = useState('home');
  var [mobile, setMobile] = useState(false);

  var renderPage = function() {
    switch(page) {
      case 'home': return React.createElement(HomePage, {setPage:setPage});
      case 'schools': return React.createElement(SchoolListPage, {setPage:setPage});
      case 'detail': return React.createElement(SchoolDetailPage, {setPage:setPage});
      case 'calculator': return React.createElement(CalculatorPage);
      case 'compare': return React.createElement(ComparePage, {setPage:setPage});
      case 'favorites': return React.createElement(FavoritesPage, {setPage:setPage});
      case 'profile': return React.createElement(ProfilePage, {setPage:setPage});
      case 'faq': return React.createElement(FAQPage);
      case 'treehole': return React.createElement(TreeholePage);
      default: return React.createElement(HomePage, {setPage:setPage});
    }
  };

  return React.createElement('div', {className:'min-h-screen flex flex-col'},
    React.createElement(Header, {page:page, setPage:setPage, mobile:mobile, setMobile:setMobile}),
    React.createElement('main', {className:'flex-1 flex-grow', style:{paddingTop:56,paddingBottom:80}},
      renderPage()
    ),
    React.createElement(Footer),
    React.createElement(MobileNav, {page:page, setPage:setPage})
  );
}

var root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
