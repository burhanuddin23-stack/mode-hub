const TEAM_ID = "136022";
const TEAM_NAME = "Al Nassr";
const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";
const ESPN_RESULTS_URL = "https://www.espn.com/soccer/team/results/_/id/817/al-nassr";
const ESPN_FIXTURES_URL = "https://www.espn.com/soccer/team/fixtures/_/id/817/al-nassr";

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function formatDateLabel(value) {
  if (!value) return "Date TBD";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatScore(value) {
  return Number.isFinite(value) ? String(value) : "-";
}

function formatTimeLabel(timestamp, fallbackTime) {
  if (timestamp) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(date);
    }
  }

  return fallbackTime || "Time TBD";
}

function normalizeTimestamp(dateEvent, timeValue) {
  if (!dateEvent) return "";
  if (!timeValue) return `${dateEvent}T18:00:00Z`;

  const cleanTime = timeValue.replace("Z", "");
  return `${dateEvent}T${cleanTime}Z`;
}

function getResult(homeScore, awayScore, isHomeTeam) {
  if (homeScore == null || awayScore == null) return "Scheduled";

  const teamScore = isHomeTeam ? homeScore : awayScore;
  const opponentScore = isHomeTeam ? awayScore : homeScore;

  if (teamScore > opponentScore) return "Win";
  if (teamScore < opponentScore) return "Loss";
  return "Draw";
}

function htmlToLines(html) {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(p|div|li|tr|td|th|h1|h2|h3|h4|section|article|a|span|br)>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => line !== "Image" && line !== "hidden");
}

function isDateLine(line) {
  return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s[A-Z][a-z]{2}\s\d{1,2}$/.test(line);
}

function isMonthLine(line) {
  return /^[A-Z][a-z]+,\s\d{4}$/.test(line);
}

function isScoreLine(line) {
  return /^\d+\s*-\s*\d+$/.test(line);
}

function isTimeLine(line) {
  return /^(\d{1,2}:\d{2}\s?(AM|PM)|TBD)$/i.test(line);
}

function normalizeEspnDate(label, mode) {
  const now = new Date();
  const currentYear = now.getFullYear();
  let date = new Date(`${label}, ${currentYear}`);

  if (Number.isNaN(date.getTime())) return "";

  if (mode === "result" && date.getTime() > now.getTime() + 7 * 86400000) {
    date = new Date(`${label}, ${currentYear - 1}`);
  }

  if (mode === "fixture" && date.getTime() < now.getTime() - 2 * 86400000) {
    const nextYearDate = new Date(`${label}, ${currentYear + 1}`);

    if (
      !Number.isNaN(nextYearDate.getTime()) &&
      nextYearDate.getTime() - now.getTime() < 120 * 86400000
    ) {
      date = nextYearDate;
    } else {
      return "";
    }
  }

  return date.toISOString();
}

function buildSearchLink(teamA, teamB, label) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${teamA} vs ${teamB} ${label}`)}`;
}

function parseEspnTime(timeValue) {
  const match = timeValue.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return "";

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}:00`;
}

function parseEspnResults(html) {
  const lines = htmlToLines(html);
  const startIndex = lines.findIndex((line) => line === "Al Nassr Results");
  if (startIndex < 0) return [];

  const results = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!isDateLine(line)) continue;

    const teamA = lines[index + 1];
    const score = lines[index + 2];
    const teamB = lines[index + 3];
    const status = lines[index + 4];
    const competition = lines[index + 5];

    if (!teamA || !teamB || !isScoreLine(score) || !competition) continue;
    if (isMonthLine(teamA) || teamA.startsWith("DATE ")) continue;

    const [homeScoreText, awayScoreText] = score.split("-").map((value) => value.trim());
    const homeScore = Number(homeScoreText);
    const awayScore = Number(awayScoreText);
    const isHomeTeam = teamA === TEAM_NAME;
    const opponent = isHomeTeam ? teamB : teamA;
    const teamScore = isHomeTeam ? homeScore : awayScore;
    const opponentScore = isHomeTeam ? awayScore : homeScore;
    const timestamp = normalizeEspnDate(line, "result");

    results.push({
      team: TEAM_NAME,
      opponent,
      score: `${teamScore} - ${opponentScore}`,
      goals: teamScore,
      assists: opponentScore,
      dateLabel: formatDateLabel(timestamp),
      competition,
      result: getResult(homeScore, awayScore, isHomeTeam),
      status,
      link: buildSearchLink(teamA, teamB, line),
      timestamp,
    });
  }

  return results.slice(0, 3);
}

function parseEspnFixtures(html) {
  const lines = htmlToLines(html);
  const startIndex = lines.findIndex((line) => line === "Al Nassr Fixtures");
  if (startIndex < 0) return null;

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!isDateLine(line)) continue;

    const teamA = lines[index + 1];
    const versus = lines[index + 2];
    let cursor = index + 3;
    if (lines[cursor] && /\d(?:st|nd|rd|th)\sLeg/i.test(lines[cursor])) {
      cursor += 1;
    }
    const teamB = lines[cursor];
    const timeValue = lines[cursor + 1];
    const competition = lines[cursor + 2];

    if (!teamA || versus !== "v" || !teamB || !isTimeLine(timeValue) || !competition) continue;

    const isHomeTeam = teamA === TEAM_NAME;
    const opponent = isHomeTeam ? teamB : teamA;
    const baseTimestamp = normalizeEspnDate(line, "fixture");
    if (!baseTimestamp) continue;

    const dateOnly = baseTimestamp ? baseTimestamp.slice(0, 10) : "";
    const timePart = /^\d/.test(timeValue) ? parseEspnTime(timeValue) : "";
    const timestamp = dateOnly
      ? normalizeTimestamp(dateOnly, timePart)
      : "";

    const finalTimestamp = timestamp || baseTimestamp;
    const fixtureDate = new Date(finalTimestamp);
    if (Number.isNaN(fixtureDate.getTime()) || fixtureDate.getTime() < Date.now() - 2 * 3600000) {
      continue;
    }

    return {
      team: TEAM_NAME,
      opponent,
      competition,
      dateLabel: formatDateLabel(finalTimestamp),
      timeLabel: timeValue === "TBD" ? "Time TBD" : timeValue,
      timestamp: finalTimestamp,
      note: "Live fixture from ESPN.",
    };
  }

  return null;
}

function mapNextMatch(event) {
  const isHomeTeam = event.idHomeTeam === TEAM_ID;
  const opponent = isHomeTeam ? event.strAwayTeam : event.strHomeTeam;
  const timestamp = event.strTimestamp || normalizeTimestamp(event.dateEvent, event.strTime);

  return {
    team: TEAM_NAME,
    opponent,
    competition: event.strLeague || "Competition TBD",
    dateLabel: formatDateLabel(timestamp),
    timeLabel: formatTimeLabel(timestamp, event.strTimeLocal || event.strTime),
    timestamp,
    note: "Live fixture from TheSportsDB.",
  };
}

function mapRecentMatch(event) {
  const isHomeTeam = event.idHomeTeam === TEAM_ID;
  const opponent = isHomeTeam ? event.strAwayTeam : event.strHomeTeam;
  const rawHomeScore = event.intHomeScore == null || event.intHomeScore === "" ? null : Number(event.intHomeScore);
  const rawAwayScore = event.intAwayScore == null || event.intAwayScore === "" ? null : Number(event.intAwayScore);
  const teamScore = isHomeTeam ? rawHomeScore : rawAwayScore;
  const opponentScore = isHomeTeam ? rawAwayScore : rawHomeScore;
  const timestamp = event.strTimestamp || normalizeTimestamp(event.dateEvent, event.strTime);

  return {
    team: TEAM_NAME,
    opponent,
    score: `${formatScore(teamScore)} - ${formatScore(opponentScore)}`,
    goals: Number.isFinite(teamScore) ? teamScore : null,
    assists: Number.isFinite(opponentScore) ? opponentScore : null,
    dateLabel: formatDateLabel(timestamp),
    competition: event.strLeague || "Competition TBD",
    result: getResult(rawHomeScore, rawAwayScore, isHomeTeam),
    link: buildSearchLink(event.strHomeTeam, event.strAwayTeam, event.dateEvent || ""),
    status: event.strStatus || event.strProgress || "",
    timestamp,
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mode-Hub-Fixtures/1.0",
      Accept: "text/html,application/xhtml+xml,application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mode-Hub-Fixtures/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Fixtures request failed with ${response.status}`);
  }

  return response.json();
}

async function fetchTheSportsDbFallback() {
  const [nextPayload, pastPayload] = await Promise.all([
    fetchJson(`${BASE_URL}/eventsnext.php?id=${TEAM_ID}`),
    fetchJson(`${BASE_URL}/eventslast.php?id=${TEAM_ID}`),
  ]);

  return {
    source: "TheSportsDB",
    nextMatch: nextPayload.events?.[0] ? mapNextMatch(nextPayload.events[0]) : null,
    recentMatches: (pastPayload.results || []).slice(0, 3).map(mapRecentMatch),
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const espnResponses = await Promise.allSettled([
      fetchText(ESPN_RESULTS_URL),
      fetchText(ESPN_FIXTURES_URL),
    ]);

    const espnResults =
      espnResponses[0].status === "fulfilled" ? parseEspnResults(espnResponses[0].value) : [];
    const espnFixture =
      espnResponses[1].status === "fulfilled" ? parseEspnFixtures(espnResponses[1].value) : null;

    let nextMatch = espnFixture;
    let recentMatches = espnResults;
    let source = "ESPN";

    if (!nextMatch || !recentMatches.length) {
      const fallback = await fetchTheSportsDbFallback();
      nextMatch = nextMatch || fallback.nextMatch;
      recentMatches = recentMatches.length ? recentMatches : fallback.recentMatches;
      source = nextMatch === espnFixture && recentMatches === espnResults ? "ESPN" : `${source} + ${fallback.source}`;
    }

    if (!nextMatch && !recentMatches.length) {
      throw new Error("No fixtures available from ESPN or TheSportsDB");
    }

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=21600");
    return res.status(200).json({
      fetchedAt: new Date().toISOString(),
      source,
      nextMatch,
      recentMatches,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to fetch live Ronaldo match data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
