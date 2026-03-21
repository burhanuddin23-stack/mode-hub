import { matchesFeedUrl, nextMatch as fallbackNextMatch, recentMatches } from "./ronaldo-data.js";
import { matchaFeedUrl, fallbackRecipes } from "./matcha-data.js";
import { getSavedCount } from "./saved-items.js";
import { initAvocadoPet } from "./avocado-pet.js";

const homeNextMatch = document.querySelector("#homeNextMatch");
const homeCountdown = document.querySelector("#homeCountdown");
const homeLatestResult = document.querySelector("#homeLatestResult");
const homeMatchaRecipe = document.querySelector("#homeMatchaRecipe");
const homeMatchaSource = document.querySelector("#homeMatchaSource");
const homeSavedCount = document.querySelector("#homeSavedCount");
const homeArchiveCopy = document.querySelector("#homeArchiveCopy");
const homeDailyQuote = document.querySelector("#homeDailyQuote");
const homeDailyQuoteAuthor = document.querySelector("#homeDailyQuoteAuthor");
const breakOrb = document.querySelector("#breakOrb");
const breakOverlay = document.querySelector("#breakOverlay");
const breakClose = document.querySelector("#breakClose");

let countdownTimerId = null;
const DAILY_QUOTES = [
  { text: "Keep going. This part will not last forever.", author: "Unknown" },
  { text: "You do not need to have it all figured out to take the next step.", author: "Roy T. Bennett" },
  { text: "A hard day is not a hard life.", author: "Unknown" },
  { text: "Rest if you need to. Do not quit on yourself.", author: "Unknown" },
  { text: "Small steps still count when the day feels heavy.", author: "Unknown" },
  { text: "You have survived difficult days before. You can survive this one too.", author: "Unknown" },
  { text: "Strength is sometimes just showing up again tomorrow.", author: "Unknown" },
  { text: "It is okay to move slowly. Forward is still forward.", author: "Unknown" },
  { text: "The fact that you are trying matters more than you think.", author: "Unknown" },
  { text: "Even now, you are allowed to begin again.", author: "Morgan Harper Nichols" },
  { text: "You are not behind. You are in your own process.", author: "Unknown" },
  { text: "One calm decision can change the shape of the whole day.", author: "Unknown" },
];
const avocado = initAvocadoPet({
  label: "Home avo",
  face: "happy",
  intro: "Welcome back. Pick a mode, log a day, or just click me for avocado-grade wisdom.",
});

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

function renderDailyQuote() {
  if (!homeDailyQuote || !homeDailyQuoteAuthor) return;

  const quoteIndex = Math.floor(Math.random() * DAILY_QUOTES.length);
  const quote = DAILY_QUOTES[quoteIndex];

  homeDailyQuote.textContent = `"${quote.text}"`;
  homeDailyQuoteAuthor.textContent = quote.author;
}

if (breakOrb) {
  breakOrb.addEventListener("click", (event) => {
    event.preventDefault();
    breakOverlay?.classList.add("active");
    document.body.classList.add("break-open");
  });
}

if (breakClose) {
  breakClose.addEventListener("click", () => {
    breakOverlay?.classList.remove("active");
    document.body.classList.remove("break-open");
  });
}

if (breakOverlay) {
  breakOverlay.addEventListener("click", (event) => {
    if (event.target === breakOverlay) {
      breakOverlay.classList.remove("active");
      document.body.classList.remove("break-open");
    }
  });
}

loadHomePreview();
loadMatchaPreview();
renderSavedPreview();
renderDailyQuote();
window.addEventListener("saved-items-updated", renderSavedPreview);
