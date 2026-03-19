import { fallbackRecipes, matchaFacts, matchaFeedUrl } from "./matcha-data.js";

const matchaGrid = document.querySelector("#matchaGrid");
const matchaStatus = document.querySelector("#matchaStatus");
const pourButton = document.querySelector("#pourButton");
const matchaCup = document.querySelector("#matchaCup");
const matchaFactsList = document.querySelector("#matchaFactsList");

let allRecipes = fallbackRecipes;

function renderRecipes(recipes) {
  const visibleRecipes = recipes.slice(0, 6);

  matchaGrid.innerHTML = visibleRecipes
    .map(
      (recipe, index) => `
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
            <a class="matcha-link" href="${recipe.link}" target="_blank" rel="noreferrer">
              View full recipe
            </a>
          </div>
        </article>
      `
    )
    .join("");
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
renderMatchaFact();
window.setInterval(renderMatchaFact, 24 * 60 * 60 * 1000);
loadRecipes();
