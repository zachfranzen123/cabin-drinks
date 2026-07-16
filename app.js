const aircraft = ["737-700", "737-800", "737 MAX 8", "737-900", "737 MAX 9"];
const premiumSeatLetters = ["A", "B", "C", "D", "E", "F"];
const firstSeatLetters = ["A", "C", "D", "F"];
const menu = {
  "Mixed Drinks": [],
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
  if (!order.drinks) order.drinks = [{drink:order.drink, category:order.category, modifiers:order.modifiers || [], creamer:null, creamQty:0, sweetenerType:null, sweetenerQty:0}];
  order.drinks.forEach(drink => {
    drink.qty = drink.qty || 1;
    drink.sweetenerQty = drink.sweetenerQty || drink.sugarQty || (drink.modifiers?.includes("Sweetener") ? 1 : 0);
    drink.sweetenerType = drink.sweetenerType || (drink.modifiers?.includes("Sweetener") ? "Sweetener" : drink.sweetenerQty ? "Sugar" : null);
    drink.modifiers = (drink.modifiers || []).filter(item => item !== "Sweetener");
    delete drink.sugarQty;
  });
  delete order.drink; delete order.category; delete order.modifiers;
});
const state = {
  plane: localStorage.getItem("cabin-drinks-plane") || "737-900",
  cabin: localStorage.getItem("cabin-drinks-cabin") || "premium",
  orientation: localStorage.getItem("cabin-drinks-orientation") || "front",
  theme: localStorage.getItem("cabin-drinks-theme") || "light",
  seat: "8C", category: "Sodas", mode: "take", orders: saved, activeDrink: null,
  builder: {spirit:null, mixer:null, pour:1, modifiers:["Ice"]}
};
if (state.cabin === "first") state.seat = "1A";
function applyTheme(){document.documentElement.dataset.theme=state.theme;const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",state.theme==="dark"?"#080d0c":"#202423")}
applyTheme();

const app = document.querySelector("#app");
const esc = value => String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const label = drink => shortNames[drink] || drink;
const showSubtitle = drink => label(drink) !== drink && drink !== "Stash Jasmine Blossom Green Tea";
const orderList = () => Object.values(state.orders).sort((a,b) => parseInt(a.seat)-parseInt(b.seat) || a.seat.localeCompare(b.seat));
const drinkCount = () => orderList().reduce((sum, order) => sum + order.drinks.reduce((n, drink) => n + drink.qty, 0), 0);
const baseRows = () => state.cabin === "first" ? [1,2,3,4] : [6,7,8,9,10,16].concat(["737-900","737 MAX 9"].includes(state.plane) ? [17] : []);
const rows = () => state.orientation === "front" ? baseRows() : [...baseRows()].reverse();
const seatLetters = () => {
  const letters=state.cabin === "first" ? firstSeatLetters : premiumSeatLetters;
  return state.orientation === "front" ? letters : [...letters].reverse();
};
const spirits = new Set(["Jack Daniel’s Whiskey","Buffalo Trace Bourbon","Glenfarclas Scotch","Dulce Vida Organic Tequila Blanco","Bacardí Rum","Aviation Gin","Tito’s Handmade Vodka","Crater Lake Hazelnut Espresso Vodka","Five Farms Irish Cream"]);
const spiritOptions = [...spirits];
const mixerOptions = ["Tonic Water","Polar Original Seltzer","Polar Cranberry Lime Seltzer","Canada Dry Ginger Ale","Bloody Mary Mix","Coca-Cola","Diet Coke","Coke Zero","Sprite","Cranberry Juice","Orange Juice","Apple Juice","Passion Orange Guava Juice"];
const spiritType = spirit => spirit.includes("Gin") ? "Gin" : spirit.includes("Vodka") ? "Vodka" : spirit.includes("Rum") ? "Rum" : spirit.includes("Tequila") ? "Tequila" : spirit.includes("Bourbon") ? "Bourbon" : spirit.includes("Scotch") ? "Scotch" : spirit.includes("Irish Cream") ? "Irish Cream" : "Whiskey";
const mixedName = drink => drink.preset === "bloody" ? "Bloody Mary" : `${spiritType(drink.spirit)} & ${label(drink.mixer).replace(" Water","").replace("Polar Original ","")}`;
const displayName = drink => drink.category === "Mixed Drinks" ? mixedName(drink) : drink.drink;
const drinkTitle = drink => {
  const name=displayName(drink), pour=drink.pour===2?`Double ${name}`:name;
  return drink.qty>1?`${pour} ×${drink.qty}`:pour;
};
const isCoffeeTea = drink => drink.category === "Coffee & Teas";
const isCoffee = drink => isCoffeeTea(drink) && (drink.drink.includes("Coffee") || drink.drink.includes("Cold Brew"));
const modifiersFor = drink => isCoffeeTea(drink)
  ? (drink.drink.includes("Cold Brew") ? ["Ice","No Ice"] : isCoffee(drink) ? [] : ["Lemon packet"])
  : ["Ice","No Ice","Lemon packet","Lime packet","Grapefruit packet"];
const details = drink => {
  const parts = drink.category === "Mixed Drinks" ? [`${label(drink.spirit)}${drink.pour===2?" ×2":""}`, label(drink.mixer), ...drink.modifiers] : [...drink.modifiers];
  if (drink.creamQty) parts.push(`${drink.creamQty} ${drink.creamer === "Oat" ? "oat milk" : "dairy"} creamer${drink.creamQty === 1 ? "" : "s"}`);
  if (drink.sweetenerQty) parts.push(`${drink.sweetenerQty} ${(drink.sweetenerType || "Sugar").toLowerCase()}${drink.sweetenerQty === 1 ? "" : "s"}`);
  return parts.join(" · ") || "Standard";
};

function save() {
  localStorage.setItem("cabin-drinks-plane", state.plane);
  localStorage.setItem("cabin-drinks-cabin", state.cabin);
  localStorage.setItem("cabin-drinks-orientation", state.orientation);
  localStorage.setItem("cabin-drinks-theme", state.theme);
  localStorage.setItem("cabin-drinks-orders", JSON.stringify(state.orders));
}
function currentOrder() { return state.orders[state.seat]; }
function currentDrink() { const order=currentOrder(); return order && state.activeDrink !== null ? order.drinks[state.activeDrink] : null; }
function ensureSelection() { const order=currentOrder(); state.activeDrink = order?.drinks.length ? Math.min(state.activeDrink ?? order.drinks.length-1, order.drinks.length-1) : null; }

function header() {
  const count = orderList().filter(order => !order.delivered).reduce((sum, order) => sum + order.drinks.reduce((n, drink) => n + drink.qty, 0), 0);
  return `<header class="topbar"><div><p class="eyebrow">Offline service pad</p><h1>Cabin Drinks</h1></div><div class="top-actions"><button data-action="theme" class="theme-button" aria-label="Switch to ${state.theme==="dark"?"light":"dark"} mode">${state.theme==="dark"?"☀️":"🌙"}</button><a href="./index.html" class="help-link">Help</a><select data-action="plane" aria-label="Aircraft">${aircraft.map(item => `<option${item===state.plane?" selected":""}>${item}</option>`).join("")}</select></div></header>
  <nav class="mode-tabs" aria-label="Workflow"><button data-mode="take" class="${state.mode==="take"?"active":""}">Take orders</button><button data-mode="prepare" class="${state.mode==="prepare"?"active":""}">Prepare <span>${count}</span></button><button data-mode="deliver" class="${state.mode==="deliver"?"active":""}">Deliver</button></nav>`;
}

function quantityControl(kind, title, qty) {
  return `<div class="quantity-control"><span>${title}</span><div><button data-quantity="${kind}" data-delta="-1" aria-label="Less ${title}">−</button><strong>${qty}</strong><button data-quantity="${kind}" data-delta="1" aria-label="More ${title}">+</button></div></div>`;
}

function coffeeTeaControls(drink) {
  if(!isCoffeeTea(drink)) return "";
  return `<div class="addition-block"><div class="addition-choice"><span>Creamer</span><button data-addition="creamer" data-value="Dairy" class="${drink.creamer==="Dairy"?"active":""}">Dairy</button><button data-addition="creamer" data-value="Oat" class="${drink.creamer==="Oat"?"active":""}">Oat milk</button></div>${quantityControl("cream","Cream quantity",drink.creamQty||0)}</div><div class="addition-block"><div class="addition-choice"><span>Sweetener</span><button data-addition="sweetener" data-value="Sugar" class="${drink.sweetenerType==="Sugar"?"active":""}">Sugar</button><button data-addition="sweetener" data-value="Sweetener" class="${drink.sweetenerType==="Sweetener"?"active":""}">Sweetener</button></div>${quantityControl("sweetener","Sweetener quantity",drink.sweetenerQty||0)}</div>`;
}

function mixedBuilder() {
  const b=state.builder;
  return `<div class="mixed-builder"><div class="quick-build"><div><strong>Bloody Mary</strong><span>Tito’s · Bloody Mary Mix · Ice</span></div><button data-quick-mixed="bloody">+ Add</button></div><div class="builder-title"><strong>Build Your Own</strong><span>Choose one spirit and one mixer</span></div><label>1 · Spirit</label><div class="builder-scroll">${spiritOptions.map(item=>`<button data-build-spirit="${esc(item)}" class="${b.spirit===item?"active":""}">${esc(label(item))}</button>`).join("")}</div><label>2 · Mixer</label><div class="builder-scroll">${mixerOptions.map(item=>`<button data-build-mixer="${esc(item)}" class="${b.mixer===item?"active":""}">${esc(label(item))}</button>`).join("")}</div><label>3 · Pour</label><div class="builder-options"><button data-build-pour="1" class="${b.pour===1?"active":""}">Single</button><button data-build-pour="2" class="${b.pour===2?"active":""}">Double</button></div><label>4 · Finish</label><div class="builder-scroll">${["Ice","No Ice","Lemon packet","Lime packet","Grapefruit packet"].map(mod=>`<button data-builder-modifier="${mod}" class="${b.modifiers.includes(mod)?"active":""}">${mod}</button>`).join("")}</div><button data-add-mixed="custom" class="add-build" ${b.spirit&&b.mixer?"":"disabled"}>Add mixed drink to ${state.seat}</button></div>`;
}

function takeView() {
  ensureSelection();
  const order=currentOrder(), active=currentDrink();
  const visibleRows=rows(), exitAnchor=state.orientation==="front"?16:10;
  const map=visibleRows.map(row => `<div class="seat-row ${row===exitAnchor?"exit-start":""}">${row===exitAnchor?`<div class="exit-label">EXIT ROW${visibleRows.includes(17)?"S":""}</div>`:""}<strong>${row}</strong>${seatLetters().map(letter => { const seat=`${row}${letter}`, item=state.orders[seat], total=item?.drinks.reduce((n,drink)=>n+drink.qty,0); return `<button data-seat="${seat}" class="${state.seat===seat?"selected":""} ${item?"ordered":""}" aria-label="${seat}${item?`, ${total} drinks`:""}">${state.seat===seat?seat:letter}${item?`<span>${total}</span>`:""}</button>`; }).join("")}</div>`).join("");
  const drinks=menu[state.category].map(drink => `<button data-drink="${esc(drink)}"><strong>${esc(label(drink))}</strong>${showSubtitle(drink)?`<span>${esc(drink)}</span>`:""}<em>+ Add</em></button>`).join("");
  const drinkChooser=state.category==="Mixed Drinks"?mixedBuilder():`<div class="drink-grid">${drinks}</div>`;
  const seatTotal=order?.drinks.reduce((n,drink)=>n+drink.qty,0)||0;
  const selectedDrinks = order?.drinks.length ? `<div class="seat-order-list"><p>${seatTotal} drink${seatTotal===1?"":"s"} for ${state.seat}</p>${order.drinks.map((drink,index)=>`<div class="drink-line ${index===state.activeDrink?"active":""}"><button data-select-drink="${index}" class="drink-name"><span><strong>${esc(displayName(drink))}${drink.pour===2?" · Double":drink.qty===2&&spirits.has(drink.drink)?" · Double":""}</strong><small>${esc(details(drink))}</small></span></button><div class="drink-quantity"><button data-drink-delta="-1" data-index="${index}" aria-label="Remove one">−</button><strong>${drink.qty}</strong><button data-drink-delta="1" data-index="${index}" aria-label="Add one">+</button></div><button data-remove-drink="${index}" class="remove-drink" aria-label="Remove ${esc(displayName(drink))}">×</button></div>`).join("")}</div>` : "";
  const modifierEditor = active ? `<div class="drink-editor"><div class="editor-title"><strong>Edit ${esc(displayName(active))}</strong><span>Changes apply to this drink only</span></div>${active.category==="Mixed Drinks"?`<div class="pour-editor"><span>Pour</span><button data-edit-pour="1" class="${active.pour===1?"active":""}">Single</button><button data-edit-pour="2" class="${active.pour===2?"active":""}">Double</button></div>`:""}${modifiersFor(active).length?`<div class="modifier-row">${modifiersFor(active).map(mod=>`<button data-modifier="${mod}" class="${active.modifiers.includes(mod)?"active":""}">${mod}</button>`).join("")}</div>`:""}${coffeeTeaControls(active)}</div>` : "";
  const visualLetters=seatLetters(), split=state.cabin==="first"?2:3;
  const head=`<div class="seat-head"><span></span>${visualLetters.slice(0,split).map(letter=>`<b>${letter}</b>`).join("")}<i></i>${visualLetters.slice(split).map(letter=>`<b>${letter}</b>`).join("")}</div>`;
  const cabinControls=`<div class="cabin-tabs"><button data-cabin="first" class="${state.cabin==="first"?"active":""}">First Class</button><button data-cabin="premium" class="${state.cabin==="premium"?"active":""}">Premium</button><button data-action="orientation" class="orientation-button" aria-label="Reverse seat map; currently ${state.orientation==="front"?"front to back":"back to front"}"><span class="plane ${state.orientation}">✈️</span><small>${state.orientation==="front"?"Front first":"Rear first"}</small></button></div>`;
  return `<div class="service-tools"><span>${drinkCount()?`${drinkCount()} active drink${drinkCount()===1?"":"s"}`:"No active orders"}</span><button data-action="clear" ${drinkCount()?"":"disabled"}>Clear orders</button></div>${cabinControls}<section class="seat-map ${state.cabin==="first"?"first-map":""}" aria-label="${state.cabin==="first"?"First":"Premium"} Class seat map">${head}${map}</section><section class="order-panel"><div class="selected-line"><div><span>Selected seat</span><strong>${state.seat}</strong></div></div>${selectedDrinks}<div class="category-tabs">${Object.keys(menu).map(cat=>`<button data-category="${cat}" class="${state.category===cat?"active":""}">${cat}</button>`).join("")}</div>${drinkChooser}${modifierEditor}</section><footer class="order-tray"><div><span>${seatTotal?`${state.seat} · ${seatTotal} drink${seatTotal===1?"":"s"}`:`${state.seat} · Add a drink`}</span><small>Tap again to increase quantity</small></div><button data-mode="prepare" ${drinkCount()?"":"disabled"}>Prepare · ${drinkCount()}</button></footer>`;
}

function prepareView() {
  const orders=orderList();
  return `<section class="workflow-panel"><div class="workflow-heading"><div><p class="eyebrow">Galley view</p><h2>Prepare drinks</h2></div><button data-mode="take" class="secondary">Add orders</button></div>${orders.length?`<div class="prep-list">${orders.map(order=>`<article class="${order.delivered?"done":""}"><strong class="seat-chip">${order.seat}</strong><div class="seat-drinks">${order.drinks.map(drink=>`<div><h3>${esc(drinkTitle(drink))}</h3><p>${esc(details(drink))}</p></div>`).join("")}</div><button data-edit="${order.seat}">Edit</button></article>`).join("")}</div>`:empty()}<button data-mode="deliver" class="primary wide" ${orders.length?"":"disabled"}>Ready to deliver</button></section>`;
}
function deliverView() {
  const orders=orderList();
  return `<section class="workflow-panel"><div class="workflow-heading"><div><p class="eyebrow">Cabin view</p><h2>Deliver drinks</h2></div><button data-mode="prepare" class="secondary">Back</button></div>${orders.length?`<div class="delivery-grid">${orders.map(order=>{const total=order.drinks.reduce((n,drink)=>n+drink.qty,0);return `<button data-deliver="${order.seat}" class="${order.delivered?"delivered":""}"><strong>${order.seat}</strong><div class="delivery-drinks">${order.drinks.map(drink=>`<div><b>${esc(drinkTitle(drink))}</b><em>${esc(details(drink))}</em></div>`).join("")}</div><small>${order.delivered?"Delivered ✓":`${total} drink${total===1?"":"s"} · Tap when delivered`}</small></button>`}).join("")}</div>`:empty()}</section>`;
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
  if(target.dataset.buildSpirit)state.builder.spirit=target.dataset.buildSpirit;
  if(target.dataset.buildMixer)state.builder.mixer=target.dataset.buildMixer;
  if(target.dataset.buildPour)state.builder.pour=Number(target.dataset.buildPour);
  if(target.dataset.builderModifier){const mod=target.dataset.builderModifier,b=state.builder;b.modifiers=b.modifiers.includes(mod)?b.modifiers.filter(x=>x!==mod):[...b.modifiers,mod];if(mod==="Ice")b.modifiers=b.modifiers.filter(x=>x!=="No Ice");if(mod==="No Ice")b.modifiers=b.modifiers.filter(x=>x!=="Ice")}
  if(target.dataset.quickMixed){const order=state.orders[state.seat]||(state.orders[state.seat]={seat:state.seat,drinks:[],delivered:false});const found=order.drinks.findIndex(item=>item.preset==="bloody");if(found>=0){order.drinks[found].qty+=1;state.activeDrink=found}else{order.drinks.push({drink:"Bloody Mary",category:"Mixed Drinks",preset:"bloody",spirit:"Tito’s Handmade Vodka",mixer:"Bloody Mary Mix",pour:1,modifiers:["Ice"],creamer:null,creamQty:0,sweetenerType:null,sweetenerQty:0,qty:1});state.activeDrink=order.drinks.length-1}order.delivered=false}
  if(target.dataset.addMixed){const b=state.builder;if(b.spirit&&b.mixer){const order=state.orders[state.seat]||(state.orders[state.seat]={seat:state.seat,drinks:[],delivered:false});const draft={drink:"Custom Mixed Drink",category:"Mixed Drinks",spirit:b.spirit,mixer:b.mixer,pour:b.pour,modifiers:[...b.modifiers],creamer:null,creamQty:0,sweetenerType:null,sweetenerQty:0,qty:1};draft.drink=mixedName(draft);order.drinks.push(draft);order.delivered=false;state.activeDrink=order.drinks.length-1;state.builder={spirit:null,mixer:null,pour:1,modifiers:["Ice"]}}}
  if(target.dataset.drink){const order=state.orders[state.seat]||(state.orders[state.seat]={seat:state.seat,drinks:[],delivered:false});const found=order.drinks.findIndex(item=>item.drink===target.dataset.drink);if(found>=0){order.drinks[found].qty+=1;state.activeDrink=found}else{order.drinks.push({drink:target.dataset.drink,category:state.category,modifiers:[],creamer:null,creamQty:0,sweetenerType:null,sweetenerQty:0,qty:1});state.activeDrink=order.drinks.length-1}order.delivered=false}
  if(target.dataset.drinkDelta!==undefined){const order=currentOrder(),index=Number(target.dataset.index);order.drinks[index].qty+=Number(target.dataset.drinkDelta);if(order.drinks[index].qty<=0)order.drinks.splice(index,1);if(!order.drinks.length)delete state.orders[state.seat];state.activeDrink=null}
  if(target.dataset.selectDrink!==undefined)state.activeDrink=Number(target.dataset.selectDrink);
  const drink=currentDrink();
  if(target.dataset.editPour&&drink)drink.pour=Number(target.dataset.editPour);
  if(target.dataset.modifier&&drink){const mod=target.dataset.modifier;drink.modifiers=drink.modifiers.includes(mod)?drink.modifiers.filter(x=>x!==mod):[...drink.modifiers,mod];if(mod==="Ice")drink.modifiers=drink.modifiers.filter(x=>x!=="No Ice");if(mod==="No Ice")drink.modifiers=drink.modifiers.filter(x=>x!=="Ice")}
  if(target.dataset.addition&&drink){if(target.dataset.addition==="creamer"){drink.creamer=target.dataset.value;if(!drink.creamQty)drink.creamQty=1}else{drink.sweetenerType=target.dataset.value;if(!drink.sweetenerQty)drink.sweetenerQty=1}}
  if(target.dataset.quantity&&drink){const isCream=target.dataset.quantity==="cream",key=isCream?"creamQty":"sweetenerQty";drink[key]=Math.max(0,Math.min(9,(drink[key]||0)+Number(target.dataset.delta)));if(isCream&&drink[key]&&!drink.creamer)drink.creamer="Dairy";if(isCream&&!drink[key])drink.creamer=null;if(!isCream&&drink[key]&&!drink.sweetenerType)drink.sweetenerType="Sugar";if(!isCream&&!drink[key])drink.sweetenerType=null}
  if(target.dataset.edit){state.seat=target.dataset.edit;state.activeDrink=0;state.category=state.orders[state.seat].drinks[0].category;state.mode="take"}
  if(target.dataset.deliver)state.orders[target.dataset.deliver].delivered=!state.orders[target.dataset.deliver].delivered;
  if(target.dataset.action==="orientation")state.orientation=state.orientation==="front"?"rear":"front";
  if(target.dataset.action==="theme"){state.theme=state.theme==="dark"?"light":"dark";applyTheme()}
  if(target.dataset.action==="clear"&&confirm("Clear every drink order for this flight?")){state.orders={};state.activeDrink=null;state.mode="take"}
  save();render();
});
render();
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js");
