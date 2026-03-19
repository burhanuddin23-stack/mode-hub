import {
  dailyQuizzes,
  fallbackNews,
  matchesFeedUrl,
  newsFeedUrl,
  nextMatch,
  quotes,
  recentMatches,
} from "./ronaldo-data.js";
import { buildSavedId, isSaved, toggleSavedItem } from "./saved-items.js";

const newsGrid = document.querySelector("#newsGrid");
const newsStatus = document.querySelector("#newsStatus");
const matchesGrid = document.querySelector("#matchesGrid");
const latestResultCard = document.querySelector("#latestResultCard");
const quoteText = document.querySelector("#quoteText");
const quoteTeaser = document.querySelector("#quoteTeaser");
const nextMatchCard = document.querySelector("#nextMatchCard");
const quizLabel = document.querySelector("#quizLabel");
const quizQuestion = document.querySelector("#quizQuestion");
const quizOptions = document.querySelector("#quizOptions");
const quizFeedback = document.querySelector("#quizFeedback");
const siuuButton = document.querySelector("#siuuButton");
const siuuAudio = document.querySelector("#siuuAudio");
const celebrationLayer = document.querySelector("#celebrationLayer");
const celebrationGif = document.querySelector("#celebrationGif");
const saveQuoteButton = document.querySelector("#saveQuoteButton");

const saveRegistry = new Map();
let currentQuote = "";

function rememberSavedItem(item) {
  saveRegistry.set(item.id, item);
  return item;
}

function getSaveButtonMarkup(item, label = "Save") {
  return `
    <button
      class="save-button${isSaved(item.id) ? " active" : ""}"
      type="button"
      data-save-id="${item.id}"
    >
      ${isSaved(item.id) ? "Saved" : label}
    </button>
  `;
}

function syncSaveButtons(scope = document) {
  scope.querySelectorAll("[data-save-id]").forEach((button) => {
    button.classList.toggle("active", isSaved(button.dataset.saveId));
    button.textContent = isSaved(button.dataset.saveId) ? "Saved" : "Save";
  });
}

function renderNewsSkeleton() {
  newsGrid.innerHTML = Array.from({ length: 4 }, () => `
    <article class="news-card skeleton-card">
      <div class="skeleton-box skeleton-media"></div>
      <div class="news-copy">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </article>
  `).join("");
}

function renderMatchSkeleton() {
  latestResultCard.innerHTML = `
    <p class="panel-label">Latest Result</p>
    <article class="match-card skeleton-card">
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line wide"></div>
    </article>
  `;
  matchesGrid.innerHTML = Array.from({ length: 2 }, () => `
    <article class="match-card skeleton-card">
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line wide"></div>
    </article>
  `).join("");
}

function formatFeedDate(value) {
  if (!value) {
    return "Recent";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getSourceName(item) {
  if (item.source?.title) {
    return item.source.title;
  }

  if (item.source) {
    return item.source;
  }

  return getDomain(item.link) || "News source";
}

function getNewsImage(item, index) {
  if (item.thumbnail) {
    return item.thumbnail;
  }

  if (item.enclosure?.link) {
    return item.enclosure.link;
  }

  if (item.image) {
    return item.image;
  }

  return fallbackNews[index % fallbackNews.length].image;
}

function renderNews(items, live = false) {
  newsGrid.innerHTML = items
    .slice(0, 8)
    .map((item, index) => {
      const savedItem = rememberSavedItem({
        id: buildSavedId("news", item.title, item.link),
        type: "news",
        title: item.title,
        description:
          item.description || "Open the article for the latest Ronaldo coverage.",
        source: getSourceName(item),
        link: item.link,
      });

      return `
        <article class="news-card">
          <a class="news-image-link" href="${item.link}" target="_blank" rel="noreferrer">
            <img
              class="news-image"
              src="${getNewsImage(item, index)}"
              alt="${item.title}"
              loading="lazy"
            />
          </a>
          <div class="news-copy">
            <div class="card-topline">
              <span class="tag">${item.category || "news"}</span>
              <span class="update-date">${item.date || formatFeedDate(item.pubDate)}</span>
            </div>
            <h4>${item.title}</h4>
            <p class="card-description">
              ${item.description || "Open the article for the latest Ronaldo coverage."}
            </p>
            <div class="news-footer">
              <span>${getSourceName(item)}</span>
              <div class="card-actions">
                <a href="${item.link}" target="_blank" rel="noreferrer">Open story</a>
                ${getSaveButtonMarkup(savedItem)}
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  newsStatus.textContent = live
    ? "Headlines loaded."
    : "Fallback headlines loaded.";
  syncSaveButtons(newsGrid);
}

async function loadNews() {
  try {
    const response = await fetch(newsFeedUrl);
    if (!response.ok) {
      throw new Error(`Feed request failed: ${response.status}`);
    }

    const payload = await response.json();
    const items = (payload.items || []).map((item) => ({
      ...item,
      category: "news",
      description:
        item.description?.replace(/<[^>]+>/g, "").trim() ||
        "Live headline from the Ronaldo news feed.",
    }));

    if (!items.length) {
      throw new Error("Empty news feed");
    }

    renderNews(items, true);
    if (payload.fetchedAt) {
      const loadedAt = new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(payload.fetchedAt));
      newsStatus.textContent = `Updated ${loadedAt}.`;
    }
  } catch (error) {
    renderNews(fallbackNews, false);
    newsStatus.textContent = "Fallback headlines loaded.";
    console.error(error);
  }
}

function renderMatchCard(match, highlighted = false) {
  const goals = match.goals ?? "-";
  const conceded = match.assists ?? "-";
  const goalDiff =
    typeof match.goals === "number" && typeof match.assists === "number"
      ? match.goals - match.assists
      : "-";

  const savedItem = rememberSavedItem({
    id: buildSavedId("match", `${match.team || "Ronaldo side"} vs ${match.opponent}`, match.link || `${match.dateLabel}`),
    type: "match",
    title: `${match.team || "Ronaldo side"} vs ${match.opponent}`,
    description: `${match.score} · ${match.dateLabel} · ${match.competition}`,
    source: match.competition,
    link: match.link || "",
  });

  return `
    <article class="match-card${highlighted ? " match-card-highlighted" : ""}">
      <div class="match-header">
        <p class="tag">${match.competition}</p>
        <p class="update-date">${match.dateLabel || match.result}</p>
      </div>
      <h4>${match.team || "Ronaldo side"} vs ${match.opponent}</h4>
      <p class="scoreline">${match.score}</p>
      <div class="metric-grid">
        <div class="metric">
          <p class="metric-label">Team Goals</p>
          <p class="metric-value">${goals}</p>
        </div>
        <div class="metric">
          <p class="metric-label">Conceded</p>
          <p class="metric-value">${conceded}</p>
        </div>
        <div class="metric">
          <p class="metric-label">Goal Diff</p>
          <p class="metric-value">${goalDiff}</p>
        </div>
      </div>
      <p class="match-result-label">${match.result}</p>
      ${
        match.link
          ? `<a class="match-more-link" href="${match.link}" target="_blank" rel="noreferrer">Know more</a>`
          : ""
      }
      ${getSaveButtonMarkup(savedItem)}
    </article>
  `;
}

function hasUsableRecentMatch(match) {
  return Boolean(
    match &&
      match.opponent &&
      match.dateLabel &&
      match.score &&
      /\d/.test(match.score) &&
      match.result !== "Scheduled" &&
      (match.score !== "0 - 0" || /match finished|ft|full time/i.test(match.status || ""))
  );
}

function hasUsableNextMatch(match) {
  return Boolean(match && match.opponent && match.dateLabel && match.timestamp);
}

function renderMatches(items) {
  const [latestMatch, ...restMatches] = items;

  latestResultCard.innerHTML = latestMatch
    ? `
      <p class="panel-label">Latest Result</p>
      ${renderMatchCard(latestMatch, true)}
    `
    : "";

  matchesGrid.innerHTML = restMatches
    .map(
      (match) => renderMatchCard(match)
    )
    .join("");
  syncSaveButtons(latestResultCard);
  syncSaveButtons(matchesGrid);
}

function updateMatchCountdown(match) {
  if (!match.timestamp) {
    return;
  }

  const target = new Date(match.timestamp);
  if (Number.isNaN(target.getTime())) {
    return;
  }

  const render = () => {
    const diff = target.getTime() - Date.now();
    const countdownNode = nextMatchCard.querySelector(".next-match-countdown");
    if (!countdownNode) return;

    if (diff <= 0) {
      countdownNode.textContent = "Kickoff time";
      return;
    }

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    countdownNode.textContent = `${days}d ${hours}h ${minutes}m`;
    window.setTimeout(render, 60000);
  };

  render();
}

async function loadMatches() {
  try {
    const response = await fetch(matchesFeedUrl);
    if (!response.ok) {
      throw new Error(`Matches request failed: ${response.status}`);
    }

    const payload = await response.json();
    const liveRecentMatches = payload.recentMatches?.length
      ? payload.recentMatches.filter(hasUsableRecentMatch)
      : [];
    const liveNextMatch = hasUsableNextMatch(payload.nextMatch) ? payload.nextMatch : nextMatch;

    renderMatches(liveRecentMatches.length ? liveRecentMatches : recentMatches);
    renderNextMatch(liveNextMatch);
  } catch (error) {
    renderMatches(recentMatches);
    renderNextMatch(nextMatch);
    console.error(error);
  }
}

function renderQuote(quotesList) {
  const dayIndex = new Date().getDate() % quotesList.length;
  const quote = quotesList[dayIndex];
  currentQuote = quote;
  quoteText.textContent = quote;
  quoteTeaser.textContent = quote;
  if (saveQuoteButton) {
    const savedId = buildSavedId("quote", quote);
    saveQuoteButton.dataset.saveId = savedId;
    rememberSavedItem({
      id: savedId,
      type: "quote",
      title: "Ronaldo Quote",
      description: quote,
      source: "Ronaldo Mode",
      link: "",
    });
    saveQuoteButton.textContent = isSaved(savedId) ? "Saved" : "Save quote";
    saveQuoteButton.classList.toggle("active", isSaved(savedId));
  }
}

function renderNextMatch(match) {
  nextMatchCard.innerHTML = `
    <p class="hero-stat-label">Next Match Date</p>
    <h3>${match.dateLabel}</h3>
    <p class="next-match-opponent">${match.team || "Ronaldo side"} vs ${match.opponent}</p>
    <p class="next-match-detail">${match.competition} · ${match.timeLabel}</p>
    <p class="next-match-countdown"></p>
    <p class="next-match-note">${match.note}</p>
  `;
  updateMatchCountdown(match);
}

function renderQuiz(quizzes) {
  const quizIndex = new Date().getDate() % quizzes.length;
  const quiz = quizzes[quizIndex];

  quizLabel.textContent = `Question ${quizIndex + 1} of ${quizzes.length}`;
  quizQuestion.textContent = quiz.prompt;
  quizFeedback.textContent = "";

  quizOptions.innerHTML = quiz.options
    .map(
      (option, index) => `
        <button class="quiz-option" type="button" data-index="${index}">
          <span class="quiz-option-letter">${String.fromCharCode(65 + index)}</span>
          <span>${option}</span>
        </button>
      `
    )
    .join("");

  quizOptions.querySelectorAll(".quiz-option").forEach((button) => {
    button.addEventListener("click", () => {
      const selectedIndex = Number(button.dataset.index);
      const isCorrect = selectedIndex === quiz.answer;

      quizOptions.querySelectorAll(".quiz-option").forEach((optionButton, optionIndex) => {
        optionButton.disabled = true;
        optionButton.classList.toggle("correct", optionIndex === quiz.answer);
        optionButton.classList.toggle(
          "incorrect",
          optionIndex === selectedIndex && selectedIndex !== quiz.answer
        );
      });

      quizFeedback.textContent = isCorrect
        ? `Correct. ${quiz.explanation}`
        : `Not this one. ${quiz.explanation}`;
      quizFeedback.classList.toggle("success", isCorrect);
      quizFeedback.classList.toggle("error", !isCorrect);
    });
  });
}

function playSiuuSound() {
  if (siuuAudio) {
    siuuAudio.currentTime = 0;
    siuuAudio.play().catch((error) => {
      console.error(error);
    });
  }
}

function activateSiuu() {
  if (celebrationGif) {
    const nextSrc = "./public/ronaldo-siuu.gif";
    celebrationGif.src = "";
    celebrationGif.offsetHeight;
    celebrationGif.src = `${nextSrc}?v=${Date.now()}`;
  }

  celebrationLayer.classList.add("active");
  document.body.classList.add("celebrating");
  playSiuuSound();

  window.setTimeout(() => {
    celebrationLayer.classList.remove("active");
    document.body.classList.remove("celebrating");
  }, 2400);
}

function init() {
  renderNewsSkeleton();
  renderMatchSkeleton();
  renderQuote(quotes);
  renderQuiz(dailyQuizzes);
  loadNews();
  loadMatches();
  siuuButton.addEventListener("click", activateSiuu);
  document.addEventListener("click", (event) => {
    const saveButton = event.target.closest("[data-save-id]");
    if (!saveButton) return;

    const item = saveRegistry.get(saveButton.dataset.saveId);
    if (!item) return;

    event.preventDefault();
    const saved = toggleSavedItem(item);
    saveButton.classList.toggle("active", saved);
    saveButton.textContent = saved
      ? (saveButton.id === "saveQuoteButton" ? "Saved" : "Saved")
      : (saveButton.id === "saveQuoteButton" ? "Save quote" : "Save");
    syncSaveButtons();
  });
  window.addEventListener("saved-items-updated", () => {
    syncSaveButtons();
    if (saveQuoteButton && currentQuote) {
      const savedId = buildSavedId("quote", currentQuote);
      saveQuoteButton.textContent = isSaved(savedId) ? "Saved" : "Save quote";
      saveQuoteButton.classList.toggle("active", isSaved(savedId));
    }
  });
}

init();
