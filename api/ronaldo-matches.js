const TEAM_ID = "136022";
const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

function formatDateLabel(value) {
  if (!value) {
    return "Date TBD";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getResult(homeScore, awayScore, isHomeTeam) {
  if (homeScore == null || awayScore == null) {
    return "Scheduled";
  }

  const teamScore = isHomeTeam ? homeScore : awayScore;
  const opponentScore = isHomeTeam ? awayScore : homeScore;

  if (teamScore > opponentScore) {
    return "Win";
  }

  if (teamScore < opponentScore) {
    return "Loss";
  }

  return "Draw";
}

function mapNextMatch(event) {
  const isHomeTeam = event.idHomeTeam === TEAM_ID;
  const opponent = isHomeTeam ? event.strAwayTeam : event.strHomeTeam;
  const timestamp = event.strTimestamp || event.dateEvent;

  return {
    opponent,
    competition: event.strLeague || "Competition TBD",
    dateLabel: formatDateLabel(timestamp),
    timeLabel: event.strTimeLocal || event.strTime || "Time TBD",
    note: "Live fixture from TheSportsDB.",
  };
}

function mapRecentMatch(event) {
  const isHomeTeam = event.idHomeTeam === TEAM_ID;
  const opponent = isHomeTeam ? event.strAwayTeam : event.strHomeTeam;
  const homeScore = Number(event.intHomeScore);
  const awayScore = Number(event.intAwayScore);
  const teamScore = isHomeTeam ? homeScore : awayScore;
  const opponentScore = isHomeTeam ? awayScore : homeScore;

  return {
    opponent,
    score: `${teamScore} - ${opponentScore}`,
    goals: null,
    assists: null,
    competition: event.strLeague || "Competition TBD",
    result: getResult(homeScore, awayScore, isHomeTeam),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Ronaldo-Mode-Matches-Proxy/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Fixtures request failed with ${response.status}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [nextPayload, pastPayload] = await Promise.all([
      fetchJson(`${BASE_URL}/eventsnext.php?id=${TEAM_ID}`),
      fetchJson(`${BASE_URL}/eventslast.php?id=${TEAM_ID}`),
    ]);

    const nextEvent = nextPayload.events?.[0];
    const pastEvents = (pastPayload.results || []).slice(0, 3);

    if (!nextEvent && !pastEvents.length) {
      throw new Error("No fixtures returned from TheSportsDB");
    }

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=21600");
    return res.status(200).json({
      fetchedAt: new Date().toISOString(),
      source: "TheSportsDB",
      nextMatch: nextEvent ? mapNextMatch(nextEvent) : null,
      recentMatches: pastEvents.map(mapRecentMatch),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to fetch live Ronaldo match data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
