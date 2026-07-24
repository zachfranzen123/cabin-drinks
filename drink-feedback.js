const applyDrinkSelectionFeedback=()=>{
  const editorTitle=document.querySelector('.drink-editor .editor-title strong');
  const activeName=editorTitle?.textContent?.replace(/^Edit\s+/,'').trim();
  document.querySelectorAll('.drink-grid [data-drink]').forEach(button=>{
    const selected=Boolean(activeName)&&button.dataset.drink===activeName;
    button.classList.toggle('selected-choice',selected);
    button.setAttribute('aria-pressed',selected?'true':'false');
    const action=button.querySelector('em');
    if(action)action.textContent=selected?'Added ✓':'+ Add';
  });
};

const feedbackStyle=document.createElement('style');
feedbackStyle.textContent=`
.drink-grid [data-drink]{transition:border-color .18s ease,background .18s ease,box-shadow .18s ease,transform .18s ease}.drink-grid [data-drink].selected-choice{border-color:#ff554d!important;background:#fff0ed!important;box-shadow:0 0 0 3px rgba(255,85,77,.16),0 8px 20px rgba(255,85,77,.12);transform:translateY(-1px)}.drink-grid [data-drink].selected-choice strong{color:#d9443d}.drink-grid [data-drink].selected-choice em{color:#d9443d;font-weight:900}html[data-theme="dark"] .drink-grid [data-drink].selected-choice{border-color:#ff756e!important;background:#321d1b!important;box-shadow:0 0 0 3px rgba(255,117,110,.16)}html[data-theme="dark"] .drink-grid [data-drink].selected-choice strong,html[data-theme="dark"] .drink-grid [data-drink].selected-choice em{color:#ff928c}@media(prefers-reduced-motion:reduce){.drink-grid [data-drink]{transition:none!important}}
`;
document.head.appendChild(feedbackStyle);

const observer=new MutationObserver(applyDrinkSelectionFeedback);
const appRoot=document.querySelector('#app');
if(appRoot)observer.observe(appRoot,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',applyDrinkSelectionFeedback);
applyDrinkSelectionFeedback();
