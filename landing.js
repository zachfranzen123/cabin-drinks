if(window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)location.replace("./app.html");

const shareUrl="https://drinks.hizach.com/";
const shareData={title:"Cabin Drinks",text:"An offline-friendly food and beverage service pad for flight crews.",url:shareUrl};
const shareButton=document.querySelector("#shareButton");

const shareSheet=document.createElement("div");
shareSheet.className="share-sheet";
shareSheet.hidden=true;
shareSheet.innerHTML=`
  <button class="share-backdrop" type="button" aria-label="Close sharing options"></button>
  <section class="share-panel" role="dialog" aria-modal="true" aria-labelledby="shareTitle">
    <button class="share-close" type="button" aria-label="Close">×</button>
    <img class="share-app-icon" src="./app-icon.svg" alt="">
    <p class="eyebrow">Share Cabin Drinks</p>
    <h2 id="shareTitle">Help another crew member get started.</h2>
    <p class="share-intro">Share the link, copy it, or let someone scan the QR code directly from your phone.</p>
    <div class="share-actions">
      <button id="nativeShareButton" class="primary" type="button">Share Link</button>
      <button id="copyShareButton" class="copy-link-button" type="button">Copy Link</button>
    </div>
    <div class="qr-card">
      <div class="qr-code-wrap">
        <img id="shareQrCode" class="qr-code" alt="QR code for Cabin Drinks" crossorigin="anonymous">
        <span class="qr-logo"><img src="./app-icon.svg" alt="" crossorigin="anonymous"></span>
      </div>
      <strong>Scan to open Cabin Drinks</strong>
      <span>drinks.hizach.com</span>
      <div class="qr-actions">
        <button id="saveQrButton" type="button">Save QR Code</button>
        <button id="shareQrButton" type="button">Share QR Image</button>
      </div>
      <small id="qrActionStatus" class="qr-action-status" role="status" aria-live="polite"></small>
    </div>
  </section>`;
document.body.appendChild(shareSheet);

const qrImage=shareSheet.querySelector("#shareQrCode");
qrImage.src=`https://api.qrserver.com/v1/create-qr-code/?size=900x900&ecc=H&margin=22&data=${encodeURIComponent(shareUrl)}`;
const closeShare=()=>{shareSheet.classList.remove("is-open");setTimeout(()=>{shareSheet.hidden=true},180);document.body.style.overflow=""};
const openShare=()=>{shareSheet.hidden=false;document.body.style.overflow="hidden";requestAnimationFrame(()=>shareSheet.classList.add("is-open"))};
shareButton?.addEventListener("click",openShare);
shareSheet.querySelector(".share-backdrop")?.addEventListener("click",closeShare);
shareSheet.querySelector(".share-close")?.addEventListener("click",closeShare);
shareSheet.querySelector("#nativeShareButton")?.addEventListener("click",async()=>{if(navigator.share){try{await navigator.share(shareData)}catch{}}else{await navigator.clipboard.writeText(shareUrl);alert("Link copied")}});
shareSheet.querySelector("#copyShareButton")?.addEventListener("click",async event=>{await navigator.clipboard.writeText(shareUrl);const button=event.currentTarget;const original=button.textContent;button.textContent="Copied ✓";button.classList.add("copied");setTimeout(()=>{button.textContent=original;button.classList.remove("copied")},1800)});

document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!shareSheet.hidden)closeShare()});

const qrStatus=shareSheet.querySelector("#qrActionStatus");
const setQrStatus=message=>{qrStatus.textContent=message;setTimeout(()=>{if(qrStatus.textContent===message)qrStatus.textContent=""},2600)};
const loadImage=src=>new Promise((resolve,reject)=>{const image=new Image();image.crossOrigin="anonymous";image.onload=()=>resolve(image);image.onerror=reject;image.src=src});
const buildQrFile=async()=>{
  const [qr,icon]=await Promise.all([loadImage(qrImage.src),loadImage(new URL("./app-icon.svg",location.href).href)]);
  const canvas=document.createElement("canvas");
  canvas.width=1080;canvas.height=1320;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#f7f4ee";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#202423";ctx.textAlign="center";ctx.font="700 58px system-ui,-apple-system,sans-serif";ctx.fillText("Cabin Drinks",540,90);
  ctx.font="400 30px system-ui,-apple-system,sans-serif";ctx.fillStyle="#626865";ctx.fillText("Scan to open the offline service pad",540,140);
  const qrSize=850,qrX=(canvas.width-qrSize)/2,qrY=190;
  ctx.fillStyle="#fff";ctx.beginPath();ctx.roundRect(qrX-24,qrY-24,qrSize+48,qrSize+48,36);ctx.fill();
  ctx.drawImage(qr,qrX,qrY,qrSize,qrSize);
  const iconSize=175,iconX=(canvas.width-iconSize)/2,iconY=qrY+(qrSize-iconSize)/2;
  ctx.fillStyle="#fff";ctx.beginPath();ctx.roundRect(iconX-18,iconY-18,iconSize+36,iconSize+36,34);ctx.fill();ctx.drawImage(icon,iconX,iconY,iconSize,iconSize);
  ctx.fillStyle="#202423";ctx.font="700 38px system-ui,-apple-system,sans-serif";ctx.fillText("drinks.hizach.com",540,1135);
  ctx.font="500 27px system-ui,-apple-system,sans-serif";ctx.fillStyle="#626865";ctx.fillText("Free · Private · Ready for airplane mode",540,1190);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png",1));
  return new File([blob],"cabin-drinks-qr.png",{type:"image/png"});
};

shareSheet.querySelector("#saveQrButton")?.addEventListener("click",async()=>{
  try{const file=await buildQrFile();const link=document.createElement("a");link.href=URL.createObjectURL(file);link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);setQrStatus("QR code saved ✓")}catch{setQrStatus("Couldn’t save the image. Try Share QR Image.")}
});
shareSheet.querySelector("#shareQrButton")?.addEventListener("click",async()=>{
  try{const file=await buildQrFile();if(navigator.canShare?.({files:[file]})){await navigator.share({title:"Cabin Drinks",text:"Scan to open Cabin Drinks",files:[file]})}else{const link=document.createElement("a");link.href=URL.createObjectURL(file);link.download=file.name;link.click();setQrStatus("QR image downloaded ✓")}}catch{setQrStatus("Couldn’t share the QR image.")}
});

const bugUrl="https://github.com/zachfranzen123/cabin-drinks/issues/new?template=bug_report.yml";
const featureUrl="https://github.com/zachfranzen123/cabin-drinks/issues/new?template=feature_request.yml";
const issuesUrl="https://github.com/zachfranzen123/cabin-drinks/issues";

const navActions=document.querySelector(".nav-actions");
if(navActions&&!navActions.querySelector(".bug-nav-link")){
  const bugLink=document.createElement("a");
  bugLink.className="bug-nav-link";bugLink.href=bugUrl;bugLink.target="_blank";bugLink.rel="noopener noreferrer";bugLink.textContent="Report a Bug";navActions.insertBefore(bugLink,shareButton);
}

const feedbackSection=document.querySelector(".feedback");
if(feedbackSection){feedbackSection.innerHTML=`<div class="feedback-intro"><p class="eyebrow">Help improve it</p><h2>Found something—or have an idea?</h2><p>Cabin Drinks gets better through crew feedback. Choose an option below to send a structured report through GitHub.</p><p class="feedback-privacy"><strong>Please don’t include passenger names, flight numbers, or other private information.</strong></p><a class="feedback-email" href="mailto:zach@hizach.com">Prefer email? zach@hizach.com</a></div><div class="github-feedback-actions" aria-label="Cabin Drinks feedback options"><a class="github-feedback-card bug" href="${bugUrl}" target="_blank" rel="noopener noreferrer"><span class="github-feedback-icon" aria-hidden="true">🐞</span><span><strong>Report a Bug</strong><small>Tell me what broke, what device you used, and how to reproduce it.</small></span><i aria-hidden="true">↗</i></a><a class="github-feedback-card feature" href="${featureUrl}" target="_blank" rel="noopener noreferrer"><span class="github-feedback-icon" aria-hidden="true">💡</span><span><strong>Suggest a Feature</strong><small>Share an idea that could make inflight service easier.</small></span><i aria-hidden="true">↗</i></a><a class="github-feedback-card roadmap" href="${issuesUrl}" target="_blank" rel="noopener noreferrer"><span class="github-feedback-icon" aria-hidden="true">📋</span><span><strong>View Feedback &amp; Progress</strong><small>See open reports, requests, and completed improvements.</small></span><i aria-hidden="true">↗</i></a></div>`}

const guide=document.querySelector(".guide");
if(guide){
  guide.innerHTML=`
    <div class="walkthrough-heading">
      <p class="eyebrow">See it in action</p>
      <h2>One order. Four simple moments.</h2>
      <p>Follow seat 7A from the first tap to a completed delivery.</p>
    </div>
    <div class="walkthrough" aria-label="Animated walkthrough of a Cabin Drinks order">
      <div class="walkthrough-phone" aria-hidden="true">
        <div class="walkthrough-screen active" data-screen="0"><span class="screen-label">PREMIUM</span><strong>Choose a seat</strong><div class="mini-seat-map"><i>6A</i><i>6B</i><i>6C</i><i class="selected">7A</i><i>7B</i><i>7C</i></div></div>
        <div class="walkthrough-screen" data-screen="1"><span class="screen-label">SEAT 7A</span><strong>Add the order</strong><div class="drink-chip">Tito’s + Cranberry</div><div class="drink-chip secondary-chip">Ice · Lime</div></div>
        <div class="walkthrough-screen" data-screen="2"><span class="screen-label">PREPARE</span><strong>Galley tally</strong><div class="prep-row"><span>Tito’s</span><b>1</b></div><div class="prep-row"><span>Cranberry juice</span><b>1</b></div><div class="prep-row"><span>Lime</span><b>1</b></div></div>
        <div class="walkthrough-screen" data-screen="3"><span class="screen-label">DELIVER</span><strong>Seat 7A</strong><div class="delivery-card"><span>Tito’s + Cranberry</span><small>Ice · Lime</small></div><div class="delivered-check">✓ Delivered</div></div>
      </div>
      <div class="walkthrough-steps" role="list">
        <button class="walkthrough-step active" type="button" data-step="0" role="listitem"><span>01</span><div><strong>Tap the seat</strong><small>Choose 7A as you walk the cabin.</small></div></button>
        <button class="walkthrough-step" type="button" data-step="1" role="listitem"><span>02</span><div><strong>Add the drink</strong><small>Build the order with modifiers.</small></div></button>
        <button class="walkthrough-step" type="button" data-step="2" role="listitem"><span>03</span><div><strong>Prepare in the galley</strong><small>See instant totals and instructions.</small></div></button>
        <button class="walkthrough-step" type="button" data-step="3" role="listitem"><span>04</span><div><strong>Deliver and clear</strong><small>Tap once when the order is served.</small></div></button>
      </div>
    </div>`;

  const steps=[...guide.querySelectorAll(".walkthrough-step")];
  const screens=[...guide.querySelectorAll(".walkthrough-screen")];
  let current=0;
  let timer;
  const showStep=index=>{
    current=index;
    steps.forEach((step,i)=>step.classList.toggle("active",i===index));
    screens.forEach((screen,i)=>screen.classList.toggle("active",i===index));
  };
  const start=()=>{clearInterval(timer);timer=setInterval(()=>showStep((current+1)%steps.length),2600)};
  steps.forEach((step,index)=>step.addEventListener("click",()=>{showStep(index);start()}));
  if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)start();
}

const style=document.createElement("style");
style.textContent=`
.bug-nav-link{display:inline-flex;align-items:center;min-height:38px;padding:0 14px;border-radius:999px;background:#e85d3f;color:#fff!important;font-weight:800;text-decoration:none;white-space:nowrap}.bug-nav-link:hover,.bug-nav-link:focus-visible{filter:brightness(1.06);transform:translateY(-1px)}
.feedback-email{display:inline-block;margin-top:.6rem;font-weight:700}.feedback-privacy{margin-top:1rem;font-size:.82rem;line-height:1.45;opacity:.78}.github-feedback-actions{display:grid;gap:.8rem;align-content:start}.github-feedback-card{display:grid;grid-template-columns:auto 1fr auto;gap:.85rem;align-items:center;padding:1rem 1.05rem;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:rgba(255,255,255,.07);color:inherit;text-decoration:none;transition:transform .18s ease,border-color .18s ease,background .18s ease}.github-feedback-card:hover,.github-feedback-card:focus-visible{transform:translateY(-2px);border-color:rgba(255,255,255,.34);background:rgba(255,255,255,.12)}.github-feedback-card strong,.github-feedback-card small{display:block}.github-feedback-card strong{font-size:1.04rem;margin-bottom:.22rem}.github-feedback-card small{font-size:.84rem;line-height:1.35;opacity:.76}.github-feedback-card i{font-style:normal;font-size:1.1rem;opacity:.65}.github-feedback-icon{display:grid;place-items:center;width:2.8rem;height:2.8rem;border-radius:13px;background:rgba(255,255,255,.1);font-size:1.3rem}
.share-sheet[hidden]{display:none}.share-sheet{position:fixed;inset:0;z-index:1000;display:grid;align-items:end}.share-backdrop{position:absolute;inset:0;border:0;background:rgba(0,0,0,.68);backdrop-filter:blur(7px);opacity:0;transition:opacity .18s ease}.share-panel{position:relative;width:min(100%,560px);max-height:92vh;margin:0 auto;padding:28px 22px calc(24px + env(safe-area-inset-bottom));overflow:auto;border-radius:28px 28px 0 0;background:#f7f4ee;color:#202423;box-shadow:0 -18px 60px rgba(0,0,0,.35);text-align:center;transform:translateY(28px);opacity:.4;transition:transform .24s cubic-bezier(.2,.8,.2,1),opacity .2s ease}.share-sheet.is-open .share-backdrop{opacity:1}.share-sheet.is-open .share-panel{transform:translateY(0);opacity:1}.share-close{position:absolute;top:14px;right:16px;width:38px;height:38px;border:0;border-radius:50%;background:rgba(32,36,35,.09);color:#202423;font-size:25px}.share-app-icon{width:62px;height:62px;border-radius:16px;box-shadow:0 8px 22px rgba(0,0,0,.16)}.share-panel h2{margin:.35rem 0 .55rem;font-size:clamp(1.65rem,6vw,2.2rem)}.share-intro{margin:0 auto 18px;max-width:430px;color:#626865;line-height:1.5}.share-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}.share-actions button{min-height:52px}.copy-link-button{border:2px solid #68706d!important;background:#fff!important;color:#202423!important;font-weight:800!important}.copy-link-button:hover,.copy-link-button:focus-visible{background:#eef0ec!important}.copy-link-button.copied{border-color:#2f8f78!important;color:#246e5e!important;background:#e8f6f1!important}.qr-card{padding:18px;border:1px solid rgba(32,36,35,.12);border-radius:22px;background:#fff;transform:scale(.96);opacity:0;transition:transform .35s .1s cubic-bezier(.2,.9,.2,1),opacity .3s .1s ease}.share-sheet.is-open .qr-card{transform:scale(1);opacity:1}.qr-code-wrap{position:relative;width:min(72vw,290px);aspect-ratio:1;margin:0 auto 14px;padding:8px;background:#fff}.qr-code{display:block;width:100%;height:100%}.qr-logo{position:absolute;left:50%;top:50%;display:grid;place-items:center;width:21%;aspect-ratio:1;transform:translate(-50%,-50%);padding:7px;border-radius:22%;background:#fff;box-shadow:0 0 0 5px #fff}.qr-logo img{width:100%;height:100%;border-radius:18%}.qr-card strong,.qr-card span{display:block}.qr-card>span{margin-top:4px;color:#69706d;font-size:.9rem}.qr-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.qr-actions button{min-height:46px;padding:0 12px;border:1px solid #b7bcb9;border-radius:13px;background:#f7f4ee;color:#202423;font-weight:800}.qr-actions button:hover,.qr-actions button:focus-visible{background:#ece9e2}.qr-action-status{display:block;min-height:1.25rem;margin-top:9px;color:#2f7666;font-weight:700}
.guide{max-width:none!important;padding:92px max(22px,calc((100vw - 1060px)/2))!important;background:#202423;color:#fff}.walkthrough-heading{max-width:680px}.walkthrough-heading h2{margin:0;font-size:clamp(38px,6vw,66px);line-height:.98;letter-spacing:-.055em}.walkthrough-heading>p:last-child{margin:18px 0 0;color:#b8c0bc;font-size:17px}.walkthrough{margin-top:42px;display:grid;grid-template-columns:minmax(280px,.82fr) 1.18fr;gap:58px;align-items:center}.walkthrough-phone{position:relative;min-height:470px;padding:20px;border:7px solid #4c5350;border-radius:42px;background:#f4efe6;box-shadow:0 28px 75px rgba(0,0,0,.38);overflow:hidden}.walkthrough-screen{position:absolute;inset:20px;display:flex;flex-direction:column;padding:24px;border-radius:24px;background:#fffaf3;color:#252927;opacity:0;transform:translateX(22px) scale(.98);transition:opacity .42s ease,transform .42s cubic-bezier(.2,.8,.2,1);pointer-events:none}.walkthrough-screen.active{opacity:1;transform:translateX(0) scale(1)}.screen-label{color:#239b90;font-size:11px;font-weight:900;letter-spacing:.12em}.walkthrough-screen>strong{margin-top:7px;font-size:27px;letter-spacing:-.035em}.mini-seat-map{margin-top:28px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.mini-seat-map i{min-height:60px;display:grid;place-items:center;border:1px solid #d8d1c5;border-radius:14px;background:#fff;font-style:normal;font-weight:850}.mini-seat-map i.selected{color:#fff;border-color:#f65346;background:#f65346;box-shadow:0 10px 24px rgba(246,83,70,.25)}.drink-chip{margin-top:28px;padding:18px;border-radius:16px;background:#202423;color:#fff;font-weight:850}.secondary-chip{margin-top:10px;background:#dff1ed;color:#246e62}.prep-row{margin-top:14px;padding:14px 0;display:flex;justify-content:space-between;border-bottom:1px solid #d8d1c5}.prep-row:first-of-type{margin-top:28px}.prep-row b{color:#239b90}.delivery-card{margin-top:28px;padding:20px;border:1px solid #d8d1c5;border-radius:18px;background:#fff}.delivery-card span,.delivery-card small{display:block}.delivery-card span{font-weight:850}.delivery-card small{margin-top:5px;color:#6e746f}.delivered-check{margin-top:auto;padding:16px;border-radius:14px;background:#dff1ed;color:#246e62;text-align:center;font-weight:900}.walkthrough-steps{display:grid;gap:10px}.walkthrough-step{width:100%;padding:18px 20px;display:grid;grid-template-columns:48px 1fr;gap:14px;align-items:center;border:1px solid rgba(255,255,255,.13);border-radius:18px;background:rgba(255,255,255,.045);color:#fff;text-align:left;transition:background .25s ease,border-color .25s ease,transform .25s ease}.walkthrough-step:hover,.walkthrough-step:focus-visible{background:rgba(255,255,255,.08)}.walkthrough-step.active{border-color:#69c7bd;background:rgba(105,199,189,.13);transform:translateX(7px)}.walkthrough-step>span{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.09);color:#69c7bd;font-weight:900}.walkthrough-step.active>span{background:#69c7bd;color:#202423}.walkthrough-step strong,.walkthrough-step small{display:block}.walkthrough-step strong{font-size:1rem}.walkthrough-step small{margin-top:4px;color:#aeb7b2;font-size:.84rem;line-height:1.35}
@media(max-width:760px){.history-link{display:none}.bug-nav-link{padding:0 11px;font-size:.82rem}.github-feedback-card{padding:.95rem}.github-feedback-card small{font-size:.8rem}.walkthrough{grid-template-columns:1fr;gap:28px}.walkthrough-phone{min-height:430px;max-width:360px;width:100%;margin:auto}.walkthrough-step.active{transform:none}.guide{padding:72px 20px!important}}@media(max-width:430px){.share-actions,.qr-actions{grid-template-columns:1fr}.share-panel{padding-left:16px;padding-right:16px}.walkthrough-phone{min-height:400px;padding:15px;border-width:6px;border-radius:35px}.walkthrough-screen{inset:15px;padding:20px}.walkthrough-step{padding:14px;grid-template-columns:42px 1fr}.walkthrough-step>span{width:38px;height:38px}}
@media(prefers-reduced-motion:reduce){.share-backdrop,.share-panel,.qr-card,.walkthrough-screen,.walkthrough-step{transition:none!important}.walkthrough-screen{transform:none!important}}
`;
document.head.appendChild(style);

const currentVersion=document.querySelector(".current-version");if(currentVersion)currentVersion.textContent="Version 14 · Current";
const version12=[...document.querySelectorAll(".release")].find(item=>item.querySelector("b")?.textContent.trim()==="Version 12");if(version12){version12.open=false;const label=version12.querySelector("em");if(label)label.textContent="July 2026"}
