const CACHE="cabin-drinks-v14-readiness-fix";
const SHELL=["./","./index.html","./app.html","./landing.css","./history.css","./about.css","./support.css","./showcase.css","./hero-mockup.css","./install.css","./landing.js","./updater.js","./style.css","./multi-order.css","./help.css","./v7.css","./v8.css","./delivery-details.css","./v10.css","./food.css","./usability.css","./v13.css","./app.js","./manifest.json","./app-icon.svg","./app-seat-map.png","./app-prepare-orders.png","./A1C049B2-7FF4-41EC-9220-E4BF0FF22D71.png"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==="navigate"||url.pathname.endsWith("/landing.js")||url.pathname.endsWith("/updater.js")||url.pathname.endsWith("/about.css")||url.pathname.endsWith("/index.html")){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:"no-store"});
        if(response&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}
        return response;
      }catch{
        if(event.request.mode==="navigate")return caches.match(url.pathname.endsWith("app.html")?"./app.html":"./index.html");
        return caches.match(event.request,{ignoreSearch:true});
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(event.request,{ignoreSearch:true});
    if(cached)return cached;
    const response=await fetch(event.request);
    if(response&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}
    return response;
  })());
});