const AVOCADO_JOKES = [
  "I am avo-control and proud of it.",
  "You could say I am working on my core strength.",
  "This plan is looking ripe for progress.",
  "Do not let your goals turn into guac and mirrors.",
  "A clean streak a day keeps the slump away.",
  "I am not extra. I am avo-cado.",
  "That run had good avo-cardio energy.",
  "Lifting and logging. Very avo-gant.",
  "Keep going. We are too far in to become toast now.",
  "Your consistency is looking un-peel-ievable.",
  "Miss a day if you must. Just do not ghost the board.",
  "I support balanced macros and emotionally stable check-ins.",
];

const PET_MARKUP = `
  <button class="avocado-pet" id="avocadoPet" type="button" aria-label="Avocado companion">
    <div class="avocado-bubble active" id="avocadoBubble">
      <p class="panel-label" id="avocadoMoodLabel">Avocado</p>
      <p class="avocado-message" id="avocadoMessage">Ready when you are.</p>
    </div>
    <div class="avocado-stage">
      <svg class="avocado-sprite" viewBox="0 0 96 104" aria-hidden="true" shape-rendering="crispEdges">
        <ellipse class="avocado-shadow" cx="48" cy="92" rx="26" ry="8"></ellipse>
        <path class="avocado-outline" d="M44 8h8v4h8v4h8v8h4v8h4v24h-4v12h-4v8h-8v8h-8v4H40v-4h-8v-4h-8v-8h-8v-8h-4V56H8V32h4v-8h4v-8h8v-4h8v-4h12z"></path>
        <path class="avocado-flesh" d="M44 16h8v4h8v4h4v8h4v24h-4v12h-4v4h-8v4H40v-4h-8v-4h-4v-8h-4V56h-4V32h4v-8h4v-4h8v-4h8z"></path>
        <path class="avocado-seed-outer" d="M44 44h8v4h8v8h4v12h-4v8h-8v4h-8v-4h-8v-8h-4V56h4v-8h8z"></path>
        <path class="avocado-seed-inner" d="M44 48h8v4h4v8h4v4h-4v8h-4v4h-8v-4h-4v-8h-4v-8h4v-4h4z"></path>
        <g class="avocado-face-svg" id="avocadoFace" data-face="neutral">
          <rect class="eye-left" x="32" y="40" width="4" height="4"></rect>
          <rect class="eye-right" x="60" y="40" width="4" height="4"></rect>
          <rect class="mouth-neutral" x="42" y="54" width="12" height="4"></rect>
          <path class="mouth-happy" d="M38 52h4v4h4v4h4v-4h4v-4h4v4h-4v4h-4v4h-8v-4h-4v-4h-4z"></path>
          <path class="mouth-proud" d="M38 54h4v4h4v4h4v-4h4v-4h4v4h-4v4h-4v4h-8v-4h-4v-4h-4z"></path>
          <path class="mouth-concerned" d="M38 58h4v-4h4v-4h8v4h4v4h4v-4h-4v-4H42v4h-4z"></path>
          <rect class="mouth-hyped" x="40" y="52" width="16" height="8"></rect>
        </g>
        <rect class="avocado-leg left" x="28" y="80" width="8" height="12"></rect>
        <rect class="avocado-leg right" x="60" y="80" width="8" height="12"></rect>
      </svg>
    </div>
  </button>
`;

function shuffle(array) {
  const cloned = [...array];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[next]] = [cloned[next], cloned[index]];
  }
  return cloned;
}

function ensurePet() {
  let pet = document.querySelector("#avocadoPet");
  if (!pet) {
    document.body.insertAdjacentHTML("beforeend", PET_MARKUP);
    pet = document.querySelector("#avocadoPet");
  }

  return {
    pet,
    bubble: document.querySelector("#avocadoBubble"),
    moodLabel: document.querySelector("#avocadoMoodLabel"),
    message: document.querySelector("#avocadoMessage"),
    face: document.querySelector("#avocadoFace"),
  };
}

export function initAvocadoPet(config = {}) {
  if (window.__modeHubAvocado) {
    if (config.label || config.face || config.intro) {
      window.__modeHubAvocado.setState(config);
    }
    return window.__modeHubAvocado;
  }

  const ui = ensurePet();
  let jokeDeck = shuffle(AVOCADO_JOKES);
  let jokeIndex = 0;
  let intro = config.intro || "Ready when you are.";

  function nextJoke() {
    if (jokeIndex >= jokeDeck.length) {
      jokeDeck = shuffle(AVOCADO_JOKES);
      jokeIndex = 0;
    }

    const joke = jokeDeck[jokeIndex];
    jokeIndex += 1;
    return joke;
  }

  function setState(next = {}) {
    if (next.label) ui.moodLabel.textContent = next.label;
    if (next.face) {
      ui.face.dataset.face = next.face;
      ui.pet.dataset.mood = next.face;
    }
    if (next.intro) {
      intro = next.intro;
      ui.message.textContent = intro;
    }
  }

  setState({
    label: config.label || "Avocado",
    face: config.face || "neutral",
    intro,
  });

  ui.pet.addEventListener("click", () => {
    ui.message.textContent = nextJoke();
    ui.bubble.classList.add("active");
  });

  const api = { setState };
  window.__modeHubAvocado = api;
  return api;
}
