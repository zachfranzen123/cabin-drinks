const CACHE="cabin-drinks-v33";
const SHELL=["./","./index.html","./app.html","./landing.css","./history.css","./about.css","./support.css","./showcase.css","./landing.js","./style.css","./multi-order.css","./help.css","./v7.css","./v8.css","./delivery-details.css","./v10.css","./food.css","./usability.css","./app.js","./manifest.json","./app-icon.svg","./app-seat-map.png","./app-prepare-orders.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>Promise.all(SHELL.map(file=>cache.add(file)))));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cached=await caches.match(event.request,{ignoreSearch:true});
    if(cached)return cached;
    try{
      const response=await fetch(event.request);
      if(response&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}
      return response;
    }catch(error){
      if(event.request.mode==="navigate"){
        return caches.match(url.pathname.endsWith("app.html")?"./app.html":"./index.html");
      }
      throw error;
    }
  })());
});
