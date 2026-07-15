const aircraft = ["737-700", "737-800", "737 MAX 8", "737-900", "737 MAX 9"];
const seatLetters = ["A", "B", "C", "D", "E", "F"];
const menu = {
  "Mixers": ["Tonic Water", "Polar Original Seltzer", "Polar Cranberry Lime Seltzer", "Canada Dry Ginger Ale", "Bloody Mary Mix"],
  "Sodas": ["Coca-Cola", "Diet Coke", "Coke Zero", "Sprite"],
  "Alcohol": [
    "Broken Earth Red Blend", "Waterbrook White Blend", "Cuvée 89 Brut Sparkling Wine",
    "Fremont Cloud Cruiser IPA", "Fremont Golden Pilsner", "Jack Daniel’s Whiskey",
    "Buffalo Trace Bourbon", "Glenfarclas Scotch", "Dulce Vida Organic Tequila Blanco",
    "Bacardí Rum", "Aviation Gin", "Tito’s Handmade Vodka",
    "Crater Lake Hazelnut Espresso Vodka", "Five Farms Irish Cream",
    "Straightaway Blanco Margarita", "Straightaway Oregon Old Fashioned", "HOP WTR Blood Orange"
  ],
  "Coffee & Teas": ["Stumptown Coffee", "Stumptown Decaf Coffee", "Stash English Breakfast Tea", "Stash Peppermint Tea", "Stash Jasmine Blossom Green Tea", "Stumptown Cold Brew Copilot"],
  "Juice & Water": ["Boxed Water", "Apple Juice", "Cranberry Juice", "Orange Juice", "Passion Orange Guava Juice"]
};
const shortNames = {
  "Broken Earth Red Blend": "Red Wine", "Waterbrook White Blend": "White Wine",
  "Cuvée 89 Brut Sparkling Wine": "Sparkling Wine", "Fremont Cloud Cruiser IPA": "Cloud Cruiser IPA",
  "Fremont Golden Pilsner": "Golden Pilsner", "Dulce Vida Organic Tequila Blanco": "Dulce Vida Tequila",
  "Crater Lake Hazelnut Espresso Vodka": "Espresso Vodka", "Straightaway Blanco Margarita": "Blanco Margarita",
  "Straightaway Oregon Old Fashioned": "Old Fashioned", "Stash Jasmine Blossom Green Tea": "Jasmine Green Tea",
  "Passion Orange Guava Juice": "POG Juice"
};

const state = {
  plane: localStorage.getItem("cabin-drinks-plane") || "737-900",
  seat: "8C",
  category: "Sodas",
  mode: "take",
  orders: JSON.parse(localStorage.getItem("cabin-drinks-orders") || "{}")
};

const app = document.querySelector("#app");
const esc = value => String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const label = drink => shortNames[drink] || drink;
const orderList = () => Object.values(state.orders).sort((a,b) => parseInt(a.seat)-parseInt(b.seat) || a.seat.localeCompare(b.seat));
const rows = () => [6,7,8,9,10,16].concat(["737-900","737 MAX 9"].includes(state.plane) ? [17] : []);
const modifiersFor = order => order.category === "Coffee & Teas"
  ? (order.drink.includes("Cold Brew") ? ["Ice","No Ice","Cream","Sugar","Sweetener"] : ["Cream","Sugar","Sweetener","Lemon"])
  : ["Ice","No Ice","Lime","Lemon"];

function save() {
  localStorage.setItem("cabin-drinks-plane", state.plane);
  localStorage.setItem("cabin-drinks-orders", JSON.stringify(state.orders));
}

function header() {
  const count = orderList().filter(order => !order.delivered).length;
  return `<header class="topbar"><div><p class="eyebrow">Offline service pad</p><h1>Cabin Drinks</h1></div>
    <select data-action="plane" aria-label="Aircraft">${aircraft.map(item => `<option${item===state.plane?" selected":""}>${item}</option>`).join("")}</select></header>
    <nav class="mode-tabs" aria-label="Workflow">
      <button data-mode="take" class="${state.mode==="take"?"active":""}">Take orders</button>
      <button data-mode="prepare" class="${state.mode==="prepare"?"active":""}">Prepare <span>${count}</span></button>
      <button data-mode="deliver" class="${state.mode==="deliver"?"active":""}">Deliver</button>
    </nav>`;
}

function takeView() {
  const current = state.orders[state.seat];
  const map = rows().map(row => `<div class="seat-row ${row===16?"exit-start":""}">
    ${row===16?`<div class="exit-label">EXIT ROW${rows().includes(17)?"S":""}</div>`:""}<strong>${row}</strong>
    ${seatLetters.map(letter => {
      const seat = `${row}${letter}`, order = state.orders[seat];
      return `<button data-seat="${seat}" class="${state.seat===seat?"selected":""} ${order?"ordered":""}" aria-label="${seat}${order?`, ${esc(order.drink)}`:""}">${state.seat===seat?seat:letter}${order?"<span></span>":""}</button>`;
    }).join("")}</div>`).join("");

  const drinks = menu[state.category].map(drink => `<button data-drink="${esc(drink)}" class="${current?.drink===drink?"active":""}"><strong>${esc(label(drink))}</strong>${label(drink)!==drink?`<span>${esc(drink)}</span>`:""}</button>`).join("");
  const modifiers = current ? `<div class="modifier-row">${modifiersFor(current).map(mod => `<button data-modifier="${mod}" class="${current.modifiers.includes(mod)?"active":""}">${mod}</button>`).join("")}</div>` : "";
  return `<section class="seat-map" aria-label="Premium Class seat map"><div class="seat-head"><span></span><b>A</b><b>B</b><b>C</b><i></i><b>D</b><b>E</b><b>F</b></div>${map}</section>
    <section class="order-panel"><div class="selected-line"><div><span>Selected seat</span><strong>${state.seat}</strong></div>${current?'<button data-action="remove" class="remove">Remove order</button>':""}</div>
    <div class="category-tabs">${Object.keys(menu).map(cat => `<button data-category="${cat}" class="${state.category===cat?"active":""}">${cat}</button>`).join("")}</div>
    <div class="drink-grid">${drinks}</div>${modifiers}</section>
    <footer class="order-tray"><div><span>${current?`${state.seat} · ${esc(label(current.drink))}`:`${state.seat} · Choose a drink`}</span>${current?.modifiers.length?`<small>${current.modifiers.join(" · ")}</small>`:""}</div>
    <button data-mode="prepare" ${orderList().length?"":"disabled"}>Prepare · ${orderList().length}</button></footer>`;
}

function prepareView() {
  const orders = orderList();
  return `<section class="workflow-panel"><div class="workflow-heading"><div><p class="eyebrow">Galley view</p><h2>Prepare drinks</h2></div><button data-mode="take" class="secondary">Add orders</button></div>
    ${orders.length?`<div class="prep-list">${orders.map(order => `<article class="${order.delivered?"done":""}"><strong class="seat-chip">${order.seat}</strong><div><h3>${esc(order.drink)}</h3><p>${order.modifiers.length?order.modifiers.join(" · "):"Standard"}</p></div><button data-edit="${order.seat}">Edit</button></article>`).join("")}</div>`:empty()}
    <button data-mode="deliver" class="primary wide" ${orders.length?"":"disabled"}>Ready to deliver</button></section>`;
}

function deliverView() {
  const orders = orderList();
  return `<section class="workflow-panel"><div class="workflow-heading"><div><p class="eyebrow">Cabin view</p><h2>Deliver drinks</h2></div><button data-mode="prepare" class="secondary">Back</button></div>
    ${orders.length?`<div class="delivery-grid">${orders.map(order => `<button data-deliver="${order.seat}" class="${order.delivered?"delivered":""}"><strong>${order.seat}</strong><span>${esc(label(order.drink))}</span><small>${order.delivered?"Delivered ✓":order.modifiers.join(" · ")||"Tap when delivered"}</small></button>`).join("")}</div>`:empty()}
    <button data-action="clear" class="clear">Clear flight</button></section>`;
}

function empty() { return '<div class="empty"><strong>No drink orders yet</strong><span>Choose a seat to begin.</span></div>'; }
function render() { app.innerHTML = header() + (state.mode==="take" ? takeView() : state.mode==="prepare" ? prepareView() : deliverView()); }

app.addEventListener("change", event => {
  if (event.target.matches('[data-action="plane"]')) { state.plane=event.target.value; save(); render(); }
});
app.addEventListener("click", event => {
  const target = event.target.closest("button"); if (!target) return;
  if (target.dataset.mode) state.mode=target.dataset.mode;
  if (target.dataset.seat) state.seat=target.dataset.seat;
  if (target.dataset.category) state.category=target.dataset.category;
  if (target.dataset.drink) state.orders[state.seat]={seat:state.seat,drink:target.dataset.drink,category:state.category,modifiers:[],delivered:false};
  if (target.dataset.modifier && state.orders[state.seat]) {
    const order=state.orders[state.seat], mod=target.dataset.modifier;
    order.modifiers=order.modifiers.includes(mod)?order.modifiers.filter(x=>x!==mod):[...order.modifiers,mod];
    if(mod==="Ice") order.modifiers=order.modifiers.filter(x=>x!=="No Ice");
    if(mod==="No Ice") order.modifiers=order.modifiers.filter(x=>x!=="Ice");
  }
  if (target.dataset.edit) { const order=state.orders[target.dataset.edit]; state.seat=order.seat; state.category=order.category; state.mode="take"; }
  if (target.dataset.deliver) state.orders[target.dataset.deliver].delivered=!state.orders[target.dataset.deliver].delivered;
  if (target.dataset.action==="remove") delete state.orders[state.seat];
  if (target.dataset.action==="clear" && confirm("Clear every drink order for this flight?")) { state.orders={}; state.mode="take"; }
  save(); render();
});

render();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
