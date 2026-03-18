export const refreshHours = 6;

export const fallbackNews = [
  {
    title: "Training intensity remains the headline theme",
    description:
      "Session clips and reports continue to focus on sharp movement, finishing reps, and preparation discipline.",
    category: "training",
    date: "18 Mar 2026",
    source: "Ronaldo Mode fallback",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
    link: "#",
  },
  {
    title: "Form conversation stays active across football coverage",
    description:
      "Recent reporting keeps the spotlight on output, longevity, and what another strong stretch means for the wider legacy debate.",
    category: "news",
    date: "17 Mar 2026",
    source: "Ronaldo Mode fallback",
    image:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80",
    link: "#",
  },
  {
    title: "Supporter energy keeps building around the next match",
    description:
      "Preview chatter centers on expectations, goal involvement, and whether another decisive moment is coming.",
    category: "match",
    date: "16 Mar 2026",
    source: "Ronaldo Mode fallback",
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=900&q=80",
    link: "#",
  },
];

export const recentMatches = [
  {
    opponent: "Al Hilal",
    score: "2 - 1",
    goals: 1,
    assists: 1,
    competition: "Saudi Pro League",
    result: "Win",
  },
  {
    opponent: "Al Ahli",
    score: "3 - 0",
    goals: 2,
    assists: 0,
    competition: "King Cup",
    result: "Win",
  },
  {
    opponent: "Al Ittihad",
    score: "1 - 1",
    goals: 1,
    assists: 0,
    competition: "Saudi Pro League",
    result: "Draw",
  },
];

export const quotes = [
  "Talent starts the race. Discipline wins it in the end.",
  "Pressure is only loud when your standards are quiet.",
  "Confidence looks different when the work is already done.",
  "Stay hungry enough that yesterday’s win feels small.",
];

export const dailyMoods = [
  {
    label: "Focus Level",
    value: "Relentless",
    description: "Tunnel vision for the next rep, the next sprint, the next result.",
  },
  {
    label: "Confidence Meter",
    value: "Elite",
    description: "Calm, sharp, and not asking permission to play big.",
  },
  {
    label: "Fan Energy",
    value: "SIUU Ready",
    description: "Built for momentum swings, highlight moments, and clean finishes.",
  },
];

export const dailyQuizzes = [
  {
    prompt: "Which shirt number is most strongly associated with Cristiano Ronaldo?",
    options: ["7", "9", "10", "11"],
    answer: 0,
    explanation: "The number 7 became central to his CR7 identity across club and brand culture.",
  },
  {
    prompt: "Which national team does Cristiano Ronaldo captain?",
    options: ["Spain", "Portugal", "Brazil", "Argentina"],
    answer: 1,
    explanation: "Ronaldo is Portugal's captain and most iconic modern national team figure.",
  },
  {
    prompt: "What is Ronaldo especially known for after scoring a big goal?",
    options: ["A salute", "A backflip", "The SIUU celebration", "A knee slide only"],
    answer: 2,
    explanation: "The SIUU celebration is the signature response most fans immediately associate with him.",
  },
  {
    prompt: "Which part of Ronaldo's game is most often praised alongside his finishing?",
    options: ["Work ethic", "Goalkeeping", "Long throw-ins", "Defensive clearances"],
    answer: 0,
    explanation: "His discipline, preparation, and work ethic are constant parts of the discussion around him.",
  },
];

export const nextMatch = {
  opponent: "Al Najma",
  competition: "Saudi Pro League",
  dateLabel: "03 Apr 2026",
  timeLabel: "Time varies by locale",
  note: "Next known fixture as listed on ESPN's Al Nassr fixtures page on 18 Mar 2026.",
};

export const newsFeedUrl = "/api/ronaldo-news";
export const matchesFeedUrl = "/api/ronaldo-matches";
