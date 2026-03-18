import { matchesFeedUrl, nextMatch as fallbackNextMatch } from "./ronaldo-data.js";

const homeNextMatch = document.querySelector("#homeNextMatch");
const homeCountdown = document.querySelector("#homeCountdown");
const eidBanner = document.querySelector("#eidBanner");
const EID_BANNER_END = "2026-03-20T16:00:00+01:00";

function formatMatchLine(match) {
  return `${match.dateLabel} · ${match.team || "Ronaldo side"} vs ${match.opponent}`;
}

function updateCountdown(timestamp) {
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
    const now = new Date();
    const difference = target.getTime() - now.getTime();

    if (difference <= 0) {
      homeCountdown.textContent = "Match time";
      return;
    }

    const totalMinutes = Math.floor(difference / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    homeCountdown.textContent = `${days}d ${hours}h ${minutes}m`;
    window.setTimeout(tick, 60_000);
  };

  tick();
}

function syncEidBanner() {
  if (!eidBanner) return;

  const endTime = new Date(EID_BANNER_END).getTime();
  if (Date.now() > endTime) {
    eidBanner.remove();
  }
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
    updateCountdown(payload.nextMatch?.timestamp || null);
  } catch (error) {
    homeNextMatch.textContent = formatMatchLine(fallbackNextMatch);
    homeCountdown.textContent = "Live countdown on deploy";
    console.error(error);
  }
}

loadHomePreview();
syncEidBanner();
