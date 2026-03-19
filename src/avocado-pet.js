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
    <div class="avocado-bubble" id="avocadoBubble">
      <p class="panel-label" id="avocadoMoodLabel">Avocado</p>
      <p class="avocado-message" id="avocadoMessage">Ready when you are.</p>
    </div>
    <div class="avocado-stage">
      <img class="avocado-figure avocado-down" src="./public/avocado-down.png" alt="" />
      <img class="avocado-figure avocado-up" src="./public/avocado-up.png" alt="" />
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
    if (next.face) ui.pet.dataset.mood = next.face;
    if (next.intro) {
      intro = next.intro;
      if (ui.pet.classList.contains("active")) {
        ui.message.textContent = intro;
      }
    }
  }

  setState({
    label: config.label || "Avocado",
    face: config.face || "neutral",
    intro,
  });

  ui.pet.addEventListener("click", () => {
    const isActive = ui.pet.classList.toggle("active");
    ui.bubble.classList.toggle("active", isActive);
    ui.message.textContent = isActive ? nextJoke() : "";
  });

  ui.pet.classList.remove("active");
  ui.bubble.classList.remove("active");
  ui.message.textContent = "";

  const api = { setState };
  window.__modeHubAvocado = api;
  return api;
}
