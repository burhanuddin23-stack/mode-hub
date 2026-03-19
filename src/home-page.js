import { matchesFeedUrl, nextMatch as fallbackNextMatch } from "./ronaldo-data.js";

const homeNextMatch = document.querySelector("#homeNextMatch");
const homeCountdown = document.querySelector("#homeCountdown");

let countdownTimerId = null;

function formatMatchLine(match) {
  return `${match.dateLabel} · ${match.team || "Ronaldo side"} vs ${match.opponent}`;
}

function updateCountdown(timestamp) {
  if (countdownTimerId) {
    window.clearTimeout(countdownTimerId);
    countdownTimerId = null;
  }

  if (!timestamp) {
    homeCountdown.textContent = "Date pending";
    return;
  }

  const target = new Date(timestamp);
  if (Number.isNaN(target.getTime())) {
    homeCountdown.textContent = "Date pending";
    return;
  }

  const tick = () => {
    const difference = target.getTime() - Date.now();

    if (difference <= 0) {
      homeCountdown.textContent = "Match time";
      return;
    }

    const totalMinutes = Math.floor(difference / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    homeCountdown.textContent = `${days}d ${hours}h ${minutes}m`;
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

    homeNextMatch.textContent = formatMatchLine(match);
    updateCountdown(match.timestamp || payload.nextMatch?.timestamp || null);
  } catch (error) {
    homeNextMatch.textContent = formatMatchLine(fallbackNextMatch);
    updateCountdown(fallbackNextMatch.timestamp);
    console.error(error);
  }
}

loadHomePreview();
