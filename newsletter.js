const mountNewsletter=()=>{
  if(document.querySelector('.crew-updates'))return;
  const anchor=document.querySelector('.meet-zach')||document.querySelector('#versions');
  if(!anchor)return;
  const section=document.createElement('section');
  section.className='crew-updates';
  section.id='crew-updates';
  section.setAttribute('aria-labelledby','crew-updates-title');
  section.innerHTML=`
    <div class="crew-updates-card">
      <div class="crew-updates-copy">
        <p class="eyebrow">Stay in the loop</p>
        <h2 id="crew-updates-title">Help shape Cabin Drinks.</h2>
        <p>Get occasional notes about meaningful new features, fixes, and opportunities to try what’s coming next.</p>
        <div class="crew-update-points" aria-label="What subscribers receive">
          <span>✓ Major feature updates</span><span>✓ Beta testing invitations</span><span>✓ Important fixes</span>
        </div>
      </div>
      <form class="crew-updates-form" novalidate>
        <label for="crewEmail">Email address</label>
        <div class="crew-input-row">
          <input id="crewEmail" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required maxlength="254">
          <button type="submit">Join the Crew</button>
        </div>
        <p class="crew-form-note">Occasional updates only. Unsubscribe anytime.</p>
        <p class="crew-form-status" role="status" aria-live="polite"></p>
      </form>
    </div>`;
  anchor.parentNode.insertBefore(section,anchor);

  const navActions=document.querySelector('.nav-actions');
  const oldBugLink=navActions?.querySelector('.bug-nav-link');
  if(oldBugLink){
    oldBugLink.href='#crew-updates';
    oldBugLink.removeAttribute('target');
    oldBugLink.removeAttribute('rel');
    oldBugLink.textContent='Get Updates';
    oldBugLink.classList.add('updates-nav-link');
  }

  const guide=document.querySelector('.guide');
  const features=document.querySelector('.features');
  if(guide&&features){
    features.parentNode.insertBefore(guide,features);
    features.remove();
  }
  const flowIntro=document.querySelector('.flow-heading > p:last-child');
  if(flowIntro)flowIntro.textContent='See how Cabin Drinks moves an order from the seat map to a completed delivery.';

  const style=document.createElement('style');
  style.textContent=`
  html{scroll-behavior:smooth}.updates-nav-link{background:#239b90!important}.crew-updates{scroll-margin-top:82px;padding:88px max(22px,calc((100vw - 1120px)/2));background:#eef0eb;color:#202423}.crew-updates-card{position:relative;overflow:hidden;display:grid;grid-template-columns:1.05fr .95fr;gap:64px;align-items:center;padding:clamp(30px,5vw,62px);border-radius:32px;background:#fff;box-shadow:0 24px 70px rgba(32,36,35,.1)}.crew-updates-card:after{content:"✈";position:absolute;right:-22px;top:-56px;font-size:190px;line-height:1;color:#dff1ed;transform:rotate(-12deg);pointer-events:none}.crew-updates-copy,.crew-updates-form{position:relative;z-index:1}.crew-updates h2{margin:.25rem 0 .9rem;font-size:clamp(38px,5vw,62px);line-height:.98;letter-spacing:-.055em}.crew-updates-copy>p:last-of-type{max-width:620px;color:#626865;font-size:17px;line-height:1.55}.crew-update-points{display:flex;flex-wrap:wrap;gap:9px;margin-top:24px}.crew-update-points span{padding:8px 11px;border-radius:999px;background:#e8f6f1;color:#246e62;font-size:13px;font-weight:800}.crew-updates-form{padding:24px;border:1px solid #dfe3de;border-radius:22px;background:#f7f4ee}.crew-updates-form label{display:block;margin-bottom:9px;font-size:13px;font-weight:850}.crew-input-row{display:grid;grid-template-columns:1fr auto;gap:10px}.crew-input-row input{min-width:0;height:54px;padding:0 16px;border:1px solid #b8bfba;border-radius:14px;background:#fff;color:#202423;font:inherit;font-size:16px;outline:none}.crew-input-row input:focus{border-color:#239b90;box-shadow:0 0 0 4px rgba(35,155,144,.13)}.crew-input-row button{min-height:54px;padding:0 20px;border:0;border-radius:14px;background:#202423;color:#fff;font-weight:850;white-space:nowrap;cursor:pointer;transition:transform .18s ease,background .18s ease}.crew-input-row button:hover,.crew-input-row button:focus-visible{background:#2d3431;transform:translateY(-1px)}.crew-input-row button:disabled{cursor:wait;opacity:.7;transform:none}.crew-form-note,.crew-form-status{margin:10px 2px 0;font-size:12px;line-height:1.4}.crew-form-note{color:#747b77}.crew-form-status{min-height:18px;font-weight:750}.crew-form-status.success{color:#246e62}.crew-form-status.error{color:#a53b31}.crew-updates-form.is-success .crew-input-row button{background:#2f8f78}.crew-updates-form.is-success input{border-color:#79b9aa;background:#f1faf7}@media(max-width:800px){.crew-updates{padding:70px 20px}.crew-updates-card{grid-template-columns:1fr;gap:30px;padding:30px 22px}.crew-updates-card:after{font-size:130px}.crew-input-row{grid-template-columns:1fr}.crew-input-row button{width:100%}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.crew-input-row button{transition:none}}
  `;
  document.head.appendChild(style);

  const form=section.querySelector('form');
  const input=form.querySelector('input');
  const button=form.querySelector('button');
  const status=form.querySelector('.crew-form-status');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const email=input.value.trim().toLowerCase();
    status.className='crew-form-status';
    if(!input.validity.valid||!email){status.textContent='Please enter a valid email address.';status.classList.add('error');input.focus();return;}
    button.disabled=true;button.textContent='Joining…';status.textContent='';
    try{
      const response=await fetch('/api/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'Something went wrong. Please try again.');
      form.classList.add('is-success');input.disabled=true;button.textContent='✓ You’re on the list';
      if(data.alreadySubscribed)status.textContent='You were already signed up — welcome back!';
      else if(data.welcomeEmail===false)status.textContent='You’re on the list. The welcome email could not be delivered, but your signup was saved.';
      else status.textContent='Welcome aboard! Check your inbox for a welcome email.';
      status.classList.add('success');
    }catch(error){button.disabled=false;button.textContent='Join the Crew';status.textContent=error.message||'Something went wrong. Please try again.';status.classList.add('error');}
  });
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountNewsletter);else mountNewsletter();