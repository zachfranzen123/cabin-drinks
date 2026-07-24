(() => {
  const installHotWater = () => {
    if (typeof menu === "undefined" || typeof render !== "function") return;

    const coffeeMenu = menu["Coffee & Teas"];
    if (Array.isArray(coffeeMenu) && !coffeeMenu.includes("Hot Water")) {
      const coldBrewIndex = coffeeMenu.indexOf("Stumptown Cold Brew Copilot");
      coffeeMenu.splice(coldBrewIndex >= 0 ? coldBrewIndex : coffeeMenu.length, 0, "Hot Water");
    }

    const customizeHotWaterEditor = () => {
      const active = typeof currentDrink === "function" ? currentDrink() : null;
      if (active?.drink !== "Hot Water") return;

      const editor = document.querySelector(".drink-editor");
      if (!editor) return;

      const additionBlocks = [...editor.querySelectorAll(".addition-block")];
      const creamerBlock = additionBlocks.find(block => block.querySelector('.addition-choice > span')?.textContent.trim() === "Creamer");
      creamerBlock?.remove();

      const modifierRow = editor.querySelector(".modifier-row");
      if (modifierRow) {
        ["Lime packet", "Grapefruit packet"].forEach(modifier => {
          if (modifierRow.querySelector(`[data-modifier="${modifier}"]`)) return;
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.modifier = modifier;
          button.textContent = modifier;
          if ((active.modifiers || []).includes(modifier)) button.classList.add("active");
          modifierRow.appendChild(button);
        });
      }
    };

    const observer = new MutationObserver(customizeHotWaterEditor);
    observer.observe(document.querySelector("#app"), { childList: true, subtree: true });
    render();
    customizeHotWaterEditor();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installHotWater);
  else installHotWater();
})();