const CACHE_NAME='3in1-v18';

// 说明：站点可能被部署在根域名，也可能被部署在子路径（如 /three-one/）。
// 旧版把 APP_SHELL 和离线兜底路径写死成以 '/' 开头的绝对路径，一旦落在子路径，
// 预缓存会全部 404、断网兜底也会命中不到，PWA 静默失效。
// 现在一律用「相对 SW 自身作用域」推导，根域名与子路径都能正确工作。
const SCOPE=self.registration.scope;
const ROOT=new URL('./',SCOPE).href;
const APP_SHELL=[
  './',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js'
].map(function(p){return new URL(p,SCOPE).href});

function rootFallback(){
  return caches.match(ROOT).then(function(hit){
    return hit||caches.match(new URL('./index.html',SCOPE).href);
  });
}

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(
        APP_SHELL.map(function(url){
          return fetch(url).then(function(resp){
            if(resp.ok)return cache.put(url,resp);
            return Promise.resolve();
          }).catch(function(){});
        })
      );
    }).then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE_NAME}).map(function(k){return caches.delete(k)})
      );
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(e){
  var url=new URL(e.request.url);

  // 同源 API 请求：网络优先，离线时回退缓存（社区功能降级已由前端处理）
  if(url.origin===location.origin&&url.pathname.indexOf('/api/')===0){
    e.respondWith(
      fetch(e.request).then(function(resp){
        const copy=resp.clone();
        caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,copy)});
        return resp;
      }).catch(function(){
        return caches.match(e.request).then(function(hit){
          return hit||rootFallback();
        });
      })
    );
    return;
  }

  // HTML / 页面导航：network-first（在线取最新并刷新缓存；断网回退最近缓存，保证发版即新）
  if(e.request.mode==='navigate'||url.pathname.endsWith('.html')||url.href===ROOT){
    e.respondWith(
      fetch(e.request).then(function(resp){
        if(resp&&resp.status===200&&resp.type==='basic'){
          const copy=resp.clone();
          caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,copy)});
        }
        return resp;
      }).catch(function(){
        return caches.match(e.request).then(function(hit){
          return hit||rootFallback();
        });
      })
    );
    return;
  }

  // 其它静态资源（icon、manifest 等不可变低频文件）：cache-first，作为离线兜底
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit)return hit;
      return fetch(e.request).then(function(resp){
        if(resp&&resp.status===200&&resp.type==='basic'){
          const copy=resp.clone();
          caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,copy)});
        }
        return resp;
      }).catch(function(){
        if(e.request.mode==='navigate')return rootFallback();
        return new Response('',{status:503,statusText:'Offline'});
      });
    })
  );
});
