const CACHE_NAME='3in1-v1';
const APP_SHELL=[
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

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
          return hit||caches.match('/');
        });
      })
    );
    return;
  }

  // 静态资源：cache-first，离线可用核心功能
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
        if(e.request.mode==='navigate')return caches.match('/');
        return new Response('',{status:503,statusText:'Offline'});
      });
    })
  );
});
