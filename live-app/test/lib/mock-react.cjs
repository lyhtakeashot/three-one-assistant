// mock React/ReactDOM/DOM/localStorage/fetch/navigator 环境桩
// install() 注入 global，restore() 恢复；渲染测试专用

function createMockEnv() {
  let originals = null;

  function install() {
    if (originals) return;
    originals = {
      React: global.React,
      ReactDOM: global.ReactDOM,
      document: global.document,
      localStorage: global.localStorage,
      fetch: global.fetch,
      navigator: global.navigator,
      window: global.window,
      location: global.location,
    };

    const store = {};
    global.localStorage = {
      getItem: (k) => (store[k] !== undefined ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    };

    global.document = {
      getElementById: () => ({ appendChild() {}, removeChild() {} }),
      createElement: () => ({ click() {}, setAttribute() {} }),
      body: { appendChild() {}, removeChild() {} },
    };

    global.fetch = () => Promise.reject(new Error('offline (mock)'));
    global.navigator = { serviceWorker: { register: () => Promise.resolve() } };
    global.window = { confirm: () => true, addEventListener() {} };
    global.location = { origin: 'http://localhost:8080' };

    const React = {};
    React.createElement = function (type, props) {
      const children = [];
      for (let i = 2; i < arguments.length; i++) children.push(arguments[i]);
      return { type, props: props || {}, children };
    };
    React.useState = function (init) {
      return [typeof init === 'function' ? init() : init, function () {}];
    };
    React.useMemo = function (fn) { return fn(); };
    React.useEffect = function () {}; // 空执行，避免测试副作用
    React.useRef = function (v) { return { current: v }; };
    global.React = React;

    global.ReactDOM = {
      createRoot: () => ({ render() {} }),
    };
  }

  function restore() {
    if (!originals) return;
    global.React = originals.React;
    global.ReactDOM = originals.ReactDOM;
    global.document = originals.document;
    global.localStorage = originals.localStorage;
    global.fetch = originals.fetch;
    global.navigator = originals.navigator;
    global.window = originals.window;
    global.location = originals.location;
    originals = null;
  }

  return { install, restore };
}

module.exports = { createMockEnv };
