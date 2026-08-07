const APP_VERSION = "15";
const aircraft = ["737-700", "737-800", "737 MAX 8", "737-900", "737 MAX 9"];
const premiumSeatLetters = ["A", "B", "C", "D", "E", "F"];
const firstSeatLetters = ["A", "C", "D", "F"];
const menu = {
  "Mixed Drinks": [],
  "Mixers": ["Tonic Water", "Polar Original Seltzer", "Polar Cranberry Lime Seltzer", "Canada Dry Ginger Ale", "Bloody Mary Mix"],
  "Sodas": ["Coca-Cola", "Diet Coke", "Coke Zero", "Sprite"],
  "Alcohol": ["Tito’s Handmade Vodka", "Buffalo Trace Bourbon", "Jack Daniel’s Whiskey", "Glenfarclas Scotch", "Aviation Gin", "Bacardí Rum", "Dulce Vida Organic Tequila Blanco", "Crater Lake Hazelnut Espresso Vodka", "Five Farms Irish Cream", "Broken Earth Red Blend", "Waterbrook White Blend", "Cuvée 89 Brut Sparkling Wine", "Fremont Cloud Cruiser IPA", "Fremont Golden Pilsner", "Straightaway Blanco Margarita", "Straightaway Oregon Old Fashioned", "HOP WTR Blood Orange"],
  "Coffee & Teas": ["Stumptown Coffee", "Stumptown Decaf Coffee", "Stash English Breakfast Tea", "Stash Peppermint Tea", "Stash Jasmine Blossom Green Tea", "Stumptown Cold Brew Copilot"],
  "Juice & Water": ["Boxed Water", "Apple Juice", "Cranberry Juice", "Orange Juice", "Passion Orange Guava Juice"]
};
const serviceCategories = ["Juice & Water", "Coffee & Teas", "Mixed Drinks", "Sodas", "Alcohol", "Mixers"];
const shortNames = {
  "Broken Earth Red Blend":"Red Wine", "Waterbrook White Blend":"White Wine", "Cuvée 89 Brut Sparkling Wine":"Sparkling Wine",
  "Tito’s Handmade Vodka":"Vodka", "Buffalo Trace Bourbon":"Bourbon", "Jack Daniel’s Whiskey":"Whiskey", "Glenfarclas Scotch":"Scotch",
  "Aviation Gin":"Gin", "Bacardí Rum":"Rum", "Dulce Vida Organic Tequila Blanco":"Tequila", "Crater Lake Hazelnut Espresso Vodka":"Espresso Vodka", "Five Farms Irish Cream":"Irish Cream",
  "Fremont Cloud Cruiser IPA":"IPA", "Fremont Golden Pilsner":"Pilsner", "Straightaway Blanco Margarita":"Margarita", "Straightaway Oregon Old Fashioned":"Old Fashioned", "HOP WTR Blood Orange":"Nonalcoholic Hop Water",
  "Stash Jasmine Blossom Green Tea":"Jasmine Green Tea", "Passion Orange Guava Juice":"POG Juice"
};

const saved = JSON.parse(localStorage.getItem("cabin-drinks-orders") || "{}");
// Transparently upgrade orders saved by the first version of the app.
Object.values(saved).forEach(order => {
  order.foods = order.foods || [];
  if (!order.drinks) order.drinks = [{drink:order.drink, category:order.category, modifiers:order.modifiers || [], creamer:null, creamQty:0, sweetenerType:null, sweetenerQty:0}];
  order.drinks.forEach(drink => {
    drink.qty = drink.qty || 1;
    drink.sweetenerQty = drink.sweetenerQty || drink.sugarQty || (drink.modifiers?.includes("Sweetener") ? 1 : 0);
    drink.sweetenerType = drink.sweetenerType || (drink.modifiers?.includes("Sweetener") ? "Sweetener" : drink.sweetenerQty ? "Sugar" : null);
    drink.modifiers = (drink.modifiers || []).filter(item => item !== "Sweetener");
    if (drink.preset === "irishCoffee") delete drink.preset;
    delete drink.sugarQty;
  });
  delete order.drink; delete order.category; delete order.modifiers;
});
const state = {
  plane: localStorage.getItem("cabin-drinks-plane") || "737-900",
  cabin: localStorage.getItem("cabin-drinks-cabin") || "premium",
  orientation: localStorage.getItem("cabin-drinks-orientation") || "front",
  theme: localStorage.getItem("cabin-drinks-theme") || "light",
  seat: "8C", category: "Juice & Water", mode: "take", orders: saved, activeDrink: null,
  foodMenu: JSON.parse(localStorage.getItem("cabin-drinks-food-menu") || "[]"), foodSetup:false, foodDraft:{name:"",qty:1},
  scanning:false, scanError:null, scanDraft:null, scanNewItem:"",
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
const foodCount = () => orderList().reduce((sum, order) => sum + (order.foods || []).reduce((n, food) => n + food.qty, 0), 0);
const orderFullyDelivered = order => (!order.drinks.length || order.drinksDelivered) && (!(order.foods||[]).length || order.foodDelivered);
const itemCount = () => drinkCount() + foodCount();
const foodOrdered = id => orderList().reduce((sum,order)=>sum+(order.foods||[]).filter(food=>food.id===id).reduce((n,food)=>n+food.qty,0),0);
const foodRemaining = item => Math.max(0,item.loaded-foodOrdered(item.id));
const baseRows = () => state.cabin === "first" ? [1,2,3,4] : [6,7,8,9,10,16].concat(["737-900","737 MAX 9"].includes(state.plane) ? [17] : []);
const rows = () => state.orientation === "front" ? baseRows() : [...baseRows()].reverse();
const seatLetters = () => {
  const letters=state.cabin === "first" ? firstSeatLetters : premiumSeatLetters;
  return state.orientation === "front" ? letters : [...letters].reverse();
};
const spirits = new Set(["Tito’s Handmade Vodka","Buffalo Trace Bourbon","Jack Daniel’s Whiskey","Glenfarclas Scotch","Aviation Gin","Bacardí Rum","Dulce Vida Organic Tequila Blanco","Crater Lake Hazelnut Espresso Vodka","Five Farms Irish Cream"]);
const spiritOptions = [...spirits];
const alcoholOptions = [...spiritOptions,"Cuvée 89 Brut Sparkling Wine"];
const mixerOptions = ["Tonic Water","Polar Original Seltzer","Polar Cranberry Lime Seltzer","Canada Dry Ginger Ale","Bloody Mary Mix","Coca-Cola","Diet Coke","Coke Zero","Sprite","Cranberry Juice","Orange Juice","Apple Juice","Passion Orange Guava Juice","Stumptown Coffee","Stumptown Decaf Coffee"];
const quickMixedRecipes = {
  bloody:{name:"Bloody Mary",spirit:"Tito’s Handmade Vodka",mixer:"Bloody Mary Mix",pour:1,modifiers:["Ice"]},
  mimosa:{name:"Mimosa",spirit:"Cuvée 89 Brut Sparkling Wine",mixer:"Orange Juice",pour:1,modifiers:[]},
  ginTonic:{name:"Gin & Tonic",spirit:"Aviation Gin",mixer:"Tonic Water",pour:1,modifiers:["Ice","Lime packet"]},
  vodkaSoda:{name:"Vodka Soda",spirit:"Tito’s Handmade Vodka",mixer:"Polar Original Seltzer",pour:1,modifiers:["Ice","Lime packet"]},
  rumCoke:{name:"Rum & Coke",spirit:"Bacardí Rum",mixer:"Coca-Cola",pour:1,modifiers:["Ice"]}
};
const spiritType = spirit => spirit.includes("Gin") ? "Gin" : spirit.includes("Vodka") ? "Vodka" : spirit.includes("Rum") ? "Rum" : spirit.includes("Tequila") ? "Tequila" : spirit.includes("Bourbon") ? "Bourbon" : spirit.includes("Scotch") ? "Scotch" : spirit.includes("Irish Cream") ? "Irish Cream" : "Whiskey";
const mixedName = drink => quickMixedRecipes[drink.preset]?.name || `${spiritType(drink.spirit)} & ${label(drink.mixer).replace(" Water","").replace("Polar Original ","")}`;
const displayName = drink => drink.category === "Mixed Drinks" ? mixedName(drink) : drink.combineWith ? `${drink.drink} & ${drink.combineWith}` : drink.drink;
const combinableCategories = new Set(["Juice & Water", "Sodas", "Mixers"]);
const canCombine = drink => combinableCategories.has(drink.category);
const comboOptions = drink => [...menu["Juice & Water"], ...menu["Sodas"], ...menu["Mixers"]].filter(item => item !== drink.drink);
const drinkTitle = drink => {
  const name=displayName(drink), pour=drink.pour===2?`Double ${name}`:name;
  return drink.qty>1?`${pour} ×${drink.qty}`:pour;
};
const isCoffeeTea = drink => drink.category === "Coffee & Teas" || (drink.category === "Mixed Drinks" && drink.mixer?.includes("Coffee"));
const isCoffee = drink => isCoffeeTea(drink) && ((drink.drink||"").includes("Coffee") || (drink.drink||"").includes("Cold Brew") || (drink.mixer||"").includes("Coffee"));
const isCoffeeLiqueur = drink => drink.category === "Alcohol" && ["Crater Lake Hazelnut Espresso Vodka","Five Farms Irish Cream"].includes(drink.drink);
const modifiersFor = drink => isCoffeeTea(drink)
  ? ((drink.drink||"").includes("Cold Brew") ? ["Ice","No Ice","Irish cream","Hazelnut espresso vodka"] : isCoffee(drink) ? ["Irish cream","Hazelnut espresso vodka"] : ["Lemon packet"])
  : isCoffeeLiqueur(drink) ? ["Coffee","Decaf coffee","Ice","No Ice"]
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
  localStorage.setItem("cabin-drinks-food-menu", JSON.stringify(state.foodMenu));
}
function currentOrder() { return state.orders[state.seat]; }
function currentDrink() { const order=currentOrder(); return order && state.activeDrink !== null ? order.drinks[state.activeDrink] : null; }
function ensureSelection() { const order=currentOrder(); state.activeDrink = order?.drinks.length ? Math.min(state.activeDrink ?? order.drinks.length-1, order.drinks.length-1) : null; }

function header() {
  const count = orderList().reduce((sum, order) => sum + (order.drinksDelivered?0:order.drinks.reduce((n, drink) => n + drink.qty, 0)) + (order.foodDelivered?0:(order.foods||[]).reduce((n,food)=>n+food.qty,0)), 0);
  return `<header class="topbar"><div><p class="eyebrow">Offline service pad <span class="app-version">v${APP_VERSION}</span></p><h1>Cabin Drinks</h1></div><div class="top-actions"><button data-action="theme" class="theme-button" aria-label="Switch to ${state.theme==="dark"?"light":"dark"} mode">${state.theme==="dark"?"☀️":"🌙"}</button><a href="./index.html" class="help-link">Help</a><select data-action="plane" aria-label="Aircraft">${aircraft.map(item => `<option${item===state.plane?" selected":""}>${item}</option>`).join("")}</select></div></header>
  <nav class="mode-tabs" aria-label="Workflow"><button data-mode="take" class="${state.mode==="take"?"active":""}">Take orders</button><button data-mode="prepare" class="${state.mode==="prepare"?"active":""}">Prepare <span>${count}</span></button><button data-mode="deliver" class="${state.mode==="deliver"?"active":""}">Deliver</button></nav>`;
}

function quantityControl(kind, title, qty) {
  return `<div class="quantity-control"><span>${title}</span><div><button data-quantity="${kind}" data-delta="-1" aria-label="Less ${title}">−</button><strong>${qty}</strong><button data-quantity="${kind}" data-delta="1" aria-label="More ${title}">+</button></div></div>`;
}

function coffeeTeaControls(drink) {
  if(!isCoffeeTea(drink)) return "";
  return `<div class="addition-block"><div class="addition-choice"><span>Creamer</span><button data-addition="creamer" data-value="Dairy" class="${drink.creamer==="Dairy"?"active":""}">Dairy</button><button data-addition="creamer" data-value="Oat" class="${drink.creamer==="Oat"?"active":""}">Oat milk</button></div>${quantityControl("cream","Cream quantity",drink.creamQty||0)}</div><div class="addition-block"><div class="addition-choice"><span>Sweetener</span><button data-addition="sweetener" data-value="Sugar" class="${drink.sweetenerType==="Sugar"?"active":""}">Sugar</button><button data-addition="sweetener" data-value="Sweetener" class="${drink.sweetenerType==="Sweetener"?"active":""}">Sweetener</button></div>${quantityControl("sweetener","Sweetener quantity",drink.sweetenerQty||0)}</div>`;
}

function combineControls(active) {
  if(!canCombine(active))return "";
  return `<div class="combine-block"><span>Combine with</span><div class="builder-scroll">${comboOptions(active).map(item=>`<button data-combine-with="${esc(item)}" class="${active.combineWith===item?"active":""}">${esc(label(item))}</button>`).join("")}</div></div>`;
}

function drinkEditor(active) {
  if(!active)return "";
  return `<div class="drink-editor"><div class="editor-title"><strong>Edit ${esc(displayName(active))}</strong><span>Changes apply to this drink only</span></div>${active.category==="Mixed Drinks"&&!active.spirit?.includes("Sparkling Wine")?`<div class="pour-editor"><span>Pour</span><button data-edit-pour="1" class="${active.pour===1?"active":""}">Single</button><button data-edit-pour="2" class="${active.pour===2?"active":""}">Double</button></div>`:""}${modifiersFor(active).length?`<div class="modifier-row">${modifiersFor(active).map(mod=>`<button data-modifier="${mod}" class="${active.modifiers.includes(mod)?"active":""}">${mod}</button>`).join("")}</div>`:""}${active.modifiers?.length?`<div class="modifier-summary"><span>Saved with this drink</span><strong>${esc(active.modifiers.join(" · "))}</strong></div>`:""}${coffeeTeaControls(active)}${combineControls(active)}</div>`;
}

function mixedBuilder(active) {
  const b=state.builder;
  const commonEditor=active?.category==="Mixed Drinks"&&active.preset?drinkEditor(active):"";
  return `<div class="mixed-builder"><div class="builder-title common-title"><strong>Common Drinks</strong><span>Tap once to add the complete recipe</span></div><div class="quick-builds">${Object.entries(quickMixedRecipes).map(([key,recipe])=>`<button data-quick-mixed="${key}"><strong>${esc(recipe.name)}</strong><span>${esc(label(recipe.spirit))} · ${esc(label(recipe.mixer))}</span><em>+ Add</em></button>`).join("")}</div>${commonEditor}<div class="builder-title"><strong>Build Your Own</strong><span>Choose an alcohol and what to mix it with</span></div><label>1 · Alcohol</label><div class="builder-scroll">${alcoholOptions.map(item=>`<button data-build-spirit="${esc(item)}" class="${b.spirit===item?"active":""}">${esc(label(item))}</button>`).join("")}</div><label>2 · Mix with</label><div class="builder-scroll">${mixerOptions.map(item=>`<button data-build-mixer="${esc(item)}" class="${b.mixer===item?"active":""}">${esc(label(item))}</button>`).join("")}</div>${b.spirit?.includes("Sparkling Wine")?"":`<label>3 · Pour</label><div class="builder-options"><button data-build-pour="1" class="${b.pour===1?"active":""}">Single</button><button data-build-pour="2" class="${b.pour===2?"active":""}">Double</button></div>`}<label>${b.spirit?.includes("Sparkling Wine")?"3":"4"} · Finish</label><div class="builder-scroll">${["Ice","No Ice","Lemon packet","Lime packet","Grapefruit packet"].map(mod=>`<button data-builder-modifier="${mod}" class="${b.modifiers.includes(mod)?"active":""}">${mod}</button>`).join("")}</div><button data-add-mixed="custom" class="add-build" ${b.spirit&&b.mixer?"":"disabled"}>Add mixed drink to ${state.seat}</button></div>`;
}

function scanReviewPanel(){
  const count=state.scanDraft.length;
  return `<div class="scan-review"><div class="scan-review-title"><strong>Review scanned items</strong><span>Fix anything that isn’t right, set today’s loaded quantity, remove what doesn’t belong, and add anything the scan missed.</span></div><div class="scan-review-list">${state.scanDraft.map((item,index)=>`<div class="scan-review-row"><input data-scan-name="${index}" value="${esc(item.name)}" aria-label="Scanned food item"><button data-scan-qty="${index}" data-delta="-1" aria-label="Reduce loaded quantity">−</button><strong>${item.qty}</strong><button data-scan-qty="${index}" data-delta="1" aria-label="Increase loaded quantity">+</button><button class="scan-remove" data-scan-remove="${index}" aria-label="Remove ${esc(item.name)}">×</button></div>`).join("")}</div><div class="scan-review-add"><input id="scanNewItem" value="${esc(state.scanNewItem)}" placeholder="Add a missed item" aria-label="New scanned item"><button data-action="scan-add-item" type="button" ${state.scanNewItem.trim()?"":"disabled"}>+ Add</button></div>${count?`<button class="food-add-button" data-action="scan-confirm">Add ${count} item${count===1?"":"s"} to menu</button>`:`<p class="food-setup-hint">All items removed.</p>`}<button class="scan-cancel" data-action="scan-cancel" type="button">Cancel</button></div>`;
}

function scanControls(){
  if(state.scanDraft)return scanReviewPanel();
  const online=navigator.onLine;
  return `<div class="scan-menu-block"><button class="scan-menu-button" data-action="scan-menu" type="button" ${online&&!state.scanning?"":"disabled"}>${state.scanning?"Reading menu…":"📷 Scan a menu photo"}</button>${!online?`<span class="scan-hint">Connect to scan a menu</span>`:state.scanError?`<span class="scan-hint scan-hint-error">${esc(state.scanError)}</span>`:`<span class="scan-hint">Uses Claude to read item names off a photo. Requires a connection.</span>`}</div>`;
}

function foodPanel(order){
  if(state.foodSetup||!state.foodMenu.length){
    const totalLoaded=state.foodMenu.reduce((n,item)=>n+item.loaded,0), capacity=firstSeatLetters.length*4;
    return `<div class="food-setup"><div class="food-setup-title"><div><strong>First Class food</strong><span>Enter today’s loaded items and quantities</span></div>${state.foodMenu.length?`<button data-action="food-done">Done</button>`:""}</div><div class="food-menu-list">${state.foodMenu.map(item=>`<div><input data-food-name="${item.id}" value="${esc(item.name)}" aria-label="Food name"><span>Loaded</span><button data-food-load="${item.id}" data-delta="-1" aria-label="Reduce ${esc(item.name)}">−</button><strong>${item.loaded}</strong><button data-food-load="${item.id}" data-delta="1" aria-label="Increase ${esc(item.name)}">+</button><button class="food-delete" data-food-delete="${item.id}" aria-label="Delete ${esc(item.name)}">×</button></div>`).join("")}</div>${state.foodMenu.length?`<p class="food-setup-tally${totalLoaded>capacity?" over":""}">${totalLoaded} of ${capacity} meals loaded</p>`:""}${scanControls()}${state.scanDraft?"":`<div class="food-add"><label><span>New food item</span><input id="newFoodName" value="${esc(state.foodDraft.name)}" placeholder="Example: Fruit &amp; cheese"></label><div class="food-draft-qty"><span>Loaded</span><div><button data-new-food-delta="-1" aria-label="Reduce loaded quantity">−</button><strong>${state.foodDraft.qty}</strong><button data-new-food-delta="1" aria-label="Increase loaded quantity">+</button></div></div><button class="food-add-button" data-action="food-add" ${state.foodDraft.name.trim()?"":"disabled"}>Add to menu</button></div>${state.foodMenu.length?`<p class="food-setup-hint">Add another item, or tap Done when today’s menu is ready.</p>`:""}`}</div>`;
  }
  return `<div class="food-picker"><div class="food-summary"><span>${state.foodMenu.reduce((n,item)=>n+foodRemaining(item),0)} remaining</span><button data-action="food-manage">Edit menu</button></div><div class="food-grid">${state.foodMenu.map(item=>{const remaining=foodRemaining(item);return `<button data-food-add="${item.id}" ${remaining?"":"disabled"}><strong>${esc(item.name)}</strong><span>${remaining?`${remaining} left`:"Sold out"}</span><em>${remaining?"+ Add":""}</em></button>`}).join("")}</div></div>`;
}

function takeView() {
  ensureSelection();
  const order=currentOrder(), active=currentDrink();
  const visibleRows=rows(), exitAnchor=state.orientation==="front"?16:10;
  const map=visibleRows.map(row => `<div class="seat-row ${row===exitAnchor?"exit-start":""}">${row===exitAnchor?`<div class="exit-label">EXIT ROW${visibleRows.includes(17)?"S":""}</div>`:""}<strong>${row}</strong>${seatLetters().map(letter => { const seat=`${row}${letter}`, item=state.orders[seat], total=item?item.drinks.reduce((n,drink)=>n+drink.qty,0)+(item.foods||[]).reduce((n,food)=>n+food.qty,0):0; return `<button data-seat="${seat}" class="${state.seat===seat?"selected":""} ${item?"ordered":""}" aria-label="${seat}${item?`, ${total} items`:""}">${state.seat===seat?seat:letter}${item?`<span>${total}</span>`:""}</button>`; }).join("")}</div>`).join("");
  const drinks=(menu[state.category]||[]).map(drink => `<button data-drink="${esc(drink)}"><strong>${esc(label(drink))}</strong>${showSubtitle(drink)?`<span>${esc(drink)}</span>`:""}<em>+ Add</em></button>`).join("");
  const drinkChooser=state.category==="Food"?foodPanel(order):state.category==="Mixed Drinks"?mixedBuilder(active):`<div class="drink-grid ${state.category==="Alcohol"?"compact-alcohol":""}">${drinks}</div>`;
  const seatTotal=order?.drinks.reduce((n,drink)=>n+drink.qty,0)||0;
  const selectedDrinks = order?.drinks.length ? `<div class="seat-order-list"><p>${seatTotal} drink${seatTotal===1?"":"s"} for ${state.seat}</p>${order.drinks.map((drink,index)=>`<div class="drink-line ${index===state.activeDrink?"active":""}"><button data-select-drink="${index}" class="drink-name"><span><strong>${esc(displayName(drink))}${drink.pour===2?" · Double":drink.qty===2&&spirits.has(drink.drink)?" · Double":""}</strong><small>${esc(details(drink))}</small></span></button><div class="drink-quantity"><button data-drink-delta="-1" data-index="${index}" aria-label="Remove one">−</button><strong>${drink.qty}</strong><button data-drink-delta="1" data-index="${index}" aria-label="Add one">+</button></div><button data-remove-drink="${index}" class="remove-drink" aria-label="Remove ${esc(displayName(drink))}">×</button></div>`).join("")}</div>` : "";
  const selectedFoods = order?.foods?.length ? `<div class="seat-food-list"><p>Food for ${state.seat}</p>${order.foods.map(food=>{const item=state.foodMenu.find(x=>x.id===food.id);return `<div><span><strong>${esc(item?.name||"Food item")}</strong><small>Reserved</small></span><div class="drink-quantity"><button data-food-delta="${food.id}" data-delta="-1">−</button><strong>${food.qty}</strong><button data-food-delta="${food.id}" data-delta="1" ${foodRemaining(item||{id:food.id,loaded:food.qty})?"":"disabled"}>+</button></div><button class="remove-drink" data-food-remove="${food.id}">×</button></div>`}).join("")}</div>`:"";
  const modifierEditor = active?.category==="Mixed Drinks"&&active.preset ? "" : drinkEditor(active);
  const visualLetters=seatLetters(), split=state.cabin==="first"?2:3;
  const head=`<div class="seat-head"><span></span>${visualLetters.slice(0,split).map(letter=>`<b>${letter}</b>`).join("")}<i></i>${visualLetters.slice(split).map(letter=>`<b>${letter}</b>`).join("")}</div>`;
  const cabinControls=`<div class="cabin-tabs"><button data-cabin="first" class="${state.cabin==="first"?"active":""}">First Class</button><button data-cabin="premium" class="${state.cabin==="premium"?"active":""}">Premium</button><button data-action="orientation" class="orientation-button" aria-label="Reverse seat map; currently ${state.orientation==="front"?"front to back":"back to front"}"><span class="plane ${state.orientation}">✈️</span><small>${state.orientation==="front"?"Front first":"Rear first"}</small></button></div>`;
  const categories=state.cabin==="first"?["Food",...serviceCategories]:serviceCategories;
  const seatItems=seatTotal+(order?.foods||[]).reduce((n,food)=>n+food.qty,0);
  return `<div class="service-tools"><span>${itemCount()?`${itemCount()} active item${itemCount()===1?"":"s"}`:"No active orders"}</span><div class="clear-actions"><button data-action="clear-orders" ${itemCount()?"":"disabled"}>Clear orders</button><button data-action="clear-all" ${itemCount()||state.foodMenu.length?"":"disabled"}>Clear all</button></div></div>${cabinControls}<section class="seat-map ${state.cabin==="first"?"first-map":""}" aria-label="${state.cabin==="first"?"First":"Premium"} Class seat map">${head}${map}</section><section class="order-panel"><div class="selected-line"><div><span>Selected seat</span><strong>${state.seat}</strong></div></div>${selectedFoods}${selectedDrinks}<div class="category-tabs">${categories.map(cat=>`<button data-category="${cat}" class="${state.category===cat?"active":""}">${cat}</button>`).join("")}</div>${drinkChooser}${modifierEditor}</section><footer class="order-tray"><div><span>${seatItems?`${state.seat} · ${seatItems} item${seatItems===1?"":"s"}`:`${state.seat} · Add food or drink`}</span><small>Food inventory updates automatically</small></div><button data-mode="prepare" ${itemCount()?"":"disabled"}>Prepare · ${itemCount()}</button></footer>`;
}

function prepareView() {
  const orders=orderList();
  const foodSummary=state.foodMenu.filter(item=>foodOrdered(item.id)).map(item=>`<div><strong>${foodOrdered(item.id)}×</strong><span>${esc(item.name)}</span><small>${foodRemaining(item)} left</small></div>`).join("");
  return `<section class="workflow-panel"><div class="workflow-heading"><div><p class="eyebrow">Galley view</p><h2>Prepare orders</h2></div><button data-mode="take" class="secondary">Add orders</button></div>${foodSummary?`<div class="prep-food-summary"><p>First Class food tally</p>${foodSummary}</div>`:""}${orders.length?`<div class="prep-list">${orders.map(order=>`<article class="${orderFullyDelivered(order)?"done":""}"><strong class="seat-chip">${order.seat}</strong><div class="seat-drinks">${(order.foods||[]).map(food=>{const item=state.foodMenu.find(x=>x.id===food.id);return `<div class="food-detail"><h3>${esc(item?.name||"Food item")}${food.qty>1?` ×${food.qty}`:""}</h3><p>Food</p></div>`}).join("")}${order.drinks.map(drink=>`<div><h3>${esc(drinkTitle(drink))}</h3><p>${esc(details(drink))}</p></div>`).join("")}</div><button data-edit="${order.seat}">Edit</button></article>`).join("")}</div>`:empty()}<button data-mode="deliver" class="primary wide" ${orders.length?"":"disabled"}>Ready to deliver</button></section>`;
}
function deliverView() {
  const orders=orderList();
  return `<section class="workflow-panel"><div class="workflow-heading"><div><p class="eyebrow">Cabin view</p><h2>Deliver orders</h2></div><button data-mode="prepare" class="secondary">Back</button></div>${orders.length?`<div class="delivery-grid">${orders.map(order=>{const foods=order.foods||[],foodQty=foods.reduce((n,food)=>n+food.qty,0),drinkQty=order.drinks.reduce((n,drink)=>n+drink.qty,0);const foodPart=foods.length?`<button data-deliver-food="${order.seat}" class="delivery-part ${order.foodDelivered?"delivered":""}"><div class="delivery-drinks">${foods.map(food=>{const item=state.foodMenu.find(x=>x.id===food.id);return `<div class="food-delivery"><b>${esc(item?.name||"Food item")}${food.qty>1?` ×${food.qty}`:""}</b><em>Food</em></div>`}).join("")}</div><small>${order.foodDelivered?"Food delivered ✓":`${foodQty} food item${foodQty===1?"":"s"} · Tap when delivered`}</small></button>`:"";const drinksPart=order.drinks.length?`<button data-deliver-drinks="${order.seat}" class="delivery-part ${order.drinksDelivered?"delivered":""}"><div class="delivery-drinks">${order.drinks.map(drink=>`<div><b>${esc(drinkTitle(drink))}</b><em>${esc(details(drink))}</em></div>`).join("")}</div><small>${order.drinksDelivered?"Drinks delivered ✓":`${drinkQty} drink${drinkQty===1?"":"s"} · Tap when delivered`}</small></button>`:"";return `<div class="delivery-card ${orderFullyDelivered(order)?"done":""}"><strong>${order.seat}</strong>${foodPart}${drinksPart}</div>`}).join("")}</div>`:empty()}</section>`;
}
function empty(){return '<div class="empty"><strong>No orders yet</strong><span>Choose a seat to begin.</span></div>'}
function render(){app.innerHTML=header()+(state.mode==="take"?takeView():state.mode==="prepare"?prepareView():deliverView())}

app.addEventListener("input",event=>{if(event.target.id==="newFoodName"){state.foodDraft.name=event.target.value;const button=app.querySelector('[data-action="food-add"]');if(button)button.disabled=!state.foodDraft.name.trim()}if(event.target.id==="scanNewItem"){state.scanNewItem=event.target.value;const button=app.querySelector('[data-action="scan-add-item"]');if(button)button.disabled=!state.scanNewItem.trim()}});
app.addEventListener("change",event=>{
  if(event.target.matches('[data-action="plane"]')){state.plane=event.target.value;save();render();return}
  if(event.target.dataset.foodName){const item=state.foodMenu.find(x=>x.id===event.target.dataset.foodName);if(item&&event.target.value.trim())item.name=event.target.value.trim();save();render();return}
  if(event.target.dataset.scanName!==undefined&&state.scanDraft){state.scanDraft[Number(event.target.dataset.scanName)].name=event.target.value;save();render();return}
});
app.addEventListener("click",event=>{
  const remove=event.target.closest("[data-remove-drink]");
  if(remove){const order=currentOrder();order.drinks.splice(Number(remove.dataset.removeDrink),1);order.drinksDelivered=false;if(!order.drinks.length&&!(order.foods||[]).length)delete state.orders[state.seat];state.activeDrink=null;save();render();return}
  const target=event.target.closest("button");if(!target)return;
  if(target.dataset.mode)state.mode=target.dataset.mode;
  if(target.dataset.cabin){state.cabin=target.dataset.cabin;state.seat=state.cabin==="first"?"1A":"6A";state.activeDrink=null;if(state.cabin!=="first"&&state.category==="Food")state.category="Juice & Water"}
  if(target.dataset.seat){state.seat=target.dataset.seat;state.activeDrink=null}
  if(target.dataset.category)state.category=target.dataset.category;
  if(target.dataset.buildSpirit){state.builder.spirit=target.dataset.buildSpirit;if(state.builder.spirit.includes("Sparkling Wine"))state.builder.pour=1}
  if(target.dataset.buildMixer)state.builder.mixer=target.dataset.buildMixer;
  if(target.dataset.buildPour)state.builder.pour=Number(target.dataset.buildPour);
  if(target.dataset.builderModifier){const mod=target.dataset.builderModifier,b=state.builder;b.modifiers=b.modifiers.includes(mod)?b.modifiers.filter(x=>x!==mod):[...b.modifiers,mod];if(mod==="Ice")b.modifiers=b.modifiers.filter(x=>x!=="No Ice");if(mod==="No Ice")b.modifiers=b.modifiers.filter(x=>x!=="Ice")}
  if(target.dataset.quickMixed){const recipe=quickMixedRecipes[target.dataset.quickMixed],order=state.orders[state.seat]||(state.orders[state.seat]={seat:state.seat,drinks:[],foods:[],drinksDelivered:false,foodDelivered:false});const found=order.drinks.findIndex(item=>item.preset===target.dataset.quickMixed);if(found>=0){order.drinks[found].qty+=1;state.activeDrink=found}else if(recipe){order.drinks.push({drink:recipe.name,category:"Mixed Drinks",preset:target.dataset.quickMixed,spirit:recipe.spirit,mixer:recipe.mixer,pour:recipe.pour,modifiers:[...recipe.modifiers],creamer:null,creamQty:0,sweetenerType:null,sweetenerQty:0,qty:1});state.activeDrink=order.drinks.length-1}order.drinksDelivered=false}
  if(target.dataset.addMixed){const b=state.builder;if(b.spirit&&b.mixer){const order=state.orders[state.seat]||(state.orders[state.seat]={seat:state.seat,drinks:[],foods:[],drinksDelivered:false,foodDelivered:false});const draft={drink:"Custom Mixed Drink",category:"Mixed Drinks",spirit:b.spirit,mixer:b.mixer,pour:b.pour,modifiers:[...b.modifiers],creamer:null,creamQty:0,sweetenerType:null,sweetenerQty:0,qty:1};draft.drink=mixedName(draft);order.drinks.push(draft);order.drinksDelivered=false;state.activeDrink=order.drinks.length-1;state.builder={spirit:null,mixer:null,pour:1,modifiers:["Ice"]}}}
  if(target.dataset.drink){const order=state.orders[state.seat]||(state.orders[state.seat]={seat:state.seat,drinks:[],foods:[],drinksDelivered:false,foodDelivered:false});const found=order.drinks.findIndex(item=>item.drink===target.dataset.drink);if(found>=0){order.drinks[found].qty+=1;state.activeDrink=found}else{order.drinks.push({drink:target.dataset.drink,category:state.category,modifiers:[],creamer:null,creamQty:0,sweetenerType:null,sweetenerQty:0,combineWith:null,qty:1});state.activeDrink=order.drinks.length-1}order.drinksDelivered=false}
  if(target.dataset.drinkDelta!==undefined){const order=currentOrder(),index=Number(target.dataset.index);order.drinks[index].qty+=Number(target.dataset.drinkDelta);if(order.drinks[index].qty<=0)order.drinks.splice(index,1);order.drinksDelivered=false;if(!order.drinks.length&&!(order.foods||[]).length)delete state.orders[state.seat];state.activeDrink=null}
  if(target.dataset.selectDrink!==undefined)state.activeDrink=Number(target.dataset.selectDrink);
  const drink=currentDrink();
  if(target.dataset.editPour&&drink)drink.pour=Number(target.dataset.editPour);
  if(target.dataset.modifier!==undefined&&drink){const mod=target.dataset.modifier,current=new Set(drink.modifiers||[]);if(current.has(mod))current.delete(mod);else current.add(mod);if(mod==="Ice")current.delete("No Ice");if(mod==="No Ice")current.delete("Ice");if(mod==="Coffee")current.delete("Decaf coffee");if(mod==="Decaf coffee")current.delete("Coffee");drink.modifiers=[...current];const order=currentOrder();if(order)order.drinksDelivered=false;save();render();return}
  if(target.dataset.addition&&drink){if(target.dataset.addition==="creamer"){drink.creamer=target.dataset.value;if(!drink.creamQty)drink.creamQty=1}else{drink.sweetenerType=target.dataset.value;if(!drink.sweetenerQty)drink.sweetenerQty=1}}
  if(target.dataset.quantity&&drink){const isCream=target.dataset.quantity==="cream",key=isCream?"creamQty":"sweetenerQty";drink[key]=Math.max(0,Math.min(9,(drink[key]||0)+Number(target.dataset.delta)));if(isCream&&drink[key]&&!drink.creamer)drink.creamer="Dairy";if(isCream&&!drink[key])drink.creamer=null;if(!isCream&&drink[key]&&!drink.sweetenerType)drink.sweetenerType="Sugar";if(!isCream&&!drink[key])drink.sweetenerType=null;const order=currentOrder();if(order)order.drinksDelivered=false}
  if(target.dataset.combineWith!==undefined&&drink&&canCombine(drink)){drink.combineWith=drink.combineWith===target.dataset.combineWith?null:target.dataset.combineWith;const order=currentOrder();if(order)order.drinksDelivered=false}
  if(target.dataset.foodAdd){const item=state.foodMenu.find(x=>x.id===target.dataset.foodAdd);if(item&&foodRemaining(item)>0){const order=state.orders[state.seat]||(state.orders[state.seat]={seat:state.seat,drinks:[],foods:[],drinksDelivered:false,foodDelivered:false});order.foods=order.foods||[];const found=order.foods.find(food=>food.id===item.id);if(found)found.qty++;else order.foods.push({id:item.id,qty:1});order.foodDelivered=false}}
  if(target.dataset.foodDelta){const item=state.foodMenu.find(x=>x.id===target.dataset.foodDelta),order=currentOrder(),food=order?.foods?.find(x=>x.id===target.dataset.foodDelta),delta=Number(target.dataset.delta);if(food&&(delta<0||(item&&foodRemaining(item)>0))){food.qty+=delta;if(food.qty<=0)order.foods=order.foods.filter(x=>x.id!==food.id);order.foodDelivered=false;if(!order.drinks.length&&!order.foods.length)delete state.orders[state.seat]}}
  if(target.dataset.foodRemove){const order=currentOrder();if(order){order.foods=(order.foods||[]).filter(x=>x.id!==target.dataset.foodRemove);order.foodDelivered=false;if(!order.drinks.length&&!order.foods.length)delete state.orders[state.seat]}}
  if(target.dataset.foodLoad){const item=state.foodMenu.find(x=>x.id===target.dataset.foodLoad);if(item)item.loaded=Math.max(foodOrdered(item.id),Math.min(99,item.loaded+Number(target.dataset.delta)))}
  if(target.dataset.newFoodDelta)state.foodDraft.qty=Math.max(1,Math.min(99,state.foodDraft.qty+Number(target.dataset.newFoodDelta)));
  if(target.dataset.foodDelete&&confirm("Remove this food item from today’s menu?")){state.foodMenu=state.foodMenu.filter(x=>x.id!==target.dataset.foodDelete);Object.values(state.orders).forEach(order=>{order.foods=(order.foods||[]).filter(x=>x.id!==target.dataset.foodDelete);if(!order.drinks.length&&!order.foods.length)delete state.orders[order.seat]})}
  if(target.dataset.action==="food-manage")state.foodSetup=true;
  if(target.dataset.action==="food-done")state.foodSetup=false;
  if(target.dataset.action==="food-add"){const name=state.foodDraft.name.trim(),qty=state.foodDraft.qty;if(name){state.foodMenu.push({id:`food-${Date.now()}`,name,loaded:qty});state.foodDraft={name:"",qty:1};state.foodSetup=true}}
  if(target.dataset.action==="scan-menu")document.getElementById("menuPhotoInput")?.click();
  if(target.dataset.scanRemove!==undefined&&state.scanDraft)state.scanDraft.splice(Number(target.dataset.scanRemove),1);
  if(target.dataset.scanQty!==undefined&&state.scanDraft){const item=state.scanDraft[Number(target.dataset.scanQty)];if(item)item.qty=Math.max(1,Math.min(99,item.qty+Number(target.dataset.delta)))}
  if(target.dataset.action==="scan-add-item"&&state.scanDraft){const name=state.scanNewItem.trim();if(name){state.scanDraft.push({name,qty:1});state.scanNewItem=""}}
  if(target.dataset.action==="scan-confirm"&&state.scanDraft){state.scanDraft.forEach((item,index)=>{const trimmed=item.name.trim();if(trimmed)state.foodMenu.push({id:`food-${Date.now()}-${index}`,name:trimmed,loaded:item.qty})});state.scanDraft=null;state.scanError=null}
  if(target.dataset.action==="scan-cancel"){state.scanDraft=null;state.scanError=null}
  if(target.dataset.edit){state.seat=target.dataset.edit;state.activeDrink=state.orders[state.seat].drinks.length?0:null;state.category=state.orders[state.seat].foods?.length?"Food":state.orders[state.seat].drinks[0]?.category||"Juice & Water";state.mode="take"}
  if(target.dataset.deliverFood){const order=state.orders[target.dataset.deliverFood];order.foodDelivered=!order.foodDelivered}
  if(target.dataset.deliverDrinks){const order=state.orders[target.dataset.deliverDrinks];order.drinksDelivered=!order.drinksDelivered}
  if(target.dataset.action==="orientation")state.orientation=state.orientation==="front"?"rear":"front";
  if(target.dataset.action==="theme"){state.theme=state.theme==="dark"?"light":"dark";applyTheme()}
  if(target.dataset.action==="clear-orders"&&confirm("Clear all seat selections? This removes every food and drink assigned to a seat, but keeps today’s food menu and loaded quantities.")){state.orders={};state.activeDrink=null;state.mode="take"}
  if(target.dataset.action==="clear-all"&&confirm("Clear all orders and remove today’s First Class food menu? This starts a completely fresh flight.")){state.orders={};state.foodMenu=[];state.foodDraft={name:"",qty:1};state.foodSetup=false;state.activeDrink=null;state.mode="take"}
  save();render();
});

function resizeImageToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(reader.error);
    reader.onload=()=>{
      const img=new Image();
      img.onerror=reject;
      img.onload=()=>{
        const maxDim=1600,scale=Math.min(1,maxDim/Math.max(img.width,img.height));
        const canvas=document.createElement("canvas");
        canvas.width=Math.round(img.width*scale);
        canvas.height=Math.round(img.height*scale);
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",0.82).split(",")[1]);
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function scanMenuPhoto(file){
  state.scanning=true;state.scanError=null;render();
  try{
    const image=await resizeImageToBase64(file);
    const response=await fetch("/api/scan-menu",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({image})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"Scan failed");
    const items=Array.isArray(data.items)?data.items:[];
    if(items.length)state.scanDraft=items.map(name=>({name,qty:1}));
    else state.scanError="No food items found in that photo. Try a clearer picture or add items manually.";
  }catch(err){
    state.scanError=navigator.onLine?(err?.message||"Couldn’t read that menu. Try again or add items manually."):"You’re offline — connect to scan a menu.";
  }finally{
    state.scanning=false;render();
  }
}

document.body.insertAdjacentHTML("beforeend",'<input type="file" id="menuPhotoInput" accept="image/*" hidden>');
document.getElementById("menuPhotoInput").addEventListener("change",event=>{const file=event.target.files[0];event.target.value="";if(file)scanMenuPhoto(file)});
window.addEventListener("online",render);
window.addEventListener("offline",render);

render();
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js");
