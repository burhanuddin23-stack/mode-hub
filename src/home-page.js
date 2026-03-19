import { matchesFeedUrl, nextMatch as fallbackNextMatch, recentMatches } from "./ronaldo-data.js";
import { matchaFeedUrl, fallbackRecipes } from "./matcha-data.js";
import { getSavedCount } from "./saved-items.js";

const homeNextMatch = document.querySelector("#homeNextMatch");
const homeCountdown = document.querySelector("#homeCountdown");
const homeLatestResult = document.querySelector("#homeLatestResult");
const homeMatchaRecipe = document.querySelector("#homeMatchaRecipe");
const homeMatchaSource = document.querySelector("#homeMatchaSource");
const homeSavedCount = document.querySelector("#homeSavedCount");
const homeArchiveCopy = document.querySelector("#homeArchiveCopy");
const breakOrb = document.querySelector("#breakOrb");

let countdownTimerId = null;

const GOOGLE_GAME_LINKS = [
  "https://doodles.google/doodle/30th-anniversary-of-pac-man/",
  "https://www.google.com/search?q=google+snake",
  "https://www.google.com/search?q=tic+tac+toe",
];

function formatMatchLine(match) {
  return `${match.dateLabel} · ${match.team || "Ronaldo side"} vs ${match.opponent}`;
}

function isUsableResult(match) {
  return Boolean(match && match.score && /\d/.test(match.score) && match.score !== "0 - 0");
}

function clearSkeleton(node) {
  if (!node) return;
  node.classList.remove("skeleton-block");
}

function updateCountdown(timestamp) {
  if (countdownTimerId) {
    window.clearTimeout(countdownTimerId);
    countdownTimerId = null;
  }

  if (!timestamp) {
    homeCountdown.textContent = "Date pending";
    clearSkeleton(homeCountdown);
    return;
  }

  const target = new Date(timestamp);
  if (Number.isNaN(target.getTime())) {
    homeCountdown.textContent = "Date pending";
    clearSkeleton(homeCountdown);
    return;
  }

  const tick = () => {
    const difference = target.getTime() - Date.now();

    if (difference <= 0) {
      homeCountdown.textContent = "Match time";
      clearSkeleton(homeCountdown);
      return;
    }

    const totalMinutes = Math.floor(difference / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    homeCountdown.textContent = `${days}d ${hours}h ${minutes}m`;
    clearSkeleton(homeCountdown);
    countdownTimerId = window.setTimeout(tick, 60_000);
  };

  tick();
}

async function loadHomePreview() {
  try {
    const response = await fetch(matchesFeedUrl);
    if (!response.ok) {
      throw new Error(`Preview request failed: ${response.status}`);
    }

    const payload = await response.json();
    const match = payload.nextMatch || fallbackNextMatch;
    const latestResult =
      payload.recentMatches?.find(isUsableResult) || recentMatches.find(isUsableResult);

    homeNextMatch.textContent = formatMatchLine(match);
    clearSkeleton(homeNextMatch);
    updateCountdown(match.timestamp || payload.nextMatch?.timestamp || null);
    if (latestResult) {
      homeLatestResult.textContent = `${latestResult.score} · ${latestResult.opponent}`;
      clearSkeleton(homeLatestResult);
    }
  } catch (error) {
    homeNextMatch.textContent = formatMatchLine(fallbackNextMatch);
    clearSkeleton(homeNextMatch);
    updateCountdown(fallbackNextMatch.timestamp);
    homeLatestResult.textContent = `${recentMatches[0].score} · ${recentMatches[0].opponent}`;
    clearSkeleton(homeLatestResult);
    console.error(error);
  }
}

async function loadMatchaPreview() {
  try {
    const response = await fetch(matchaFeedUrl);
    if (!response.ok) {
      throw new Error(`Matcha preview failed: ${response.status}`);
    }

    const payload = await response.json();
    const recipe = payload.recipes?.[0] || fallbackRecipes[0];

    homeMatchaRecipe.textContent = recipe.title;
    homeMatchaSource.textContent = recipe.source || "Matcha source";
  } catch (error) {
    homeMatchaRecipe.textContent = fallbackRecipes[0].title;
    homeMatchaSource.textContent = fallbackRecipes[0].source;
    console.error(error);
  } finally {
    clearSkeleton(homeMatchaRecipe);
    clearSkeleton(homeMatchaSource);
  }
}

function renderSavedPreview() {
  const count = getSavedCount();
  homeSavedCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
  if (homeArchiveCopy) {
    homeArchiveCopy.textContent = count
      ? `${count} saved item${count === 1 ? "" : "s"} waiting in the archive.`
      : "Stories, recipes, quotes, and match notes you keep.";
  }
}

function pickBreakLink() {
  const index = Math.floor(Math.random() * GOOGLE_GAME_LINKS.length);
  return GOOGLE_GAME_LINKS[index];
}

if (breakOrb) {
  breakOrb.addEventListener("click", (event) => {
    breakOrb.href = pickBreakLink();
  });
}

loadHomePreview();
loadMatchaPreview();
renderSavedPreview();
window.addEventListener("saved-items-updated", renderSavedPreview);
