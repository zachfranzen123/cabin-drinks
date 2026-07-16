const aircraft = ["737-700", "737-800", "737 MAX 8", "737-900", "737 MAX 9"];
const premiumSeatLetters = ["A", "B", "C", "D", "E", "F"];
const firstSeatLetters = ["A", "C", "D", "F"];
const menu = {
  "Mixers": ["Tonic Water", "Polar Original Seltzer", "Polar Cranberry Lime Seltzer", "Canada Dry Ginger Ale", "Bloody Mary Mix"],
  "Sodas": ["Coca-Cola", "Diet Coke", "Coke Zero", "Sprite"],
  "Alcohol": ["Broken Earth Red Blend", "Waterbrook White Blend", "Cuvée 89 Brut Sparkling Wine", "Fremont Cloud Cruiser IPA", "Fremont Golden Pilsner", "Jack Daniel’s Whiskey", "Buffalo Trace Bourbon", "Glenfarclas Scotch", "Dulce Vida Organic Tequila Blanco", "Bacardí Rum", "Aviation Gin", "Tito’s Handmade Vodka", "Crater Lake Hazelnut Espresso Vodka", "Five Farms Irish Cream", "Straightaway Blanco Margarita", "Straightaway Oregon Old Fashioned", "HOP WTR Blood Orange"],
  "Coffee & Teas": ["Stumptown Coffee", "Stumptown Decaf Coffee", "Stash English Breakfast Tea", "Stash Peppermint Tea", "Stash Jasmine Blossom Green Tea", "Stumptown Cold Brew Copilot"],
  "Juice & Water": ["Boxed Water", "Apple Juice", "Cranberry Juice", "Orange Juice", "Passion Orange Guava Juice"]
};
const shortNames = {
  "Broken Earth Red Blend":"Red Wine", "Waterbrook White Blend":"White Wine", "Cuvée 89 Brut Sparkling Wine":"Sparkling Wine",
  "Fremont Cloud Cruiser IPA":"Cloud Cruiser IPA", "Fremont Golden Pilsner":"Golden Pilsner", "Dulce Vida Organic Tequila Blanco":"Dulce Vida Tequila",
  "Crater Lake Hazelnut Espresso Vodka":"Espresso Vodka", "Straightaway Blanco Margarita":"Blanco Margarita", "Straightaway Oregon Old Fashioned":"Old Fashioned",
  "Stash Jasmine Blossom Green Tea":"Jasmine Green Tea", "Passion Orange Guava Juice":"POG Juice"
};

const saved = JSON.parse(localStorage.getItem("cabin-drinks-orders") || "{}");
// Transparently upgrade orders saved by the first version of the app.
Object.values(saved).forEach(order => {
  if (!order.drinks) order.drinks = [{drink:order.drink, category:order.category, modifiers:order.modifiers || [], creamer:null, creamQty:0, sugarQty:0}];
  order.drinks.forEach(drink => drink.qty = drink.qty || 1);
  delete order.drink; delete order.category; delete order.modifiers;
});
const state = {
  plane: localStorage.getItem("cabin-drinks-plane") || "737-900",
  cabin: localStorage.getItem("cabin-drinks-cabin") || "premium",
  seat: "8C", category: "Sodas", mode: "take", orders: saved, activeDrink: null
};
if (state.cabin === "first") state.seat = "1A";

const app = document.querySelector("#app");
const esc = value => String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const label = drink => shortNames[drink] || drink;
const orderList = () => Object.values(state.orders).sort((a,b) => parseInt(a.seat)-parseInt(b.seat) || a.seat.localeCompare(b.seat));
const drinkCount = () => orderList().reduce((sum, order) => sum + order.drinks.reduce((n, drink) => n + drink.qty, 0), 0);
const rows = () => state.cabin === "first" ? [1,2,3,4] : [6,7,8,9,10,16].concat(["737-900","737 MAX 9"].includes(state.plane) ? [17] : []);
const seatLetters = () => state.cabin === "first" ? firstSeatLetters : premiumSeatLetters;
const spirits = new Set(["Jack Daniel’s Whiskey","Buffalo Trace Bourbon","Glenfarclas Scotch","Dulce Vida Organic Tequila Blanco","Bacardí Rum","Aviation Gin","Tito’s Handmade Vodka","Crater Lake Hazelnut Espresso Vodka","Five Farms Irish Cream"]);
const drinkTitle = drink => drink.qty === 1 ? drink.drink : (drink.qty === 2 && spirits.has(drink.drink) ? `${drink.drink} · Double` : `${drink.drink} ×${drink.qty}`);
const isHot = drink => drink.category === "Coffee & Teas" && !drink.drink.includes("Cold Brew");
const modifiersFor = drink => drink.category === "Coffee & Teas"
  ? (drink.drink.includes("Cold Brew") ? ["Ice","No Ice","Sweetener"] : ["Sweetener","Lemon"])
  : ["Ice","No Ice","Lime","Lemon"];
const details = drink => {
  const parts = [...drink.modifiers];
  if (drink.creamQty) parts.push(`${drink.creamQty} ${drink.creamer === "Oat" ? "oat milk" : "dairy cream"}`);
  if (drink.sugarQty) parts.push(`${drink.sugarQty} sugar${drink.sugarQty === 1 ? "" : "s"}`);
  return parts.join(" · ") || "Standard";
};

function save() {
  localStorage.setItem("cabin-drinks-plane", state.plane);
  localStorage.setItem("cabin-drinks-cabin", state.cabin);
  localStorage.setItem("cabin-drinks-orders", JSON.stringify(state.orders));
}
function currentOrder() { return state.orders[state.seat]; }
function currentDrink() { const order=currentOrder(); return order && state.activeDrink !== null ? order.drinks[state.activeDrink] : null; }
function ensureSelection() { const order=currentOrder(); state.activeDrink = order?.drinks.length ? Math.min(state.activeDrink ?? order.drinks.length-1, order.drinks.length-1) : null; }

function header() {
  const count = orderList().filter(order => !order.delivered).reduce((sum, order) => sum + order.drinks.reduce((n, drink) => n + drink.qty, 0), 0);
  return `<header class="topbar"><div><p class="eyebrow">Offline service pad</p><h1>Cabin Drinks</h1></div><select data-action="plane" aria-label="Aircraft">${aircraft.map(item => `<option${item===state.plane?" selected":""}>${item}</option>`).join("")}</select></header>
  <nav class="mode-tabs" aria-label="Workflow"><button data-mode="take" class="${state.mode==="take"?"active":""}">Take orders</button><button data-mode="prepare" class="${state.mode==="prepare"?"active":""}">Prepare <span>${count}</span></button><button data-mode="deliver" class="${state.mode==="deliver"?"active":""}">Deliver</button></nav>`;
}

function quantityControl(kind, title, qty) {
  return `<div class="quantity-control"><span>${title}</span><div><button data-quantity="${kind}" data-delta="-1" aria-label="Less ${title}">−</button><strong>${qty}</strong><button data-quantity="${kind}" data-delta="1" aria-label="More ${title}">+</button></div></div>`;
}

function takeView() {
  ensureSelection();
  const order=currentOrder(), active=currentDrink();
  const map=rows().map(row => `<div class="seat-row ${row===16?"exit-start":""}">${row===16?`<div class="exit-label">EXIT ROW${rows().includes(17)?"S":""}</div>`:""}<strong>${row}</strong>${seatLetters().map(letter => { const seat=`${row}${letter}`, item=state.orders[seat], total=item?.drinks.reduce((n,drink)=>n+drink.qty,0); return `<button data-seat="${seat}" class="${state.seat===seat?"selected":""} ${item?"ordered":""}" aria-label="${seat}${item?`, ${total} drinks`:""}">${state.seat===seat?seat:letter}${item?`<span>${total}</span>`:""}</button>`; }).join("")}</div>`).join("");
  const drinks=menu[state.category].map(drink => `<button data-drink="${esc(drink)}"><strong>${esc(label(drink))}</strong>${label(drink)!==drink?`<span>${esc(drink)}</span>`:""}<em>+ Add</em></button>`).join("");
  const seatTotal=order?.drinks.reduce((n,drink)=>n+drink.qty,0)||0;
  const selectedDrinks = order?.drinks.length ? `<div class="seat-order-list"><p>${seatTotal} drink${seatTotal===1?"":"s"} for ${state.seat}</p>${order.drinks.map((drink,index)=>`<div class="drink-line ${index===state.activeDrink?"active":""}"><button data-select-drink="${index}" class="drink-name"><span><strong>${esc(label(drink.drink))}${drink.qty===2&&spirits.has(drink.drink)?" · Double":""}</strong><small>${esc(details(drink))}</small></span></button><div class="drink-quantity"><button data-drink-delta="-1" data-index="${index}" aria-label="Remove one">−</button><strong>${drink.qty}</strong><button data-drink-delta="1" data-index="${index}" aria-label="Add one">+</button></div><button data-remove-drink="${index}" class="remove-drink" aria-label="Remove ${esc(label(drink.drink))}">×</button></div>`).join("")}</div>` : "";
  const modifierEditor = active ? `<div class="drink-editor"><div class="editor-title"><strong>Edit ${esc(label(active.drink))}</strong><span>Changes apply to this drink only</span></div><div class="modifier-row">${modifiersFor(active).map(mod=>`<button data-modifier="${mod}" class="${active.modifiers.includes(mod)?"active":""}">${mod}</button>`).join("")}</div>${isHot(active)?`<div class="cream-type"><span>Creamer</span><button data-creamer="Dairy" class="${active.creamer==="Dairy"?"active":""}">Dairy</button><button data-creamer="Oat" class="${active.creamer==="Oat"?"active":""}">Oat milk</button></div><div class="quantity-row">${quantityControl("cream","Creams",active.creamQty)}${quantityControl("sugar","Sugars",active.sugarQty)}</div>`:""}</div>` : "";
  const head=state.cabin==="first"?`<div class="seat-head"><span></span><b>A</b><b>C</b><i></i><b>D</b><b>F</b></div>`:`<div class="seat-head"><span></span><b>A</b><b>B</b><b>C</b><i></i><b>D</b><b>E</b><b>F</b></div>`;
  return `<div class="cabin-tabs"><button data-cabin="first" class="${state.cabin==="first"?"active":""}">First Class</button><button data-cabin="premium" class="${state.cabin==="premium"?"active":""}">Premium</button></div><section class="seat-map ${state.cabin==="first"?"first-map":""}" aria-label="${state.cabin==="first"?"First":"Premium"} Class seat map">${head}${map}</section><section class="order-panel"><div class="selected-line"><div><span>Selected seat</span><strong>${state.seat}</strong></div></div>${selectedDrinks}<div class="category-tabs">${Object.keys(menu).map(cat=>`<button data-category="${cat}" class="${state.category===cat?"active":""}">${cat}</button>`).join("")}</div><div class="drink-grid">${drinks}</div>${modifierEditor}</section><footer class="order-tray"><div><span>${seatTotal?`${state.seat} · ${seatTotal} drink${seatTotal===1?"":"s"}`:`${state.seat} · Add a drink`}</span><small>Tap again to increase quantity</small></div><button data-mode="prepare" ${drinkCount()?"":"disabled"}>Prepare · ${drinkCount()}</button></footer>`;
}

function prepareView() {
  const orders=orderList();
  return `<section class="workflow-panel"><div class="workflow-heading"><div><p class="eyebrow">Galley view</p><h2>Prepare drinks</h2></div><button data-mode="take" class="secondary">Add orders</button></div>${orders.length?`<div class="prep-list">${orders.map(order=>`<article class="${order.delivered?"done":""}"><strong class="seat-chip">${order.seat}</strong><div class="seat-drinks">${order.drinks.map(drink=>`<div><h3>${esc(drinkTitle(drink))}</h3><p>${esc(details(drink))}</p></div>`).join("")}</div><button data-edit="${order.seat}">Edit</button></article>`).join("")}</div>`:empty()}<button data-mode="deliver" class="primary wide" ${orders.length?"":"disabled"}>Ready to deliver</button></section>`;
}
function deliverView() {
  const orders=orderList();
  return `<section class="workflow-panel"><div class="workflow-heading"><div><p class="eyebrow">Cabin view</p><h2>Deliver drinks</h2></div><button data-mode="prepare" class="secondary">Back</button></div>${orders.length?`<div class="delivery-grid">${orders.map(order=>{const total=order.drinks.reduce((n,drink)=>n+drink.qty,0);return `<button data-deliver="${order.seat}" class="${order.delivered?"delivered":""}"><strong>${order.seat}</strong><span>${order.drinks.map(drink=>`${esc(label(drink.drink))}${drink.qty>1?` ×${drink.qty}`:""}`).join(" + ")}</span><small>${order.delivered?"Delivered ✓":`${total} drink${total===1?"":"s"} · Tap when delivered`}</small></button>`}).join("")}</div>`:empty()}<button data-action="clear" class="clear">Clear flight</button></section>`;
}
function empty(){return '<div class="empty"><strong>No drink orders yet</strong><span>Choose a seat to begin.</span></div>'}
function render(){app.innerHTML=header()+(state.mode==="take"?takeView():state.mode==="prepare"?prepareView():deliverView())}

app.addEventListener("change",event=>{if(event.target.matches('[data-action="plane"]')){state.plane=event.target.value;save();render()}});
app.addEventListener("click",event=>{
  const remove=event.target.closest("[data-remove-drink]");
  if(remove){const order=currentOrder();order.drinks.splice(Number(remove.dataset.removeDrink),1);if(!order.drinks.length)delete state.orders[state.seat];state.activeDrink=null;save();render();return}
  const target=event.target.closest("button");if(!target)return;
  if(target.dataset.mode)state.mode=target.dataset.mode;
  if(target.dataset.cabin){state.cabin=target.dataset.cabin;state.seat=state.cabin==="first"?"1A":"6A";state.activeDrink=null}
  if(target.dataset.seat){state.seat=target.dataset.seat;state.activeDrink=null}
  if(target.dataset.category)state.category=target.dataset.category;
  if(target.dataset.drink){const order=state.orders[state.seat]||(state.orders[state.seat]={seat:state.seat,drinks:[],delivered:false});const found=order.drinks.findIndex(item=>item.drink===target.dataset.drink);if(found>=0){order.drinks[found].qty+=1;state.activeDrink=found}else{order.drinks.push({drink:target.dataset.drink,category:state.category,modifiers:[],creamer:null,creamQty:0,sugarQty:0,qty:1});state.activeDrink=order.drinks.length-1}order.delivered=false}
  if(target.dataset.drinkDelta!==undefined){const order=currentOrder(),index=Number(target.dataset.index);order.drinks[index].qty+=Number(target.dataset.drinkDelta);if(order.drinks[index].qty<=0)order.drinks.splice(index,1);if(!order.drinks.length)delete state.orders[state.seat];state.activeDrink=null}
  if(target.dataset.selectDrink!==undefined)state.activeDrink=Number(target.dataset.selectDrink);
  const drink=currentDrink();
  if(target.dataset.modifier&&drink){const mod=target.dataset.modifier;drink.modifiers=drink.modifiers.includes(mod)?drink.modifiers.filter(x=>x!==mod):[...drink.modifiers,mod];if(mod==="Ice")drink.modifiers=drink.modifiers.filter(x=>x!=="No Ice");if(mod==="No Ice")drink.modifiers=drink.modifiers.filter(x=>x!=="Ice")}
  if(target.dataset.creamer&&drink){drink.creamer=target.dataset.creamer;if(!drink.creamQty)drink.creamQty=1}
  if(target.dataset.quantity&&drink){const key=target.dataset.quantity==="cream"?"creamQty":"sugarQty";drink[key]=Math.max(0,Math.min(9,(drink[key]||0)+Number(target.dataset.delta)));if(key==="creamQty"&&drink[key]&&!drink.creamer)drink.creamer="Dairy";if(key==="creamQty"&&!drink[key])drink.creamer=null}
  if(target.dataset.edit){state.seat=target.dataset.edit;state.activeDrink=0;state.category=state.orders[state.seat].drinks[0].category;state.mode="take"}
  if(target.dataset.deliver)state.orders[target.dataset.deliver].delivered=!state.orders[target.dataset.deliver].delivered;
  if(target.dataset.action==="clear"&&confirm("Clear every drink order for this flight?")){state.orders={};state.activeDrink=null;state.mode="take"}
  save();render();
});
render();
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js");
