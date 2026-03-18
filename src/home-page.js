import { matchesFeedUrl, nextMatch as fallbackNextMatch } from "./ronaldo-data.js";

const homeNextMatch = document.querySelector("#homeNextMatch");
const homeCountdown = document.querySelector("#homeCountdown");
const eidBanner = document.querySelector("#eidBanner");
const breakFab = document.querySelector("#breakFab");
const breakOverlay = document.querySelector("#breakOverlay");
const breakClose = document.querySelector("#breakClose");
const breakLoading = document.querySelector("#breakLoading");
const breakContent = document.querySelector("#breakContent");

const EID_BANNER_END = "2026-03-20T16:00:00+01:00";
const spotifyPlaylistEmbed =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DX3PIPIT6lEg5?utm_source=generator";

const portugalImages = [
  {
    src: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80",
    alt: "Lisbon tram street",
  },
  {
    src: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1200&q=80",
    alt: "Portugal ocean cliffs",
  },
  {
    src: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
    alt: "Portuguese sunset coast",
  },
];

const loadingMessages = [
  "Activating recovery protocol...",
  "Workaholic detected.",
  "Emergency relaxation deployed.",
];

let countdownTimerId = null;
let breakSequenceId = null;
let paddleLoopId = null;

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
    countdownTimerId = window.setTimeout(tick, 60_000);
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
    updateCountdown(match.timestamp || payload.nextMatch?.timestamp || null);
  } catch (error) {
    homeNextMatch.textContent = formatMatchLine(fallbackNextMatch);
    updateCountdown(fallbackNextMatch.timestamp);
    console.error(error);
  }
}

function openBreakOverlay() {
  breakOverlay.classList.add("active");
  breakOverlay.setAttribute("aria-hidden", "false");
}

function closeBreakOverlay() {
  breakOverlay.classList.remove("active");
  breakOverlay.setAttribute("aria-hidden", "true");
  breakLoading.textContent = "";
  breakContent.innerHTML = "";
  if (breakSequenceId) {
    window.clearTimeout(breakSequenceId);
    breakSequenceId = null;
  }
  if (paddleLoopId) {
    window.cancelAnimationFrame(paddleLoopId);
    paddleLoopId = null;
  }
}

function renderPortugalWindow() {
  const image = portugalImages[Math.floor(Math.random() * portugalImages.length)];

  breakContent.innerHTML = `
    <section class="break-panel portugal-panel">
      <p class="break-kicker">Portugal Window Mode</p>
      <h2>Imagine this is the view outside your window.</h2>
      <img class="portugal-image" src="${image.src}" alt="${image.alt}" />
      <p class="break-copy">
        A softer horizon, a slower street, and no one asking for one more task
        right now.
      </p>
    </section>
  `;
}

function renderSpotifyBreak() {
  breakContent.innerHTML = `
    <section class="break-panel spotify-panel">
      <p class="break-kicker">Spotify Break</p>
      <h2>Mandatory break music.</h2>
      <p class="break-copy">
        Step away for a few minutes and let the tab do the emotional heavy lifting.
      </p>
      <iframe
        class="spotify-embed"
        src="${spotifyPlaylistEmbed}"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>
    </section>
  `;
}

function renderTicTacToe() {
  breakContent.innerHTML = `
    <section class="break-panel">
      <p class="break-kicker">Mini Game</p>
      <h2>Tic-Tac-Toe</h2>
      <p class="break-copy">Low stakes. Good for interrupting overthinking.</p>
      <div class="ttt-board" id="tttBoard"></div>
      <p class="ttt-status" id="tttStatus">Your turn.</p>
    </section>
  `;

  const board = document.querySelector("#tttBoard");
  const status = document.querySelector("#tttStatus");
  const cells = Array(9).fill("");
  let currentPlayer = "X";
  let winner = null;

  const winLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  function evaluateBoard() {
    for (const [a, b, c] of winLines) {
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return cells[a];
      }
    }
    return cells.every(Boolean) ? "draw" : null;
  }

  function renderBoard() {
    board.innerHTML = cells
      .map(
        (cell, index) => `
          <button class="ttt-cell" data-index="${index}" type="button">${cell}</button>
        `
      )
      .join("");

    board.querySelectorAll(".ttt-cell").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        if (cells[index] || winner) return;

        cells[index] = currentPlayer;
        winner = evaluateBoard();
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        renderBoard();

        if (winner === "draw") {
          status.textContent = "Draw. You are officially on break.";
        } else if (winner) {
          status.textContent = `${winner} wins. This counted as recovery.`;
        } else {
          status.textContent = `${currentPlayer}'s turn.`;
        }
      });
    });
  }

  renderBoard();
}

function renderPaddleGame() {
  breakContent.innerHTML = `
    <section class="break-panel">
      <p class="break-kicker">Mini Game</p>
      <h2>Calm Paddle</h2>
      <p class="break-copy">Move the paddle. Keep the ball alive. Ignore your inbox.</p>
      <canvas class="paddle-canvas" id="paddleCanvas" width="320" height="420"></canvas>
    </section>
  `;

  const canvas = document.querySelector("#paddleCanvas");
  const context = canvas.getContext("2d");
  const paddle = { width: 88, height: 10, x: 116 };
  const ball = { x: 160, y: 210, dx: 3, dy: -3, radius: 8 };

  function handleMove(event) {
    const rect = canvas.getBoundingClientRect();
    const pointerX = (event.clientX || event.touches?.[0]?.clientX || 0) - rect.left;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, pointerX - paddle.width / 2));
  }

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f6f2ee";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#7f162c";
    context.fillRect(paddle.x, canvas.height - 24, paddle.width, paddle.height);

    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fillStyle = "#5f6f52";
    context.fill();
    context.closePath();

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.dx *= -1;
    }

    if (ball.y - ball.radius < 0) {
      ball.dy *= -1;
    }

    const paddleTop = canvas.height - 24;
    if (
      ball.y + ball.radius >= paddleTop &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width
    ) {
      ball.dy *= -1;
    }

    if (ball.y + ball.radius > canvas.height) {
      ball.x = 160;
      ball.y = 210;
      ball.dx = 3;
      ball.dy = -3;
    }

    paddleLoopId = window.requestAnimationFrame(draw);
  }

  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("touchmove", handleMove, { passive: true });
  draw();
}

function renderMiniGame() {
  const gameRenderers = [renderTicTacToe, renderPaddleGame];
  const renderGame = gameRenderers[Math.floor(Math.random() * gameRenderers.length)];
  renderGame();
}

function launchBreakActivity() {
  const activities = [renderMiniGame, renderPortugalWindow, renderSpotifyBreak];
  const message = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
  const activity = activities[Math.floor(Math.random() * activities.length)];

  openBreakOverlay();
  breakLoading.textContent = message;
  breakContent.innerHTML = "";

  breakSequenceId = window.setTimeout(() => {
    breakLoading.textContent = "";
    activity();
  }, 850);
}

breakFab.addEventListener("click", launchBreakActivity);
breakClose.addEventListener("click", closeBreakOverlay);
breakOverlay.addEventListener("click", (event) => {
  if (event.target === breakOverlay) {
    closeBreakOverlay();
  }
});

loadHomePreview();
syncEidBanner();
