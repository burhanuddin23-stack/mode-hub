import { fallbackRecipes, matchaFeedUrl } from "./matcha-data.js";

const matchaGrid = document.querySelector("#matchaGrid");
const matchaStatus = document.querySelector("#matchaStatus");
const pourButton = document.querySelector("#pourButton");
const matchaCup = document.querySelector("#matchaCup");
const moodButtons = Array.from(document.querySelectorAll(".matcha-mood-chip"));

let allRecipes = fallbackRecipes;
let activeFilter = "all";

const moodToTags = {
  all: [],
  calm: ["hot", "easy"],
  focus: ["latte", "hot"],
  reset: ["iced", "easy"],
  sweet: ["dessert", "creative"],
  energize: ["latte", "iced"],
};

function filterRecipes(recipes, filter) {
  const tags = moodToTags[filter] || [];
  if (!tags.length) return recipes;

  const filtered = recipes.filter((recipe) => tags.includes(recipe.tag));
  return filtered.length ? filtered : recipes;
}

function renderRecipes(recipes) {
  const visibleRecipes = filterRecipes(recipes, activeFilter).slice(0, 6);

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

function setMoodFilter(filter) {
  activeFilter = filter;
  moodButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderRecipes(allRecipes);
}

function activatePour() {
  matchaCup.classList.remove("pouring");
  void matchaCup.offsetWidth;
  matchaCup.classList.add("pouring");
}

moodButtons.forEach((button) => {
  button.addEventListener("click", () => setMoodFilter(button.dataset.filter));
});

pourButton.addEventListener("click", activatePour);
loadRecipes();
