const CACHE="cabin-drinks-v34";
const SHELL=["./","./index.html","./app.html","./faq.html","./faq.css","./legal.html","./legal.css","./landing.css","./history.css","./about.css","./support.css","./showcase.css","./install.css","./hype.css","./landing.js","./updater.js","./style.css","./multi-order.css","./help.css","./v7.css","./v8.css","./delivery-details.css","./v10.css","./food.css","./usability.css","./v13.css","./app.js","./drink-feedback.js","./hot-water.js","./manifest.json","./app-icon.svg","./app-seat-map.png","./app-prepare-orders.png","./A1C049B2-7FF4-41EC-9220-E4BF0FF22D71.png","./faq-scan-1-photo.png","./faq-scan-2-review.png","./faq-scan-3-confirmed.png","./scan-demo.mp4"];

// Safari refuses to fulfill a navigation with a redirected Response (e.g. Cloudflare Pages'
// automatic /app.html -> /app redirect), so responses are rebuilt without that flag before storage.
async function stripRedirect(response){
  if(!response.redirected)return response;
  const body=await response.arrayBuffer();
  return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
}

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{await Promise.all(SHELL.map(async f=>{try{const response=await fetch(f,{cache:"no-store"});if(response.ok)await cache.put(f,await stripRedirect(response));}catch(e){console.warn("Cache failed",f);}}));}));
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
        const raw=await fetch(event.request,{cache:"no-store"});
        if(raw&&raw.ok){
          const clean=await stripRedirect(raw);
          const copy=clean.clone();
          event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
          return clean;
        }
        return raw;
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
    const raw=await fetch(event.request);
    if(raw&&raw.ok){
      const clean=await stripRedirect(raw);
      const copy=clean.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
      return clean;
    }
    return raw;
  })());
});
