if(window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)location.replace("./app.html");
document.querySelector("#shareButton").addEventListener("click",async()=>{const data={title:"Cabin Drinks",text:"An offline-friendly beverage service pad for flight crews.",url:location.href};if(navigator.share){try{await navigator.share(data)}catch{}}else{await navigator.clipboard.writeText(location.href);alert("Link copied")}});
document.querySelector("#feedbackForm").addEventListener("submit",event=>{event.preventDefault();const name=document.querySelector("#feedbackName").value.trim();const message=document.querySelector("#feedbackMessage").value.trim();location.href=`mailto:zach@hizach.com?subject=${encodeURIComponent("Cabin Drinks feedback")}&body=${encodeURIComponent(`${message}\n\nFrom: ${name||"A Cabin Drinks user"}`)}`});

const currentVersion=document.querySelector(".current-version");
if(currentVersion)currentVersion.textContent="Version 13 · Current";
const version12=[...document.querySelectorAll(".release")].find(item=>item.querySelector("b")?.textContent.trim()==="Version 12");
if(version12){version12.open=false;const label=version12.querySelector("em");if(label)label.textContent="July 2026"}
