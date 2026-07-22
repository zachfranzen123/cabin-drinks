if(window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)location.replace("./app.html");
document.querySelector("#shareButton").addEventListener("click",async()=>{const data={title:"Cabin Drinks",text:"An offline-friendly beverage service pad for flight crews.",url:location.href};if(navigator.share){try{await navigator.share(data)}catch{}}else{await navigator.clipboard.writeText(location.href);alert("Link copied")}});

const feedbackSection=document.querySelector(".feedback");
if(feedbackSection){
  feedbackSection.innerHTML=`
    <div>
      <p class="eyebrow">Help improve it</p>
      <h2>Found something—or have an idea?</h2>
      <p>Cabin Drinks gets better through crew feedback. GitHub makes it easier to report a problem, suggest an improvement, and follow its progress.</p>
      <a class="feedback-email" href="mailto:zach@hizach.com">Prefer email? zach@hizach.com</a>
    </div>
    <div class="github-feedback-actions" aria-label="Cabin Drinks feedback options">
      <a class="github-feedback-card bug" href="https://github.com/zachfranzen123/cabin-drinks/issues/new?template=bug_report.yml" target="_blank" rel="noopener noreferrer">
        <span class="github-feedback-icon" aria-hidden="true">🐞</span>
        <span><strong>Report a Bug</strong><small>Tell me what happened and how to reproduce it.</small></span>
        <i aria-hidden="true">↗</i>
      </a>
      <a class="github-feedback-card feature" href="https://github.com/zachfranzen123/cabin-drinks/issues/new?template=feature_request.yml" target="_blank" rel="noopener noreferrer">
        <span class="github-feedback-icon" aria-hidden="true">💡</span>
        <span><strong>Suggest a Feature</strong><small>Share an idea that could make inflight service easier.</small></span>
        <i aria-hidden="true">↗</i>
      </a>
      <a class="github-feedback-card roadmap" href="https://github.com/zachfranzen123/cabin-drinks/issues" target="_blank" rel="noopener noreferrer">
        <span class="github-feedback-icon" aria-hidden="true">📋</span>
        <span><strong>View Feedback &amp; Progress</strong><small>See reported issues, requests, and updates.</small></span>
        <i aria-hidden="true">↗</i>
      </a>
    </div>`;

  const style=document.createElement("style");
  style.textContent=`
    .feedback-email{display:inline-block;margin-top:.6rem;font-weight:700}
    .github-feedback-actions{display:grid;gap:.8rem;align-content:start}
    .github-feedback-card{display:grid;grid-template-columns:auto 1fr auto;gap:.85rem;align-items:center;padding:1rem 1.05rem;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.06);color:inherit;text-decoration:none;transition:transform .18s ease,border-color .18s ease,background .18s ease}
    .github-feedback-card:hover,.github-feedback-card:focus-visible{transform:translateY(-2px);border-color:rgba(255,255,255,.28);background:rgba(255,255,255,.1)}
    .github-feedback-card strong,.github-feedback-card small{display:block}
    .github-feedback-card strong{font-size:1rem;margin-bottom:.2rem}
    .github-feedback-card small{font-size:.84rem;line-height:1.35;opacity:.72}
    .github-feedback-card i{font-style:normal;font-size:1.1rem;opacity:.65}
    .github-feedback-icon{display:grid;place-items:center;width:2.6rem;height:2.6rem;border-radius:13px;background:rgba(255,255,255,.09);font-size:1.25rem}
    @media (max-width:720px){.github-feedback-card{padding:.95rem}.github-feedback-card small{font-size:.8rem}}
  `;
  document.head.appendChild(style);
}

const currentVersion=document.querySelector(".current-version");
if(currentVersion)currentVersion.textContent="Version 14 · Current";
const version12=[...document.querySelectorAll(".release")].find(item=>item.querySelector("b")?.textContent.trim()==="Version 12");
if(version12){version12.open=false;const label=version12.querySelector("em");if(label)label.textContent="July 2026"}
