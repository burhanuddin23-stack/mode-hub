import {
  dailyMoods,
  dailyQuizzes,
  fallbackNews,
  newsFeedUrl,
  nextMatch,
  quotes,
  recentMatches,
  refreshHours,
} from "./ronaldo-data.js";

const newsGrid = document.querySelector("#newsGrid");
const newsStatus = document.querySelector("#newsStatus");
const matchesGrid = document.querySelector("#matchesGrid");
const quoteText = document.querySelector("#quoteText");
const moodStack = document.querySelector("#moodStack");
const moodGrid = document.querySelector("#moodGrid");
const refreshMeta = document.querySelector("#refreshMeta");
const nextMatchCard = document.querySelector("#nextMatchCard");
const quizLabel = document.querySelector("#quizLabel");
const quizQuestion = document.querySelector("#quizQuestion");
const quizOptions = document.querySelector("#quizOptions");
const quizFeedback = document.querySelector("#quizFeedback");
const siuuButton = document.querySelector("#siuuButton");
const celebrationLayer = document.querySelector("#celebrationLayer");
const celebrationMessage = document.querySelector("#celebrationMessage");

const hypeMessages = [
  "SIUU",
  "LOCK IN",
  "CHAMPION MODE",
  "CONFIDENCE ACTIVATED",
];

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
    .slice(0, 4)
    .map(
      (item, index) => `
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
              <a href="${item.link}" target="_blank" rel="noreferrer">Open story</a>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  newsStatus.textContent = live
    ? "Live headlines loaded from the news feed."
    : "Showing fallback headlines because the live feed is unavailable.";
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
      newsStatus.textContent = `Live headlines loaded from the news feed at ${loadedAt}.`;
    }
  } catch (error) {
    renderNews(fallbackNews, false);
    newsStatus.textContent = "Showing fallback headlines because the live feed request failed.";
    console.error(error);
  }
}

function renderMatches(items) {
  matchesGrid.innerHTML = items
    .map(
      (match) => `
        <article class="match-card">
          <div class="match-header">
            <p class="tag">${match.competition}</p>
            <p class="update-date">${match.result}</p>
          </div>
          <h4>vs ${match.opponent}</h4>
          <p class="scoreline">${match.score}</p>
          <div class="metric-grid">
            <div class="metric">
              <p class="metric-label">Goals</p>
              <p class="metric-value">${match.goals}</p>
            </div>
            <div class="metric">
              <p class="metric-label">Assists</p>
              <p class="metric-value">${match.assists}</p>
            </div>
            <div class="metric">
              <p class="metric-label">Impact</p>
              <p class="metric-value">${match.goals + match.assists}</p>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderMindset(moods, quotesList) {
  const dayIndex = new Date().getDate() % quotesList.length;
  quoteText.textContent = quotesList[dayIndex];

  moodStack.innerHTML = moods
    .map(
      (mood) => `
        <div class="mood-chip">
          <span class="eyebrow">${mood.label}</span>
          <span class="mood-label">${mood.value}</span>
          <span class="mood-copy">${mood.description}</span>
        </div>
      `
    )
    .join("");

  moodGrid.innerHTML = moods
    .map(
      (mood) => `
        <div class="hero-pill">
          <span>${mood.label}</span>
          <strong>${mood.value}</strong>
        </div>
      `
    )
    .join("");
}

function renderRefreshMeta() {
  const now = new Date();
  const nextRefresh = new Date(now.getTime() + refreshHours * 60 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  refreshMeta.innerHTML = `
    <span>Live news enabled</span>
    <span>Opened ${formatter.format(now)}</span>
    <span>Suggested refresh ${formatter.format(nextRefresh)}</span>
  `;
}

function renderNextMatch(match) {
  nextMatchCard.innerHTML = `
    <p class="hero-stat-label">Next Match Date</p>
    <h3>${match.dateLabel}</h3>
    <p class="next-match-opponent">vs ${match.opponent}</p>
    <p class="next-match-detail">${match.competition} · ${match.timeLabel}</p>
    <p class="next-match-note">${match.note}</p>
  `;
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

function createBurst(originX, originY) {
  for (let index = 0; index < 18; index += 1) {
    const burst = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 18;
    const distance = 90 + Math.random() * 120;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    burst.className = "burst";
    burst.style.left = `${originX}px`;
    burst.style.top = `${originY}px`;
    burst.style.setProperty("--x", `${x}px`);
    burst.style.setProperty("--y", `${y}px`);
    celebrationLayer.appendChild(burst);

    window.setTimeout(() => burst.remove(), 920);
  }
}

function activateSiuu() {
  const buttonBox = siuuButton.getBoundingClientRect();
  const originX = buttonBox.left + buttonBox.width / 2;
  const originY = buttonBox.top + buttonBox.height / 2;
  const message = hypeMessages[Math.floor(Math.random() * hypeMessages.length)];

  celebrationMessage.textContent = message;
  celebrationLayer.classList.add("active");
  document.body.classList.add("celebrating");
  createBurst(originX, originY);

  window.setTimeout(() => {
    celebrationLayer.classList.remove("active");
    document.body.classList.remove("celebrating");
  }, 1100);
}

function init() {
  renderMatches(recentMatches);
  renderMindset(dailyMoods, quotes);
  renderRefreshMeta();
  renderNextMatch(nextMatch);
  renderQuiz(dailyQuizzes);
  loadNews();
  siuuButton.addEventListener("click", activateSiuu);
}

init();
