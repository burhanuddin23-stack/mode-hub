const STORAGE_KEY = "mode-hub-discipline-v1";

const DEFAULT_GOALS = {
  weeklyGym: 4,
  weeklyRunKm: 15,
  dailySteps: 10000,
  streak: 7,
};

const goalForm = document.querySelector("#goalForm");
const entryForm = document.querySelector("#entryForm");
const entryStatus = document.querySelector("#entryStatus");
const goalGrid = document.querySelector("#goalGrid");
const summaryGrid = document.querySelector("#summaryGrid");
const bestGrid = document.querySelector("#bestGrid");
const entryList = document.querySelector("#entryList");
const disciplineCurrentStreak = document.querySelector("#disciplineCurrentStreak");
const disciplineWeeklyScore = document.querySelector("#disciplineWeeklyScore");
const disciplineWeeklyDetail = document.querySelector("#disciplineWeeklyDetail");
const avocadoPet = document.querySelector("#avocadoPet");
const avocadoBubble = document.querySelector("#avocadoBubble");
const avocadoMoodLabel = document.querySelector("#avocadoMoodLabel");
const avocadoMessage = document.querySelector("#avocadoMessage");
const avocadoFace = document.querySelector("#avocadoFace");
let avocadoLines = ["Ready when you are."];
let avocadoLineIndex = 0;

const goalWeeklyGym = document.querySelector("#goalWeeklyGym");
const goalWeeklyRunKm = document.querySelector("#goalWeeklyRunKm");
const goalDailySteps = document.querySelector("#goalDailySteps");
const goalStreak = document.querySelector("#goalStreak");

const entryDate = document.querySelector("#entryDate");
const entryGymCompleted = document.querySelector("#entryGymCompleted");
const entryRunCompleted = document.querySelector("#entryRunCompleted");
const entryRunDistanceKm = document.querySelector("#entryRunDistanceKm");
const entryRunMinutes = document.querySelector("#entryRunMinutes");
const entrySteps = document.querySelector("#entrySteps");
const entryWaterLiters = document.querySelector("#entryWaterLiters");
const entrySleepHours = document.querySelector("#entrySleepHours");
const entryNotes = document.querySelector("#entryNotes");

function getTodayLabel() {
  return new Date().toISOString().slice(0, 10);
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getDefaultState() {
  return {
    version: 1,
    source: "manual",
    goals: { ...DEFAULT_GOALS },
    entries: [],
  };
}

function loadState() {
  if (!canUseStorage()) return getDefaultState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : getDefaultState();
    return {
      ...getDefaultState(),
      ...parsed,
      goals: {
        ...DEFAULT_GOALS,
        ...(parsed.goals || {}),
      },
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
  } catch {
    return getDefaultState();
  }
}

function saveState(state) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatOneDecimal(value) {
  return `${Math.round(value * 10) / 10}`;
}

function formatPace(minutes, distanceKm) {
  if (!minutes || !distanceKm) return "-";
  const totalMinutesPerKm = minutes / distanceKm;
  const paceMinutes = Math.floor(totalMinutesPerKm);
  const paceSeconds = Math.round((totalMinutesPerKm - paceMinutes) * 60);
  return `${paceMinutes}:${String(paceSeconds).padStart(2, "0")} /km`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => right.date.localeCompare(left.date));
}

function getWeekStart(date = new Date()) {
  const target = new Date(date);
  const day = target.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  target.setDate(target.getDate() + diff);
  target.setHours(0, 0, 0, 0);
  return target;
}

function isInCurrentWeek(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

function isActiveDay(entry) {
  return Boolean(entry.gymCompleted || entry.runCompleted);
}

function calculateCurrentStreak(entries) {
  const byDate = sortEntries(entries);
  let streak = 0;
  let cursor = new Date(getTodayLabel());

  while (true) {
    const label = cursor.toISOString().slice(0, 10);
    const entry = byDate.find((item) => item.date === label);
    if (!entry || !isActiveDay(entry)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calculateBestStreak(entries) {
  const byDate = [...entries].sort((left, right) => left.date.localeCompare(right.date));
  let best = 0;
  let current = 0;
  let previousDate = null;

  byDate.forEach((entry) => {
    if (!isActiveDay(entry)) {
      current = 0;
      previousDate = null;
      return;
    }

    const currentDate = new Date(entry.date);
    if (previousDate) {
      const expected = new Date(previousDate);
      expected.setDate(expected.getDate() + 1);
      if (currentDate.toISOString().slice(0, 10) === expected.toISOString().slice(0, 10)) {
        current += 1;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }

    previousDate = currentDate;
    if (current > best) best = current;
  });

  return best;
}

function getWeeklyStats(entries, goals) {
  const weeklyEntries = entries.filter((entry) => isInCurrentWeek(entry.date));
  const gymCount = weeklyEntries.filter((entry) => entry.gymCompleted).length;
  const runDistanceKm = weeklyEntries.reduce((sum, entry) => sum + parseNumber(entry.runDistanceKm), 0);
  const runMinutes = weeklyEntries.reduce((sum, entry) => sum + parseNumber(entry.runMinutes), 0);
  const steps = weeklyEntries.reduce((sum, entry) => sum + parseNumber(entry.steps), 0);
  const activeDays = weeklyEntries.filter((entry) => isActiveDay(entry)).length;

  return {
    gymCount,
    runDistanceKm,
    runMinutes,
    steps,
    activeDays,
    averagePace: formatPace(runMinutes, runDistanceKm),
    gymGoalMet: gymCount >= goals.weeklyGym,
    runGoalMet: runDistanceKm >= goals.weeklyRunKm,
  };
}

function getPersonalBests(entries) {
  const runs = entries.filter((entry) => parseNumber(entry.runDistanceKm) > 0);
  const bestDistanceEntry = runs.reduce(
    (best, entry) =>
      !best || parseNumber(entry.runDistanceKm) > parseNumber(best.runDistanceKm) ? entry : best,
    null
  );
  const bestPaceEntry = runs
    .filter((entry) => parseNumber(entry.runMinutes) > 0)
    .reduce((best, entry) => {
      const currentPace = parseNumber(entry.runMinutes) / parseNumber(entry.runDistanceKm);
      if (!best) return entry;
      const bestPace = parseNumber(best.runMinutes) / parseNumber(best.runDistanceKm);
      return currentPace < bestPace ? entry : best;
    }, null);
  const stepEntry = entries.reduce(
    (best, entry) => (!best || parseNumber(entry.steps) > parseNumber(best.steps) ? entry : best),
    null
  );

  return {
    longestRun: bestDistanceEntry
      ? `${formatOneDecimal(parseNumber(bestDistanceEntry.runDistanceKm))} km`
      : "-",
    fastestPace: bestPaceEntry
      ? formatPace(parseNumber(bestPaceEntry.runMinutes), parseNumber(bestPaceEntry.runDistanceKm))
      : "-",
    bestStepDay: stepEntry && parseNumber(stepEntry.steps) > 0 ? `${parseNumber(stepEntry.steps)}` : "-",
    bestStreak: calculateBestStreak(entries),
  };
}

function getAvocadoState({ goals, weeklyStats, currentStreak, entries }) {
  const todayEntry = entries.find((entry) => entry.date === getTodayLabel());
  const goalHits = Number(weeklyStats.gymGoalMet) + Number(weeklyStats.runGoalMet);

  if (goalHits === 2) {
    return {
      mood: "Hyped",
      face: "hyped",
      lines: [
        "Week handled. Keep the standard high.",
        "That board looks serious now.",
      ],
    };
  }

  if (todayEntry && isActiveDay(todayEntry)) {
    return {
      mood: "Locked in",
      face: "happy",
      lines: [
        "Today is already logged. That helps tomorrow.",
        "Good. One less thing hanging over you.",
      ],
    };
  }

  if (currentStreak >= goals.streak) {
    return {
      mood: "On fire",
      face: "proud",
      lines: [
        "Streak goal matched. Keep feeding it.",
        "Consistency looks good on you.",
      ],
    };
  }

  if (!entries.length) {
    return {
      mood: "Waiting",
      face: "neutral",
      lines: [
        "Start with one entry. The board gets better fast.",
        "One line today is enough to begin.",
      ],
    };
  }

  if (weeklyStats.gymCount === 0 && weeklyStats.runDistanceKm === 0) {
    return {
      mood: "Concerned",
      face: "concerned",
      lines: [
        "Quiet week so far. One session changes the tone.",
        "You do not need a perfect week. Just movement.",
      ],
    };
  }

  return {
    mood: "Steady",
    face: "neutral",
    lines: [
      "You are mid-week. Keep the momentum alive.",
      "A decent week can still become a strong one.",
    ],
  };
}

function renderAvocado(data) {
  if (!avocadoPet) return;

  const state = getAvocadoState(data);
  avocadoLines = state.lines;
  avocadoLineIndex = 0;
  avocadoMoodLabel.textContent = state.mood;
  avocadoMessage.textContent = avocadoLines[avocadoLineIndex];
  avocadoFace.dataset.face = state.face;
  avocadoPet.dataset.mood = state.face;
  avocadoBubble.classList.add("active");
}

function renderGoalInputs(goals) {
  goalWeeklyGym.value = goals.weeklyGym;
  goalWeeklyRunKm.value = goals.weeklyRunKm;
  goalDailySteps.value = goals.dailySteps;
  goalStreak.value = goals.streak;
}

function renderGoals(goals, weeklyStats, currentStreak) {
  const cards = [
    {
      label: "Weekly gym",
      value: `${weeklyStats.gymCount}/${goals.weeklyGym}`,
      detail: weeklyStats.gymGoalMet ? "On target" : "Still building",
    },
    {
      label: "Weekly run",
      value: `${formatOneDecimal(weeklyStats.runDistanceKm)}/${formatOneDecimal(goals.weeklyRunKm)} km`,
      detail: weeklyStats.runGoalMet ? "On target" : "Still building",
    },
    {
      label: "Daily steps",
      value: `${goals.dailySteps}`,
      detail: "Steps target",
    },
    {
      label: "Streak",
      value: `${currentStreak}/${goals.streak} days`,
      detail: currentStreak >= goals.streak ? "Goal matched" : "Keep going",
    },
  ];

  goalGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="discipline-goal-card">
          <p class="panel-label">${card.label}</p>
          <h4>${card.value}</h4>
          <p class="card-description">${card.detail}</p>
        </article>
      `
    )
    .join("");
}

function renderSummary(weeklyStats) {
  const cards = [
    {
      label: "Gym sessions",
      value: `${weeklyStats.gymCount}`,
      detail: "Completed this week",
    },
    {
      label: "Run distance",
      value: `${formatOneDecimal(weeklyStats.runDistanceKm)} km`,
      detail: "Logged this week",
    },
    {
      label: "Average pace",
      value: weeklyStats.averagePace,
      detail: "Across this week's runs",
    },
    {
      label: "Steps",
      value: `${weeklyStats.steps}`,
      detail: "Total this week",
    },
  ];

  summaryGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="discipline-summary-card">
          <p class="panel-label">${card.label}</p>
          <h4>${card.value}</h4>
          <p class="card-description">${card.detail}</p>
        </article>
      `
    )
    .join("");
}

function renderPersonalBests(bestStats) {
  const cards = [
    {
      label: "Longest run",
      value: bestStats.longestRun,
    },
    {
      label: "Fastest pace",
      value: bestStats.fastestPace,
    },
    {
      label: "Best step day",
      value: bestStats.bestStepDay,
    },
    {
      label: "Best streak",
      value: `${bestStats.bestStreak} days`,
    },
  ];

  bestGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="discipline-best-card">
          <p class="panel-label">${card.label}</p>
          <h4>${card.value}</h4>
        </article>
      `
    )
    .join("");
}

function renderEntries(entries) {
  const visibleEntries = sortEntries(entries).slice(0, 7);

  entryList.innerHTML = visibleEntries.length
    ? visibleEntries
        .map(
          (entry) => `
            <article class="discipline-entry-card">
              <div class="card-topline">
                <span class="tag">${formatDate(entry.date)}</span>
                <span class="update-date">${entry.source || "manual"}</span>
              </div>
              <h4>${entry.gymCompleted ? "Gym" : "Gym off"} · ${entry.runCompleted ? "Run" : "Run off"}</h4>
              <div class="discipline-entry-metrics">
                <span>${formatOneDecimal(parseNumber(entry.runDistanceKm))} km</span>
                <span>${parseNumber(entry.runMinutes)} min</span>
                <span>${parseNumber(entry.steps)} steps</span>
              </div>
              <p class="card-description">${entry.notes || "No note added."}</p>
            </article>
          `
        )
        .join("")
    : `
      <article class="archive-empty panel-subsection">
        <p class="panel-label">Daily Log</p>
        <h3>No entries yet.</h3>
      </article>
    `;
}

function renderDashboard(state) {
  const currentStreak = calculateCurrentStreak(state.entries);
  const weeklyStats = getWeeklyStats(state.entries, state.goals);
  const personalBests = getPersonalBests(state.entries);

  renderGoalInputs(state.goals);
  renderGoals(state.goals, weeklyStats, currentStreak);
  renderSummary(weeklyStats);
  renderPersonalBests(personalBests);
  renderEntries(state.entries);

  disciplineCurrentStreak.textContent = `${currentStreak} day${currentStreak === 1 ? "" : "s"}`;
  disciplineWeeklyScore.textContent = `${weeklyStats.gymCount} / ${state.goals.weeklyGym}`;
  disciplineWeeklyDetail.textContent = `Gym ${weeklyStats.gymCount} · Run ${formatOneDecimal(weeklyStats.runDistanceKm)} km`;
  renderAvocado({ goals: state.goals, weeklyStats, currentStreak, entries: state.entries });
}

function fillEntryForm(entry = null) {
  const source = entry || {
    date: getTodayLabel(),
    gymCompleted: false,
    runCompleted: false,
    runDistanceKm: 0,
    runMinutes: 0,
    steps: 0,
    waterLiters: 0,
    sleepHours: 0,
    notes: "",
  };

  entryDate.value = source.date;
  entryGymCompleted.checked = Boolean(source.gymCompleted);
  entryRunCompleted.checked = Boolean(source.runCompleted);
  entryRunDistanceKm.value = source.runDistanceKm || "";
  entryRunMinutes.value = source.runMinutes || "";
  entrySteps.value = source.steps || "";
  entryWaterLiters.value = source.waterLiters || "";
  entrySleepHours.value = source.sleepHours || "";
  entryNotes.value = source.notes || "";
}

function buildEntryPayload() {
  return {
    date: entryDate.value,
    gymCompleted: entryGymCompleted.checked,
    runCompleted: entryRunCompleted.checked,
    runDistanceKm: parseNumber(entryRunDistanceKm.value),
    runMinutes: parseNumber(entryRunMinutes.value),
    steps: parseNumber(entrySteps.value),
    waterLiters: parseNumber(entryWaterLiters.value),
    sleepHours: parseNumber(entrySleepHours.value),
    notes: entryNotes.value.trim(),
    source: "manual",
  };
}

let state = loadState();

if (avocadoPet) {
  avocadoPet.addEventListener("click", () => {
    avocadoLineIndex = (avocadoLineIndex + 1) % avocadoLines.length;
    avocadoMessage.textContent = avocadoLines[avocadoLineIndex];
  });
}

goalForm.addEventListener("submit", (event) => {
  event.preventDefault();

  state = {
    ...state,
    goals: {
      weeklyGym: parseNumber(goalWeeklyGym.value, DEFAULT_GOALS.weeklyGym),
      weeklyRunKm: parseNumber(goalWeeklyRunKm.value, DEFAULT_GOALS.weeklyRunKm),
      dailySteps: parseNumber(goalDailySteps.value, DEFAULT_GOALS.dailySteps),
      streak: parseNumber(goalStreak.value, DEFAULT_GOALS.streak),
    },
  };

  saveState(state);
  renderDashboard(state);
});

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nextEntry = buildEntryPayload();
  const nextEntries = state.entries.filter((entry) => entry.date !== nextEntry.date);
  nextEntries.push(nextEntry);

  state = {
    ...state,
    entries: nextEntries,
  };

  saveState(state);
  renderDashboard(state);
  fillEntryForm(nextEntry);
  entryStatus.textContent = `Saved ${formatDate(nextEntry.date)}.`;
});

entryDate.addEventListener("change", () => {
  const existing = state.entries.find((entry) => entry.date === entryDate.value);
  fillEntryForm(existing || { date: entryDate.value });
});

fillEntryForm(state.entries.find((entry) => entry.date === getTodayLabel()));
renderDashboard(state);
