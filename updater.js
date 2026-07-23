(()=>{
  const VERSION="14";
  const CACHE_NAME="cabin-drinks-v14-about-elio";
  const isStandalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const isAndroid=/Android/i.test(navigator.userAgent);
  const isSafari=/Safari/i.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);
  const isEmbedded=/FBAN|FBAV|Instagram|Line|WhatsApp/i.test(navigator.userAgent);
  let deferredPrompt=null;
  let refreshing=false;
  let installStarted=false;
  let statusTimer=null;

  const statusNodes=[document.querySelector("#offlineStatus"),document.querySelector("#installReadiness")].filter(Boolean);
  statusNodes.forEach(node=>node.hidden=true);

  const setStatus=(state,message,{temporary=false,force=false}={})=>{
    clearTimeout(statusTimer);
    statusNodes.forEach(node=>{
      const shouldShow=force||installStarted||state==="error";
      node.hidden=!shouldShow;
      node.classList.toggle("is-ready",state==="ready");
      node.classList.toggle("is-error",state==="error");
      const text=node.querySelector("strong")||node.querySelector("span:last-child");
      if(text)text.textContent=message;
    });
    if(temporary){
      statusTimer=setTimeout(()=>statusNodes.forEach(node=>node.hidden=true),4500);
    }
  };

  const confirmOfflineReady=async({showResult=false}={})=>{
    if(!("serviceWorker" in navigator)||!("caches" in window)){
      if(showResult)setStatus("error","Offline use is not supported in this browser",{force:true});
      return false;
    }
    try{
      await navigator.serviceWorker.ready;
      const ready=await caches.has(CACHE_NAME);
      if(ready){
        if(showResult)setStatus("ready","Ready for airplane mode ✓",{temporary:true,force:true});
        return true;
      }
      if(showResult)setStatus("working","Preparing for airplane mode…",{force:true});
      setTimeout(()=>confirmOfflineReady({showResult}),1200);
      return false;
    }catch{
      if(showResult)setStatus("error","Keep this page open while connected to finish setup",{force:true});
      return false;
    }
  };

  const showUpdated=()=>{
    const toast=document.querySelector("#updateToast");
    if(!toast)return;
    toast.hidden=false;
    setTimeout(()=>{toast.hidden=true},4500);
  };

  if("serviceWorker" in navigator){
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(refreshing)return;
      refreshing=true;
      sessionStorage.setItem("cabinDrinksUpdated",VERSION);
      location.reload();
    });
    window.addEventListener("load",async()=>{
      try{
        const registration=await navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"});
        await registration.update().catch(()=>{});
        confirmOfflineReady();
      }catch{}
      if(sessionStorage.getItem("cabinDrinksUpdated")===VERSION){sessionStorage.removeItem("cabinDrinksUpdated");showUpdated()}
    });
    const check=()=>navigator.serviceWorker.getRegistration().then(reg=>reg?.update()).catch(()=>{});
    window.addEventListener("online",check);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")check()});
    setInterval(check,30*60*1000);
  }

  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredPrompt=event});
  window.addEventListener("appinstalled",()=>{deferredPrompt=null;installStarted=true;setStatus("ready","Ready for airplane mode ✓",{temporary:true,force:true})});

  const sheet=document.querySelector("#installSheet");
  const steps=document.querySelector("#installSteps");
  const title=document.querySelector("#installSheetTitle");
  const label=document.querySelector("#installDeviceLabel");
  const continueButton=document.querySelector("#installContinue");
  const step=(number,heading,detail)=>`<div class="install-step"><b>${number}</b><div><strong>${heading}</strong><span>${detail}</span></div></div>`;
  const closeSheet=()=>{if(sheet)sheet.hidden=true;document.body.style.overflow=""};
  const openSheet=()=>{if(sheet){sheet.hidden=false;document.body.style.overflow="hidden"}};

  const install=async()=>{
    installStarted=true;
    setStatus("working","Preparing for airplane mode…",{force:true});
    confirmOfflineReady({showResult:true});
    if(isStandalone){location.href="./app.html";return}
    if(deferredPrompt){
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt=null;
      return;
    }
    if(!sheet||!steps)return;
    if(isIOS&&isSafari&&!isEmbedded){
      label.textContent="Install on iPhone";
      title.textContent="Three taps and you’re ready to fly";
      steps.innerHTML=step("1","Tap Safari’s Share button","Look for the square with the upward arrow at the bottom of the screen.")+step("2","Tap Add to Home Screen","Scroll the action list if it is not immediately visible.")+step("3","Turn on Open as Web App, then tap Add","Cabin Drinks will appear on your Home Screen like an app.");
      continueButton.textContent="Show me the app first";
      continueButton.onclick=()=>{location.href="./app.html"};
    }else if(isIOS){
      label.textContent="One quick detour";
      title.textContent="Open this page in Safari to install";
      steps.innerHTML=step("1","Open the browser menu","In Facebook, Instagram, or Chrome, find Share or the ••• menu.")+step("2","Choose Open in Safari","Safari is required to add this web app to your iPhone Home Screen.")+step("3","Return and tap Install Cabin Drinks","We’ll show the final three taps.");
      continueButton.textContent="Copy this page’s address";
      continueButton.onclick=async()=>{await navigator.clipboard?.writeText(location.href);continueButton.textContent="Address copied"};
    }else if(isAndroid){
      label.textContent="Install on Android";
      title.textContent="Add Cabin Drinks to your Home Screen";
      steps.innerHTML=step("1","Open Chrome’s menu","Tap the three dots near the address bar.")+step("2","Tap Install app","It may also say Add to Home screen.")+step("3","Confirm Install","Open Cabin Drinks once while online to prepare it for airplane mode.");
      continueButton.textContent="Got it";
      continueButton.onclick=closeSheet;
    }else{
      label.textContent="Install Cabin Drinks";
      title.textContent="Use your browser’s app install option";
      steps.innerHTML=step("1","Open the browser menu","Look for Install app, Add to Home Screen, or Add to Dock.")+step("2","Confirm installation","Cabin Drinks will open in its own app window.")+step("3","Open it once while online","Cabin Drinks will then be ready for airplane mode.");
      continueButton.textContent="Got it";
      continueButton.onclick=closeSheet;
    }
    openSheet();
  };

  document.querySelectorAll("#installButton,#installButtonSecondary").forEach(button=>button.addEventListener("click",install));
  document.querySelectorAll("[data-close-install]").forEach(button=>button.addEventListener("click",closeSheet));
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeSheet()});
})();