const cards = [...document.querySelectorAll("[data-planet-preview]")];
const panels = [...document.querySelectorAll("[data-planet-panel]")];

if (cards.length && panels.length) {
  function setActivePlanet(index) {
    panels.forEach((panel) => {
      panel.classList.toggle(
        "is-active",
        panel.dataset.planetPanel === String(index)
      );
    });

    cards.forEach((card) => {
      card.classList.toggle(
        "is-active",
        card.dataset.planetPreview === String(index)
      );
    });
  }

  cards.forEach((card) => {
    const index = Number(card.dataset.planetPreview);

    card.addEventListener("pointerenter", () => setActivePlanet(index));
    card.addEventListener("focus", () => setActivePlanet(index));
  });

  setActivePlanet(0);
}
