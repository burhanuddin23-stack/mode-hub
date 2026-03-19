import { fallbackRecipes, matchaFacts, matchaFeedUrl } from "./matcha-data.js";
import { buildSavedId, isSaved, toggleSavedItem } from "./saved-items.js";
import { initAvocadoPet } from "./avocado-pet.js";

const matchaGrid = document.querySelector("#matchaGrid");
const matchaStatus = document.querySelector("#matchaStatus");
const pourButton = document.querySelector("#pourButton");
const matchaCup = document.querySelector("#matchaCup");
const matchaFactsList = document.querySelector("#matchaFactsList");
const avocado = initAvocadoPet({
  label: "Matchacado",
  face: "happy",
  intro: "I support calm rituals and strong whisking technique.",
});

let allRecipes = fallbackRecipes;
const saveRegistry = new Map();

function rememberSavedItem(item) {
  saveRegistry.set(item.id, item);
  return item;
}

function getSaveButtonMarkup(item) {
  return `
    <button class="save-button${isSaved(item.id) ? " active" : ""}" type="button" data-save-id="${item.id}">
      ${isSaved(item.id) ? "Saved" : "Save"}
    </button>
  `;
}

function syncSaveButtons(scope = document) {
  scope.querySelectorAll("[data-save-id]").forEach((button) => {
    button.classList.toggle("active", isSaved(button.dataset.saveId));
    button.textContent = isSaved(button.dataset.saveId) ? "Saved" : "Save";
  });
}

function renderRecipeSkeleton() {
  matchaGrid.innerHTML = Array.from({ length: 4 }, () => `
    <article class="matcha-card skeleton-card">
      <div class="skeleton-box skeleton-media"></div>
      <div class="matcha-copy">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line wide"></div>
      </div>
    </article>
  `).join("");
}

function renderRecipes(recipes) {
  const visibleRecipes = recipes.slice(0, 6);

  matchaGrid.innerHTML = visibleRecipes
    .map((recipe, index) => {
      const savedItem = rememberSavedItem({
        id: buildSavedId("recipe", recipe.title, recipe.link),
        type: "recipe",
        title: recipe.title,
        description: recipe.description,
        source: recipe.source,
        link: recipe.link,
      });

      return `
        <article class="matcha-card">
          <a class="matcha-image-link" href="${recipe.link}" target="_blank" rel="noreferrer">
            <img
              class="matcha-image"
              src="${recipe.image || fallbackRecipes[index % fallbackRecipes.length].image}"
              alt="${recipe.title}"
              loading="lazy"
            />
          </a>
          <div class="matcha-copy">
            <div class="card-topline">
              <span class="tag">${recipe.tag || "matcha"}</span>
              <span class="update-date">${recipe.source}</span>
            </div>
            <h4>${recipe.title}</h4>
            <p class="card-description">${recipe.description}</p>
            <div class="card-actions">
              <a class="matcha-link" href="${recipe.link}" target="_blank" rel="noreferrer">
                View full recipe
              </a>
              ${getSaveButtonMarkup(savedItem)}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
  syncSaveButtons(matchaGrid);
}

function renderMatchaFact() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / 86400000);
  const facts = Array.from({ length: 3 }, (_, offset) => {
    const index = (dayOfYear + offset) % matchaFacts.length;
    return matchaFacts[index];
  });

  matchaFactsList.innerHTML = facts
    .map((fact) => `<p class="matcha-fact-text">${fact}</p>`)
    .join("");
}

async function loadRecipes() {
  try {
    const response = await fetch(matchaFeedUrl);
    if (!response.ok) {
      throw new Error(`Recipe request failed: ${response.status}`);
    }

    const payload = await response.json();
    const recipes = payload.recipes?.length ? payload.recipes : fallbackRecipes;
    allRecipes = recipes;
    renderRecipes(allRecipes);

    matchaStatus.textContent = "Recipe shelf loaded.";
  } catch (error) {
    allRecipes = fallbackRecipes;
    renderRecipes(allRecipes);
    matchaStatus.textContent = "Curated recipes loaded.";
    console.error(error);
  }
}

function activatePour() {
  matchaCup.classList.remove("pouring");
  void matchaCup.offsetWidth;
  matchaCup.classList.add("pouring");
  window.setTimeout(() => {
    matchaCup.classList.remove("pouring");
  }, 1200);
}

pourButton.addEventListener("click", activatePour);
document.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-id]");
  if (!saveButton) return;
  const item = saveRegistry.get(saveButton.dataset.saveId);
  if (!item) return;

  event.preventDefault();
  toggleSavedItem(item);
  syncSaveButtons();
});
window.addEventListener("saved-items-updated", () => syncSaveButtons());
renderRecipeSkeleton();
renderMatchaFact();
window.setInterval(renderMatchaFact, 24 * 60 * 60 * 1000);
loadRecipes();
