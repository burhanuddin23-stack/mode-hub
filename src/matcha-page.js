import { fallbackRecipes, matchaFacts, matchaFeedUrl } from "./matcha-data.js";

const matchaGrid = document.querySelector("#matchaGrid");
const matchaStatus = document.querySelector("#matchaStatus");
const pourButton = document.querySelector("#pourButton");
const matchaCup = document.querySelector("#matchaCup");
const matchaFactText = document.querySelector("#matchaFactText");

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
  const index = new Date().getHours() % matchaFacts.length;
  matchaFactText.textContent = matchaFacts[index];
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

    const loadedAt = payload.fetchedAt
      ? new Intl.DateTimeFormat("en", {
          day: "2-digit",
          month: "short",
        }).format(new Date(payload.fetchedAt))
      : "recently";

    matchaStatus.textContent = `Recipe shelf refreshed from the web on ${loadedAt}.`;
  } catch (error) {
    allRecipes = fallbackRecipes;
    renderRecipes(allRecipes);
    matchaStatus.textContent = "Showing fallback matcha recipes because the live source is unavailable.";
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
window.setInterval(renderMatchaFact, 60 * 60 * 1000);
loadRecipes();
