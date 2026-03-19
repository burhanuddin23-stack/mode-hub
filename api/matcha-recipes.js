const RECIPE_SOURCES = [
  {
    name: "Jade Leaf Matcha",
    listingUrl: "https://www.jadeleafmatcha.com/blogs/matcha-recipes",
    origin: "https://www.jadeleafmatcha.com",
  },
  {
    name: "Tenzo",
    listingUrl: "https://tenzotea.co/blogs/matcha-handbook",
    origin: "https://tenzotea.co",
  },
  {
    name: "Naoki Matcha",
    listingUrl: "https://naokimatcha.com/blogs/recipes",
    origin: "https://naokimatcha.com",
  },
];

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value = "") {
  return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function inferTag(title = "", description = "") {
  const haystack = `${title} ${description}`.toLowerCase();

  if (haystack.includes("iced")) return "iced";
  if (haystack.includes("latte")) return "latte";
  if (haystack.includes("cookie") || haystack.includes("cake") || haystack.includes("bread")) {
    return "dessert";
  }
  if (haystack.includes("easy")) return "easy";
  if (haystack.includes("hot")) return "hot";
  return "creative";
}

function normalizeLink(link, origin) {
  try {
    return new URL(link, origin).toString();
  } catch {
    return "";
  }
}

function isUsefulRecipeCard(title, url) {
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (!title || title.length < 6) return false;
  if (!/matcha|latte|tea|dessert|cookie|cake|bread|pudding|lemonade/i.test(`${title} ${url}`)) {
    return false;
  }

  return !/account|contact|privacy|policy|terms|shop|cart|collections|products/.test(
    `${lowerTitle} ${lowerUrl}`
  );
}

function extractCards(html, source) {
  const cards = [];
  const seen = new Set();
  const regex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(html)) && cards.length < 4) {
    const link = normalizeLink(match[1], source.origin);
    if (!link.startsWith(source.origin) || seen.has(link)) continue;
    if (!/\/blogs\//.test(link)) continue;

    const title = stripTags(match[2]).split(/\s{2,}|\n+/).map((line) => line.trim()).filter(Boolean).pop() || "";
    if (!isUsefulRecipeCard(title, link)) continue;

    seen.add(link);
    cards.push({ link, title, source: source.name });
  }

  return cards;
}

function extractMeta(html, property, attr = "property") {
  const regex = new RegExp(
    `<meta[^>]+${attr}=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return match ? decodeHtml(match[1]) : "";
}

function extractFirstParagraph(html) {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return match ? stripTags(match[1]) : "";
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Matcha-Mode-Recipes/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Recipe fetch failed with ${response.status}`);
  }

  return response.text();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const listingPages = await Promise.allSettled(
      RECIPE_SOURCES.map(async (source) => ({
        source,
        html: await fetchText(source.listingUrl),
      }))
    );

    const candidateCards = listingPages
      .filter((entry) => entry.status === "fulfilled")
      .flatMap((entry) => extractCards(entry.value.html, entry.value.source));
    const seenTitles = new Set();
    const uniqueCards = candidateCards.filter((card) => {
      const normalizedTitle = card.title.toLowerCase();
      if (seenTitles.has(normalizedTitle)) return false;
      seenTitles.add(normalizedTitle);
      return true;
    });

    if (!uniqueCards.length) {
      throw new Error("No recipe cards found");
    }

    const recipeDetails = (
      await Promise.allSettled(
        uniqueCards.slice(0, 9).map(async (card) => {
          const articleHtml = await fetchText(card.link);
          const title = extractMeta(articleHtml, "og:title") || card.title;
          const description =
            extractMeta(articleHtml, "og:description", "property") ||
            extractMeta(articleHtml, "description", "name") ||
            extractFirstParagraph(articleHtml) ||
            "A fresh matcha recipe to try.";
          const image = extractMeta(articleHtml, "og:image");

          return {
            title: title.replace(/\s*[–-]\s*(Jade Leaf Matcha US|Tenzo Tea|Naoki Matcha).*$/i, "").trim(),
            description,
            image,
            link: card.link,
            source: card.source,
            tag: inferTag(title, description),
          };
        })
      )
    )
      .filter((entry) => entry.status === "fulfilled")
      .map((entry) => entry.value);

    res.setHeader("Cache-Control", "s-maxage=259200, stale-while-revalidate=86400");
    return res.status(200).json({
      fetchedAt: new Date().toISOString(),
      source: RECIPE_SOURCES.map((entry) => entry.name),
      recipes: recipeDetails,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to fetch live matcha recipes",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
